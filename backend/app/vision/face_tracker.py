import logging
from typing import Optional, List, Tuple
import numpy as np

logger = logging.getLogger(__name__)

try:
    import mediapipe as mp
    MP_AVAILABLE = True
except ImportError:
    MP_AVAILABLE = False
    logger.warning("MediaPipe not installed, face tracking will use simulation mode.")


class FaceTracker:
    """
    Wraps MediaPipe FaceMesh to extract 478 face and iris landmarks.
    """

    def __init__(self, min_detection_confidence: float = 0.5, min_tracking_confidence: float = 0.5):
        self.min_detection_confidence = min_detection_confidence
        self.min_tracking_confidence = min_tracking_confidence
        self._mesh = None

        if MP_AVAILABLE:
            try:
                self.mp_face_mesh = mp.solutions.face_mesh
                self._mesh = self.mp_face_mesh.FaceMesh(
                    max_num_faces=1,
                    refine_landmarks=True,  # Iris landmarks included
                    min_detection_confidence=min_detection_confidence,
                    min_tracking_confidence=min_tracking_confidence
                )
            except Exception as e:
                logger.error(f"Failed to initialize MediaPipe FaceMesh: {e}")
                self._mesh = None

    def process_frame(self, bgr_frame: np.ndarray) -> Optional[List[Tuple[float, float, float]]]:
        """
        Process BGR frame and return list of 478 normalized (x, y, z) landmarks, or None if no face.
        """
        if not MP_AVAILABLE or self._mesh is None or bgr_frame is None:
            return None

        import cv2
        # MediaPipe requires RGB
        rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        rgb_frame.flags.writeable = False

        try:
            results = self._mesh.process(rgb_frame)
            if not results.multi_face_landmarks:
                return None

            face_landmarks = results.multi_face_landmarks[0]
            landmarks = [(lm.x, lm.y, lm.z) for lm in face_landmarks.landmark]
            return landmarks
        except Exception as e:
            logger.error(f"Error processing frame in FaceTracker: {e}")
            return None

    def close(self):
        if self._mesh:
            try:
                self._mesh.close()
            except Exception:
                pass
            self._mesh = None
