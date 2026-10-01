from typing import Optional
from app.config import settings


class StateClassifier:
    """
    Maps smoothed attention score to discrete state:
    - 0.00 - 0.30: away
    - 0.31 - 0.55: possibly_distracted
    - 0.56 - 0.75: engaged
    - 0.76 - 1.00: highly_engaged

    Includes hysteresis: new state must persist for N frames before switching,
    preventing noisy flickering at boundary thresholds.
    """

    STATES = ["away", "possibly_distracted", "engaged", "highly_engaged"]

    def __init__(
        self,
        threshold_away: float = 0.30,
        threshold_distracted: float = 0.55,
        threshold_engaged: float = 0.75,
        hysteresis_frames: int = 5
    ):
        self.threshold_away = threshold_away
        self.threshold_distracted = threshold_distracted
        self.threshold_engaged = threshold_engaged
        self.hysteresis_frames = hysteresis_frames

        self._current_state: str = "engaged"
        self._candidate_state: Optional[str] = None
        self._candidate_count: int = 0

    def reset(self, initial_state: str = "engaged") -> None:
        self._current_state = initial_state
        self._candidate_state = None
        self._candidate_count = 0

    def update_thresholds(self, away: float, distracted: float, engaged: float, hysteresis: int) -> None:
        self.threshold_away = away
        self.threshold_distracted = distracted
        self.threshold_engaged = engaged
        self.hysteresis_frames = hysteresis

    def classify_raw(self, score: float) -> str:
        """Instantaneous classification without hysteresis."""
        if score <= self.threshold_away:
            return "away"
        elif score <= self.threshold_distracted:
            return "possibly_distracted"
        elif score <= self.threshold_engaged:
            return "engaged"
        else:
            return "highly_engaged"

    def update(self, score: float) -> str:
        """
        Updates state with hysteresis filter.
        Returns the committed current state.
        """
        instant_state = self.classify_raw(score)

        if instant_state == self._current_state:
            # Reasserted current state, clear pending candidates
            self._candidate_state = None
            self._candidate_count = 0
            return self._current_state

        if instant_state == self._candidate_state:
            self._candidate_count += 1
            if self._candidate_count >= self.hysteresis_frames:
                # State change committed!
                self._current_state = instant_state
                self._candidate_state = None
                self._candidate_count = 0
        else:
            # New candidate state started
            self._candidate_state = instant_state
            self._candidate_count = 1

        return self._current_state

    @property
    def current_state(self) -> str:
        return self._current_state
