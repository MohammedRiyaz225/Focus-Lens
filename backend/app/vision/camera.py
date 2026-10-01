import time
import threading
import logging
import base64
from typing import Optional, Callable, Tuple
import numpy as np

logger = logging.getLogger(__name__)

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV not installed, camera capture will run in fallback simulation mode.")


class CameraService:
    """
    Manages webcam capture in a background thread to prevent blocking the async event loop.
    Provides start, pause, resume, and stop controls, along with simulated frame generation.
    """

    def __init__(
        self,
        camera_index: int = 0,
        target_fps: int = 15,
        width: int = 640,
        height: int = 480,
        simulate: bool = False
    ):
        self.camera_index = camera_index
        self.target_fps = target_fps
        self.width = width
        self.height = height
        self.simulate = simulate

        self._running = False
        self._paused = False
        self._thread: Optional[threading.Thread] = None
        self._cap = None
        self._lock = threading.Lock()

        self._latest_frame: Optional[np.ndarray] = None
        self._latest_timestamp: float = 0.0
        self._frame_callback: Optional[Callable[[np.ndarray, float], None]] = None

        self.camera_error: Optional[str] = None
        self.is_active: bool = False

    def set_callback(self, callback: Callable[[np.ndarray, float], None]) -> None:
        self._frame_callback = callback

    def start(self) -> bool:
        with self._lock:
            if self._running:
                return True

            self.camera_error = None
            self._running = True
            self._paused = False
            self._thread = threading.Thread(target=self._capture_loop, daemon=True, name="CameraCaptureThread")
            self._thread.start()
            self.is_active = True
            logger.info(f"CameraService started (simulate={self.simulate}, index={self.camera_index})")
            return True

    def pause(self) -> None:
        with self._lock:
            self._paused = True
            logger.info("CameraService paused")

    def resume(self) -> None:
        with self._lock:
            self._paused = False
            logger.info("CameraService resumed")

    def stop(self) -> None:
        with self._lock:
            self._running = False
            self.is_active = False

        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        self._thread = None
        self._release_camera()
        logger.info("CameraService stopped and hardware released")

    def get_latest_frame(self) -> Tuple[Optional[np.ndarray], float]:
        with self._lock:
            return self._latest_frame, self._latest_timestamp

    def get_preview_jpeg_base64(self, max_width: int = 320) -> Optional[str]:
        """Returns a downscaled base64 JPEG string for optional UI preview."""
        frame, _ = self.get_latest_frame()
        if frame is None or not CV2_AVAILABLE:
            return None

        try:
            h, w = frame.shape[:2]
            scale = max_width / float(w)
            small = cv2.resize(frame, (max_width, int(h * scale)), interpolation=cv2.INTER_AREA)
            _, buffer = cv2.imencode('.jpg', small, [int(cv2.IMWRITE_JPEG_QUALITY), 65])
            return base64.b64encode(buffer).decode('utf-8')
        except Exception as e:
            logger.debug(f"Preview encode error: {e}")
            return None

    def _open_camera(self) -> bool:
        if self.simulate or not CV2_AVAILABLE:
            logger.info("Using simulated video stream (camera hardware bypassed)")
            return True

        try:
            # On Windows, cv2.CAP_DSHOW is often faster to open
            self._cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
            if not self._cap or not self._cap.isOpened():
                # Fallback to default backend
                self._cap = cv2.VideoCapture(self.camera_index)

            if not self._cap.isOpened():
                self.camera_error = f"Cannot open webcam index {self.camera_index}. Falling back to simulation."
                logger.warning(self.camera_error)
                self.simulate = True
                return True

            self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self._cap.set(cv2.CAP_PROP_FPS, self.target_fps)
            return True
        except Exception as e:
            self.camera_error = f"Camera initialization failed: {str(e)}. Falling back to simulation."
            logger.warning(self.camera_error)
            self.simulate = True
            return True

    def _release_camera(self) -> None:
        if self._cap is not None and CV2_AVAILABLE:
            try:
                self._cap.release()
            except Exception as e:
                logger.error(f"Error releasing camera: {e}")
            self._cap = None

    def _capture_loop(self) -> None:
        self._open_camera()
        frame_interval = 1.0 / max(1, self.target_fps)

        sim_t = 0.0

        while self._running:
            loop_start = time.perf_counter()

            if self._paused:
                time.sleep(0.05)
                continue

            frame = None
            if self.simulate or not CV2_AVAILABLE or self._cap is None:
                # Generate synthetic test frame
                sim_t += 0.1
                frame = self._generate_simulated_frame(sim_t)
            else:
                ret, captured = self._cap.read()
                if ret and captured is not None:
                    frame = captured
                else:
                    logger.warning("Frame read failed, generating fallback frame")
                    sim_t += 0.1
                    frame = self._generate_simulated_frame(sim_t)

            timestamp = time.time()
            with self._lock:
                self._latest_frame = frame
                self._latest_timestamp = timestamp

            if self._frame_callback and frame is not None:
                try:
                    self._frame_callback(frame, timestamp)
                except Exception as e:
                    logger.error(f"Frame callback error: {e}")

            elapsed = time.perf_counter() - loop_start
            sleep_time = frame_interval - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)

        self._release_camera()

    def _generate_simulated_frame(self, t: float) -> np.ndarray:
        """Create a synthetic canvas simulating webcam output with visual indicator."""
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        # Gradient background
        for y in range(self.height):
            frame[y, :, 0] = int(25 + 15 * (y / self.height))
            frame[y, :, 1] = int(30 + 20 * (y / self.height))
            frame[y, :, 2] = int(45 + 30 * (y / self.height))

        if CV2_AVAILABLE:
            # Draw synthetic face circle moving slightly
            center_x = int(self.width / 2 + 15 * np.sin(t * 0.5))
            center_y = int(self.height / 2 + 10 * np.cos(t * 0.4))
            cv2.circle(frame, (center_x, center_y), 85, (180, 160, 140), -1)
            # Eyes
            cv2.circle(frame, (center_x - 30, center_y - 20), 10, (240, 240, 240), -1)
            cv2.circle(frame, (center_x + 30, center_y - 20), 10, (240, 240, 240), -1)
            # Irises
            cv2.circle(frame, (center_x - 30, center_y - 20), 4, (60, 40, 20), -1)
            cv2.circle(frame, (center_x + 30, center_y - 20), 4, (60, 40, 20), -1)
            # Text banner
            cv2.putText(frame, "FocusLens Simulation Mode", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 220, 100), 2)
            cv2.putText(frame, "Privacy: On-Device Processing Only", (20, self.height - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

        return frame
