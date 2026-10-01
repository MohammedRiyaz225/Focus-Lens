import numpy as np
from typing import List, Tuple, Optional
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    cv2 = None
    CV2_AVAILABLE = False
from app.vision.features import HeadPoseResult


class HeadPoseEstimator:
    """
    Estimates 3D head pose (yaw, pitch, roll) from MediaPipe FaceMesh landmarks.
    Computes a normalized 0-1 'facing screen' score with calibration offset support.
    """

    # 3D generic facial model points (in arbitrary coordinate space)
    MODEL_POINTS_3D = np.array([
        (0.0, 0.0, 0.0),             # Nose tip (index 1)
        (0.0, -330.0, -65.0),        # Chin (index 152)
        (-225.0, 170.0, -135.0),     # Left eye left corner (index 33)
        (225.0, 170.0, -135.0),      # Right eye right corner (index 263)
        (-150.0, -150.0, -125.0),    # Left mouth corner (index 61)
        (150.0, -150.0, -125.0),     # Right mouth corner (index 291)
    ], dtype=np.float64)

    # Corresponding MediaPipe landmark indices
    LANDMARK_INDICES = [1, 152, 33, 263, 61, 291]

    def __init__(
        self,
        max_yaw_deg: float = 25.0,
        max_pitch_deg: float = 20.0,
        calibration_yaw: float = 0.0,
        calibration_pitch: float = 0.0,
        calibration_roll: float = 0.0,
    ):
        self.max_yaw_deg = max_yaw_deg
        self.max_pitch_deg = max_pitch_deg
        self.calibration_yaw = calibration_yaw
        self.calibration_pitch = calibration_pitch
        self.calibration_roll = calibration_roll

    def set_calibration(self, yaw: float, pitch: float, roll: float = 0.0) -> None:
        """Set neutral user head pose offsets."""
        self.calibration_yaw = yaw
        self.calibration_pitch = pitch
        self.calibration_roll = roll

    def estimate(
        self,
        landmarks: List[Tuple[float, float, float]],
        img_width: int,
        img_height: int,
        mode_override: Optional[dict] = None
    ) -> HeadPoseResult:
        """
        Estimate yaw, pitch, roll and facing score from 2D pixel coordinates of landmarks.
        landmarks: list of (x, y, z) normalized coordinates [0..1]
        """
        if not landmarks or len(landmarks) < 292:
            return HeadPoseResult(facing_score=0.0, direction="unknown")

        if not CV2_AVAILABLE:
            return self._fallback_ratio_estimate(landmarks)

        # Extract the 6 key 2D points in pixel coordinates
        image_points = []
        for idx in self.LANDMARK_INDICES:
            lm = landmarks[idx]
            image_points.append((lm[0] * img_width, lm[1] * img_height))
        image_points = np.array(image_points, dtype=np.float64)

        # Approximate camera matrix (focal length ~ image width)
        focal_length = img_width
        center = (img_width / 2.0, img_height / 2.0)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

        try:
            success, rot_vec, trans_vec = cv2.solvePnP(
                self.MODEL_POINTS_3D,
                image_points,
                camera_matrix,
                dist_coeffs,
                flags=cv2.SOLVEPNP_ITERATIVE
            )
            if not success:
                return self._fallback_ratio_estimate(landmarks)

            rot_mat, _ = cv2.Rodrigues(rot_vec)
            # Decompose rotation matrix to Euler angles (yaw, pitch, roll in degrees)
            proj_matrix = np.hstack((rot_mat, trans_vec))
            _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(proj_matrix)

            pitch_raw = float(euler_angles[0][0])
            yaw_raw = float(euler_angles[1][0])
            roll_raw = float(euler_angles[2][0])

            # Apply calibration offset
            yaw = yaw_raw - self.calibration_yaw
            pitch = pitch_raw - self.calibration_pitch
            roll = roll_raw - self.calibration_roll

            return self._compute_facing_score(yaw, pitch, roll, mode_override)

        except Exception:
            return self._fallback_ratio_estimate(landmarks)

    def _compute_facing_score(
        self,
        yaw: float,
        pitch: float,
        roll: float,
        mode_override: Optional[dict] = None
    ) -> HeadPoseResult:
        max_yaw = mode_override.get("head_yaw_max", self.max_yaw_deg) if mode_override else self.max_yaw_deg
        max_pitch = mode_override.get("head_pitch_max", self.max_pitch_deg) if mode_override else self.max_pitch_deg

        abs_yaw = abs(yaw)
        abs_pitch = abs(pitch)

        # Yaw penalty (0 when yaw <= max_yaw, drops to 0 smoothly up to 2 * max_yaw)
        if abs_yaw <= max_yaw * 0.7:
            yaw_score = 1.0
        elif abs_yaw >= max_yaw * 1.8:
            yaw_score = 0.0
        else:
            # Linear ramp-down
            yaw_score = max(0.0, 1.0 - (abs_yaw - max_yaw * 0.7) / (max_yaw * 1.1))

        # Pitch penalty
        if abs_pitch <= max_pitch * 0.7:
            pitch_score = 1.0
        elif abs_pitch >= max_pitch * 1.8:
            pitch_score = 0.0
        else:
            pitch_score = max(0.0, 1.0 - (abs_pitch - max_pitch * 0.7) / (max_pitch * 1.1))

        # Overall facing score
        facing_score = round(float(yaw_score * 0.65 + pitch_score * 0.35), 3)

        # Categorize direction
        direction = "center"
        if yaw < -12.0:
            direction = "left"
        elif yaw > 12.0:
            direction = "right"
        elif pitch < -10.0:
            direction = "down"
        elif pitch > 12.0:
            direction = "up"

        return HeadPoseResult(
            yaw=round(yaw, 2),
            pitch=round(pitch, 2),
            roll=round(roll, 2),
            facing_score=max(0.0, min(1.0, facing_score)),
            direction=direction
        )

    def _fallback_ratio_estimate(self, landmarks: List[Tuple[float, float, float]]) -> HeadPoseResult:
        """Geometric fallback if solvePnP fails."""
        nose = landmarks[1]
        left_cheek = landmarks[234]
        right_cheek = landmarks[454]
        chin = landmarks[152]
        forehead = landmarks[10]

        # Horizontal symmetry for yaw
        dist_left = abs(nose[0] - left_cheek[0])
        dist_right = abs(right_cheek[0] - nose[0])
        total_w = dist_left + dist_right + 1e-6
        yaw_ratio = (dist_right - dist_left) / total_w
        est_yaw = yaw_ratio * 60.0 - self.calibration_yaw

        # Vertical symmetry for pitch
        dist_top = abs(nose[1] - forehead[1])
        dist_bot = abs(chin[1] - nose[1])
        total_h = dist_top + dist_bot + 1e-6
        pitch_ratio = (dist_top - dist_bot) / total_h
        est_pitch = pitch_ratio * 50.0 - self.calibration_pitch

        return self._compute_facing_score(est_yaw, est_pitch, 0.0)
