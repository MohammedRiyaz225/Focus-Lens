from dataclasses import dataclass, field
from typing import Optional, Tuple


@dataclass
class HeadPoseResult:
    yaw: float = 0.0      # degrees (negative: left, positive: right)
    pitch: float = 0.0    # degrees (negative: down, positive: up)
    roll: float = 0.0     # degrees (tilt)
    facing_score: float = 1.0  # 0.0 to 1.0 normalized score
    direction: str = "center"  # center, left, right, up, down


@dataclass
class GazeResult:
    gaze_x: float = 0.5   # 0.0 to 1.0 (0.5 is center)
    gaze_y: float = 0.5   # 0.0 to 1.0 (0.5 is center)
    left_ear: float = 0.25
    right_ear: float = 0.25
    avg_ear: float = 0.25
    is_blink: bool = False
    gaze_score: float = 1.0  # 0.0 to 1.0 normalized score


@dataclass
class FrameFeatures:
    timestamp: float
    face_detected: bool = False
    head_pose: HeadPoseResult = field(default_factory=HeadPoseResult)
    gaze: GazeResult = field(default_factory=GazeResult)
    stability_score: float = 1.0
    landmarks_count: int = 0
