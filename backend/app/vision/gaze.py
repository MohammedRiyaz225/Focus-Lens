import math
from typing import List, Tuple, Optional
from app.vision.features import GazeResult


class GazeEstimator:
    """
    Estimates horizontal/vertical gaze position and EAR (Eye Aspect Ratio)
    from MediaPipe iris and eye-corner landmarks.
    Handles blinks gracefully so blinks are not counted as looking away.
    """

    # MediaPipe landmark indices
    LEFT_EYE_CORNERS = (33, 133)      # Outer, Inner
    LEFT_EYE_VERTICAL = (159, 145)    # Top, Bottom
    LEFT_IRIS = (468, 469, 470, 471, 472)

    RIGHT_EYE_CORNERS = (362, 263)    # Inner, Outer
    RIGHT_EYE_VERTICAL = (386, 374)   # Top, Bottom
    RIGHT_IRIS = (473, 474, 475, 476, 477)

    def __init__(
        self,
        blink_ear_threshold: float = 0.18,
        calib_center_x: float = 0.5,
        calib_center_y: float = 0.5,
    ):
        self.blink_ear_threshold = blink_ear_threshold
        self.calib_center_x = calib_center_x
        self.calib_center_y = calib_center_y
        self.last_valid_gaze_score: float = 1.0
        self.last_valid_gaze_x: float = 0.5
        self.last_valid_gaze_y: float = 0.5

    def set_calibration(self, center_x: float, center_y: float) -> None:
        self.calib_center_x = center_x
        self.calib_center_y = center_y

    def _euclidean_dist(self, p1: Tuple[float, float, float], p2: Tuple[float, float, float]) -> float:
        return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

    def _calculate_ear(
        self,
        landmarks: List[Tuple[float, float, float]],
        corners: Tuple[int, int],
        vertical: Tuple[int, int]
    ) -> float:
        """Eye Aspect Ratio (EAR) approximation."""
        p_c1, p_c2 = landmarks[corners[0]], landmarks[corners[1]]
        p_v1, p_v2 = landmarks[vertical[0]], landmarks[vertical[1]]

        horiz_dist = self._euclidean_dist(p_c1, p_c2) + 1e-6
        vert_dist = self._euclidean_dist(p_v1, p_v2)

        return vert_dist / horiz_dist

    def _calculate_iris_position(
        self,
        landmarks: List[Tuple[float, float, float]],
        corners: Tuple[int, int],
        vertical: Tuple[int, int],
        iris_indices: Tuple[int, ...]
    ) -> Tuple[float, float]:
        """Compute relative position (0.0 - 1.0) of iris center inside eye socket."""
        # Iris center (index 0 is center landmark, or mean of iris points)
        iris_center_idx = iris_indices[0]
        iris = landmarks[iris_center_idx]

        c1 = landmarks[corners[0]]
        c2 = landmarks[corners[1]]
        v_top = landmarks[vertical[0]]
        v_bot = landmarks[vertical[1]]

        # Horizontal ratio (x relative to outer/inner corners)
        min_x = min(c1[0], c2[0])
        max_x = max(c1[0], c2[0])
        eye_width = max_x - min_x + 1e-6
        rel_x = (iris[0] - min_x) / eye_width

        # Vertical ratio (y relative to top/bottom eyelids)
        min_y = min(v_top[1], v_bot[1])
        max_y = max(v_top[1], v_bot[1])
        eye_height = max_y - min_y + 1e-6
        rel_y = (iris[1] - min_y) / eye_height

        return max(0.0, min(1.0, rel_x)), max(0.0, min(1.0, rel_y))

    def estimate(
        self,
        landmarks: List[Tuple[float, float, float]],
        mode_override: Optional[dict] = None
    ) -> GazeResult:
        """
        Estimate gaze and detect blinks.
        Returns GazeResult with normalized score 0.0 - 1.0.
        """
        if not landmarks or len(landmarks) < 478:
            return GazeResult(gaze_score=0.0)

        ear_thresh = mode_override.get("blink_ear_threshold", self.blink_ear_threshold) if mode_override else self.blink_ear_threshold

        left_ear = self._calculate_ear(landmarks, self.LEFT_EYE_CORNERS, self.LEFT_EYE_VERTICAL)
        right_ear = self._calculate_ear(landmarks, self.RIGHT_EYE_CORNERS, self.RIGHT_EYE_VERTICAL)
        avg_ear = (left_ear + right_ear) / 2.0

        is_blink = avg_ear < ear_thresh

        if is_blink:
            # Preserve last valid gaze score during blink so blink is NOT penalized
            return GazeResult(
                gaze_x=self.last_valid_gaze_x,
                gaze_y=self.last_valid_gaze_y,
                left_ear=round(left_ear, 3),
                right_ear=round(right_ear, 3),
                avg_ear=round(avg_ear, 3),
                is_blink=True,
                gaze_score=self.last_valid_gaze_score
            )

        # Calculate iris ratios for both eyes
        left_x, left_y = self._calculate_iris_position(landmarks, self.LEFT_EYE_CORNERS, self.LEFT_EYE_VERTICAL, self.LEFT_IRIS)
        right_x, right_y = self._calculate_iris_position(landmarks, self.RIGHT_EYE_CORNERS, self.RIGHT_EYE_VERTICAL, self.RIGHT_IRIS)

        avg_x = (left_x + right_x) / 2.0
        avg_y = (left_y + right_y) / 2.0

        # Offset with calibration
        dx = abs(avg_x - self.calib_center_x)
        dy = abs(avg_y - self.calib_center_y)

        # Tolerances
        tol_x = mode_override.get("gaze_tol_x", 0.22) if mode_override else 0.22
        tol_y = mode_override.get("gaze_tol_y", 0.25) if mode_override else 0.25

        score_x = 1.0 if dx <= tol_x else max(0.0, 1.0 - (dx - tol_x) / 0.25)
        score_y = 1.0 if dy <= tol_y else max(0.0, 1.0 - (dy - tol_y) / 0.25)

        gaze_score = round(float(score_x * 0.6 + score_y * 0.4), 3)
        gaze_score = max(0.0, min(1.0, gaze_score))

        self.last_valid_gaze_score = gaze_score
        self.last_valid_gaze_x = round(avg_x, 3)
        self.last_valid_gaze_y = round(avg_y, 3)

        return GazeResult(
            gaze_x=round(avg_x, 3),
            gaze_y=round(avg_y, 3),
            left_ear=round(left_ear, 3),
            right_ear=round(right_ear, 3),
            avg_ear=round(avg_ear, 3),
            is_blink=False,
            gaze_score=gaze_score
        )
