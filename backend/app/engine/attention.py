import time
import math
from collections import deque
from typing import List, Optional, Tuple
from app.config import settings
from app.vision.features import FrameFeatures, HeadPoseResult, GazeResult


class AttentionEngine:
    """
    Computes visual engagement score from individual signals:
    - Face presence (weight default 0.25)
    - Head pose (weight default 0.30)
    - Gaze direction (weight default 0.30)
    - Pose stability (weight default 0.15)

    Applies Exponential Moving Average (EMA) smoothing to produce a stable attention score.
    """

    def __init__(
        self,
        weight_face: float = 0.25,
        weight_head: float = 0.30,
        weight_eyes: float = 0.30,
        weight_stability: float = 0.15,
        ema_alpha: float = 0.35,
        stability_window_size: int = 15
    ):
        self.weight_face = weight_face
        self.weight_head = weight_head
        self.weight_eyes = weight_eyes
        self.weight_stability = weight_stability
        self.ema_alpha = ema_alpha
        self.stability_window_size = stability_window_size

        self._smoothed_score: Optional[float] = None
        self._pose_history: deque = deque(maxlen=stability_window_size)
        self._last_timestamp: float = time.time()

    def reset(self) -> None:
        self._smoothed_score = None
        self._pose_history.clear()
        self._last_timestamp = time.time()

    def update_weights(self, face: float, head: float, eyes: float, stability: float) -> None:
        self.weight_face = face
        self.weight_head = head
        self.weight_eyes = eyes
        self.weight_stability = stability

    def compute_stability(self, head_pose: HeadPoseResult) -> float:
        """
        Derives stability from low variance of head pose over rolling window.
        0.0 = high jitter/rapid head motion, 1.0 = steady posture.
        """
        self._pose_history.append((head_pose.yaw, head_pose.pitch, head_pose.roll))
        if len(self._pose_history) < 4:
            return 1.0

        yaws = [p[0] for p in self._pose_history]
        pitches = [p[1] for p in self._pose_history]

        yaw_var = sum((y - sum(yaws)/len(yaws))**2 for y in yaws) / len(yaws)
        pitch_var = sum((p - sum(pitches)/len(pitches))**2 for p in pitches) / len(pitches)
        total_var = yaw_var + pitch_var

        # Variance <= 4.0 deg^2 is rock solid, > 36.0 deg^2 is unstable/erratic
        if total_var <= 4.0:
            return 1.0
        elif total_var >= 40.0:
            return 0.2
        else:
            return round(1.0 - (total_var - 4.0) / 45.0, 3)

    def process(self, features: FrameFeatures, mode_weights: Optional[dict] = None) -> Tuple[float, float, float]:
        """
        Process frame features and return (raw_score, smoothed_score, stability_score).
        """
        w_face = mode_weights.get("weight_face", self.weight_face) if mode_weights else self.weight_face
        w_head = mode_weights.get("weight_head", self.weight_head) if mode_weights else self.weight_head
        w_eyes = mode_weights.get("weight_eyes", self.weight_eyes) if mode_weights else self.weight_eyes
        w_stab = mode_weights.get("weight_stability", self.weight_stability) if mode_weights else self.weight_stability

        total_weight = w_face + w_head + w_eyes + w_stab
        if total_weight <= 0:
            total_weight = 1.0

        # If face is completely absent, attention is 0.0
        if not features.face_detected:
            stability = 0.0
            raw_score = 0.0
        else:
            stability = self.compute_stability(features.head_pose)
            features.stability_score = stability

            s_face = 1.0
            s_head = features.head_pose.facing_score
            s_eyes = features.gaze.gaze_score
            s_stab = stability

            raw_score = (w_face * s_face + w_head * s_head + w_eyes * s_eyes + w_stab * s_stab) / total_weight
            raw_score = max(0.0, min(1.0, raw_score))

        # Exponential moving average smoothing
        if self._smoothed_score is None:
            self._smoothed_score = raw_score
        else:
            self._smoothed_score = self.ema_alpha * raw_score + (1.0 - self.ema_alpha) * self._smoothed_score

        self._smoothed_score = round(max(0.0, min(1.0, self._smoothed_score)), 3)
        return round(raw_score, 3), self._smoothed_score, round(stability, 3)
