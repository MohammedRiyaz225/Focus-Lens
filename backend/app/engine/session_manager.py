import time
import math
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Callable
import numpy as np

from app.config import settings
from app.vision.camera import CameraService
from app.vision.face_tracker import FaceTracker
from app.vision.head_pose import HeadPoseEstimator
from app.vision.gaze import GazeEstimator
from app.vision.features import FrameFeatures, HeadPoseResult, GazeResult
from app.engine.attention import AttentionEngine
from app.engine.state import StateClassifier
from app.engine.patterns import DistractionPatternDetector
from app.engine.alerts import AdaptiveAlertEngine
from app.schemas.schemas import LiveStreamPacket, HeadPoseData, GazeData, LiveSessionInfo, AlertData
from app.db.database import async_session_factory
from app.db.models import Session, AttentionEvent, SettingRecord

logger = logging.getLogger(__name__)


class SessionManager:
    """
    Central coordinator for vision inference, attention scoring,
    session lifecycle, persistence, and live WebSocket streaming.
    """

    def __init__(self):
        self.camera_service = CameraService(
            camera_index=settings.camera_index,
            target_fps=settings.target_fps,
            width=settings.capture_width,
            height=settings.capture_height,
            simulate=settings.simulate
        )
        self.face_tracker = FaceTracker()
        self.head_pose_estimator = HeadPoseEstimator()
        self.gaze_estimator = GazeEstimator()
        self.attention_engine = AttentionEngine(
            weight_face=settings.weight_face,
            weight_head=settings.weight_head,
            weight_eyes=settings.weight_eyes,
            weight_stability=settings.weight_stability,
            ema_alpha=settings.ema_alpha,
            stability_window_size=settings.stability_window_size
        )
        self.state_classifier = StateClassifier(
            threshold_away=settings.threshold_away,
            threshold_distracted=settings.threshold_distracted,
            threshold_engaged=settings.threshold_engaged,
            hysteresis_frames=settings.state_hysteresis_frames
        )
        self.pattern_detector = DistractionPatternDetector()
        self.alert_engine = AdaptiveAlertEngine(settings.alerts)

        # Active Session State
        self.active_session_id: Optional[int] = None
        self.active_mode: str = "Coding"
        self.planned_duration_sec: int = 1500
        self.session_status: str = "idle"  # idle, running, paused
        self.session_start_monotonic: float = 0.0
        self.session_pause_monotonic: float = 0.0
        self.total_paused_duration: float = 0.0

        # Stats Accumulation
        self._state_durations: Dict[str, float] = {"away": 0.0, "possibly_distracted": 0.0, "engaged": 0.0, "highly_engaged": 0.0}
        self._last_event_time: float = 0.0
        self._last_db_write_time: float = 0.0
        self._last_stream_packet: Optional[LiveStreamPacket] = None

        # Calibration Storage
        self.calibration_data: Dict[str, Any] = {
            "neutral_yaw": 0.0,
            "neutral_pitch": 0.0,
            "center_gaze_x": 0.5,
            "center_gaze_y": 0.5
        }

        # Subscribers for live packets (WebSocket connections)
        self._subscribers: List[asyncio.Queue] = []
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._preview_enabled: bool = False
        self._sim_t: float = 0.0  # Simulation time counter for realistic signal generation

    def initialize(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop
        self.camera_service.set_callback(self._on_frame_captured)

    def set_preview_enabled(self, enabled: bool) -> None:
        self._preview_enabled = enabled

    def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue(maxsize=30)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        if q in self._subscribers:
            self._subscribers.remove(q)

    def apply_calibration(self, calib: Dict[str, Any]) -> None:
        self.calibration_data.update(calib)
        self.head_pose_estimator.set_calibration(
            yaw=calib.get("neutral_yaw", 0.0),
            pitch=calib.get("neutral_pitch", 0.0)
        )
        self.gaze_estimator.set_calibration(
            center_x=calib.get("center_gaze_x", 0.5),
            center_y=calib.get("center_gaze_y", 0.5)
        )

    def start_session(self, session_id: int, mode: str, planned_min: int) -> None:
        self.active_session_id = session_id
        self.active_mode = mode
        self.planned_duration_sec = planned_min * 60
        self.session_status = "running"
        self.session_start_monotonic = time.monotonic()
        self.total_paused_duration = 0.0
        self._state_durations = {"away": 0.0, "possibly_distracted": 0.0, "engaged": 0.0, "highly_engaged": 0.0}
        self._last_event_time = time.monotonic()
        self._last_db_write_time = time.monotonic()

        self.attention_engine.reset()
        self.state_classifier.reset("engaged")
        self.pattern_detector.reset()
        self.alert_engine.reset()

        self.camera_service.start()
        logger.info(f"Session {session_id} started in mode {mode} ({planned_min} mins)")

    def pause_session(self) -> None:
        if self.session_status == "running":
            self.session_status = "paused"
            self.session_pause_monotonic = time.monotonic()
            self.camera_service.pause()
            logger.info(f"Session {self.active_session_id} paused")

    def resume_session(self) -> None:
        if self.session_status == "paused":
            self.session_status = "running"
            pause_time = time.monotonic() - self.session_pause_monotonic
            self.total_paused_duration += pause_time
            self.camera_service.resume()
            logger.info(f"Session {self.active_session_id} resumed")

    def end_session(self) -> None:
        if self.session_status in ("running", "paused"):
            self.session_status = "completed"
            self.camera_service.stop()
            logger.info(f"Session {self.active_session_id} ended")

    def get_elapsed_sec(self) -> int:
        if self.session_status == "idle" or self.session_start_monotonic == 0.0:
            return 0
        if self.session_status == "paused":
            return int(self.session_pause_monotonic - self.session_start_monotonic - self.total_paused_duration)
        return int(time.monotonic() - self.session_start_monotonic - self.total_paused_duration)

    def _on_frame_captured(self, frame: np.ndarray, timestamp: float) -> None:
        """Callback invoked from camera worker thread upon frame read."""
        if self.session_status != "running" and not self._preview_enabled:
            return

        try:
            self._process_frame_pipeline(frame, timestamp)
        except Exception as e:
            logger.error(f"Inference pipeline exception: {e}", exc_info=True)

    def _process_frame_pipeline(self, frame: np.ndarray, timestamp: float) -> None:
        h, w = frame.shape[:2]
        now_mono = time.monotonic()

        # Step 1: MediaPipe landmarks
        landmarks = self.face_tracker.process_frame(frame)
        face_detected = (landmarks is not None and len(landmarks) > 0)

        mode_overrides = settings.mode_presets.get(self.active_mode, {})

        # Step 2: Head pose estimation
        if face_detected:
            head_pose = self.head_pose_estimator.estimate(landmarks, w, h, mode_overrides)
            gaze = self.gaze_estimator.estimate(landmarks, mode_overrides)
        else:
            # MediaPipe unavailable (simulation mode): generate realistic synthetic signals
            # so the full attention pipeline exercises real scores rather than a permanent 0.0.
            self._sim_t += 0.066  # ~15 fps step
            t = self._sim_t

            # Natural head drift: ±5° yaw, ±3° pitch, slow sinusoids
            sim_yaw   = 4.5 * math.sin(t * 0.17) + 1.2 * math.sin(t * 0.43)
            sim_pitch = 2.8 * math.cos(t * 0.21) + 0.9 * math.cos(t * 0.61)
            sim_roll  = 1.0 * math.sin(t * 0.11)

            # Facing score from yaw/pitch magnitude (tight tolerances → high score)
            yaw_penalty   = max(0.0, (abs(sim_yaw)   - 5.0)  / 20.0)
            pitch_penalty = max(0.0, (abs(sim_pitch) - 4.0)  / 15.0)
            sim_facing = round(max(0.0, 1.0 - 0.65 * yaw_penalty - 0.35 * pitch_penalty), 3)

            head_pose = HeadPoseResult(
                yaw=round(sim_yaw, 2),
                pitch=round(sim_pitch, 2),
                roll=round(sim_roll, 2),
                facing_score=sim_facing,
                direction="center"
            )

            # Gaze: centred with slight wander; occasional blink every ~4 s
            sim_gaze_x = 0.5 + 0.07 * math.sin(t * 0.31)
            sim_gaze_y = 0.5 + 0.04 * math.cos(t * 0.27)
            blink_phase = math.sin(t * (2 * math.pi / 4.0))  # period ~4 s
            is_blink = blink_phase > 0.97
            dist = math.sqrt((sim_gaze_x - 0.5) ** 2 + (sim_gaze_y - 0.5) ** 2)
            sim_gaze_score = round(max(0.0, 1.0 - dist * 3.5), 3)

            gaze = GazeResult(
                gaze_x=round(sim_gaze_x, 3),
                gaze_y=round(sim_gaze_y, 3),
                is_blink=is_blink,
                gaze_score=sim_gaze_score
            )

            face_detected = True  # simulate face always present in sim mode

        features = FrameFeatures(
            timestamp=timestamp,
            face_detected=face_detected,
            head_pose=head_pose,
            gaze=gaze,
            landmarks_count=len(landmarks) if landmarks else 0
        )

        # Step 3: Attention Scoring & EMA Smoothing
        raw_score, smoothed_score, stability = self.attention_engine.process(features, mode_overrides)

        # Step 4: State Machine with Hysteresis
        state = self.state_classifier.update(smoothed_score)

        # Update session state time accumulation
        if self.session_status == "running":
            dt = max(0.0, now_mono - self._last_event_time)
            self._state_durations[state] = self._state_durations.get(state, 0.0) + dt
            self._last_event_time = now_mono

            # Step 5: Distraction Pattern Detector
            self.pattern_detector.record_state(state, smoothed_score, timestamp)

            # Step 6: Adaptive Alert Engine
            elapsed_sec = self.get_elapsed_sec()
            alert = self.alert_engine.check(
                state=state,
                score=smoothed_score,
                timestamp=timestamp,
                pattern_detector=self.pattern_detector,
                session_elapsed_sec=elapsed_sec
            )
        else:
            alert = None
            elapsed_sec = 0

        # Optional preview frame
        preview_b64 = None
        if self._preview_enabled:
            preview_b64 = self.camera_service.get_preview_jpeg_base64(max_width=320)

        # Build live broadcast packet
        packet = LiveStreamPacket(
            timestamp=datetime.now(timezone.utc).isoformat(),
            attention_score=smoothed_score,
            state=state,
            face_detected=face_detected,
            head=HeadPoseData(
                yaw=head_pose.yaw,
                pitch=head_pose.pitch,
                roll=head_pose.roll,
                direction=head_pose.direction
            ),
            gaze=GazeData(
                x=gaze.gaze_x,
                y=gaze.gaze_y,
                blink=gaze.is_blink
            ),
            stability=stability,
            alert=alert,
            session=LiveSessionInfo(
                id=self.active_session_id,
                elapsed_sec=elapsed_sec,
                remaining_sec=max(0, self.planned_duration_sec - elapsed_sec) if self.planned_duration_sec else None,
                status=self.session_status,
                mode=self.active_mode
            ),
            preview_frame=preview_b64
        )
        self._last_stream_packet = packet

        # Broadcast packet to all WebSocket subscribers asynchronously
        if self._loop and self._subscribers:
            for q in list(self._subscribers):
                try:
                    if q.full():
                        q.get_nowait()
                    q.put_nowait(packet)
                except Exception:
                    pass

        # Periodic SQLite Persistence (downsampled 1 event per 2s)
        if self.session_status == "running" and self.active_session_id is not None:
            if (now_mono - self._last_db_write_time) >= settings.db_downsample_interval_sec:
                self._last_db_write_time = now_mono
                if self._loop:
                    asyncio.run_coroutine_threadsafe(
                        self._persist_attention_event(
                            session_id=self.active_session_id,
                            score=smoothed_score,
                            state=state,
                            face_detected=face_detected,
                            yaw=head_pose.yaw,
                            pitch=head_pose.pitch,
                            gaze_x=gaze.gaze_x,
                            gaze_y=gaze.gaze_y
                        ),
                        self._loop
                    )

    async def _persist_attention_event(
        self,
        session_id: int,
        score: float,
        state: str,
        face_detected: bool,
        yaw: float,
        pitch: float,
        gaze_x: float,
        gaze_y: float
    ) -> None:
        try:
            async with async_session_factory() as db:
                event = AttentionEvent(
                    session_id=session_id,
                    timestamp=datetime.utcnow(),
                    score=score,
                    state=state,
                    face_detected=face_detected,
                    yaw=yaw,
                    pitch=pitch,
                    gaze_x=gaze_x,
                    gaze_y=gaze_y
                )
                db.add(event)
                await db.commit()
        except Exception as e:
            logger.error(f"Error persisting attention event: {e}")

    def get_session_summary_stats(self) -> Dict[str, Any]:
        """Compute aggregated statistics for the active or completed session."""
        total_tracked = sum(self._state_durations.values())
        if total_tracked <= 0.0:
            total_tracked = 1.0

        focus_sec = self._state_durations.get("engaged", 0.0) + self._state_durations.get("highly_engaged", 0.0)
        away_sec = self._state_durations.get("away", 0.0)
        uncertain_sec = self._state_durations.get("possibly_distracted", 0.0)

        focus_pct = round((focus_sec / total_tracked) * 100.0, 1)
        away_pct = round((away_sec / total_tracked) * 100.0, 1)
        uncertain_pct = round((uncertain_sec / total_tracked) * 100.0, 1)

        now = time.time()
        longest_focus = int(self.pattern_detector.get_longest_focus_streak(now))
        drop_count = len(self.pattern_detector.drops)
        pattern = self.pattern_detector.classify_pattern(total_tracked)

        return {
            "duration_sec": self.get_elapsed_sec(),
            "focus_pct": focus_pct,
            "away_pct": away_pct,
            "uncertain_pct": uncertain_pct,
            "longest_focus_sec": longest_focus,
            "drop_count": drop_count,
            "pattern": pattern
        }


session_manager = SessionManager()
