import time
from typing import Optional, List, Dict
from datetime import datetime
from app.config import AlertConfig
from app.schemas.schemas import AlertData, AlertAction
from app.engine.patterns import DistractionPatternDetector


class AdaptiveAlertEngine:
    """
    Evaluates visual engagement drops and triggers multi-level adaptive notifications:
    - Level 1 (<10s): Grace period (no action)
    - Level 2 (>=30s away): Passive subtle indicator ("Attention dropped")
    - Level 3 (>=120s away): Gentle notification ("You've been away for a while")
    - Level 4 (>=3 drops in 10 mins): Adaptive prompt ("Your attention has been fluctuating. Pause the session?")
    - Smart Break: Long focus stretch + drop increase -> "Consider taking a short rest."
    """

    def __init__(self, config: Optional[AlertConfig] = None):
        self.config = config or AlertConfig()

        self._away_start_time: Optional[float] = None
        self._last_alert_level: int = 0
        self._last_alert_time: float = 0.0
        self._level4_triggered: bool = False
        self._break_suggested: bool = False

    def reset(self) -> None:
        self._away_start_time = None
        self._last_alert_level = 0
        self._last_alert_time = 0.0
        self._level4_triggered = False
        self._break_suggested = False

    def check(
        self,
        state: str,
        score: float,
        timestamp: float,
        pattern_detector: DistractionPatternDetector,
        session_elapsed_sec: float
    ) -> Optional[AlertData]:
        """
        Evaluate current state and return AlertData if an alert should fire, else None.
        """
        is_away = (state == "away")
        is_low_attention = (state in ("away", "possibly_distracted"))

        if is_away:
            if self._away_start_time is None:
                self._away_start_time = timestamp
        else:
            self._away_start_time = None
            self._last_alert_level = 0

        current_time = timestamp
        time_since_last_alert = current_time - self._last_alert_time

        # Check Level 4 (repeated drops in window)
        drops_in_window = pattern_detector.get_drop_count_in_window(
            self.config.level4_drop_window_sec,
            current_time
        )

        if drops_in_window >= self.config.level4_drop_count_threshold and not self._level4_triggered:
            if time_since_last_alert >= self.config.alert_cooldown_sec:
                self._level4_triggered = True
                self._last_alert_time = current_time
                return AlertData(
                    level=4,
                    type="suggestion",
                    message="Your visual attention has been fluctuating recently. Would you like to pause the session?",
                    actions=[
                        AlertAction(id="pause", label="Pause Session", action_type="pause"),
                        AlertAction(id="continue", label="Continue", action_type="dismiss"),
                    ],
                    timestamp=datetime.utcnow().isoformat()
                )

        # Check Smart Break Suggestion (long focus > 25min + recent drops)
        if session_elapsed_sec >= self.config.break_streak_sec and drops_in_window >= 2 and not self._break_suggested:
            if time_since_last_alert >= self.config.alert_cooldown_sec:
                self._break_suggested = True
                self._last_alert_time = current_time
                return AlertData(
                    level=3,
                    type="break_suggestion",
                    message="You've maintained deep visual focus for over 25 minutes! Consider a 5-minute stretch or screen break.",
                    actions=[
                        AlertAction(id="pause_break", label="Take a Break", action_type="pause"),
                        AlertAction(id="dismiss_break", label="Keep Working", action_type="dismiss"),
                    ],
                    timestamp=datetime.utcnow().isoformat()
                )

        # Evaluate Away Duration Levels
        if self._away_start_time is not None:
            away_duration = current_time - self._away_start_time

            # Level 3: Away for >= 2 minutes (120s)
            if away_duration >= self.config.level3_gentle_sec and self._last_alert_level < 3:
                if time_since_last_alert >= self.config.alert_cooldown_sec:
                    self._last_alert_level = 3
                    self._last_alert_time = current_time
                    return AlertData(
                        level=3,
                        type="notification",
                        message="You've been away from the screen for a while. Session is still active.",
                        actions=[
                            AlertAction(id="pause_away", label="Pause Session", action_type="pause"),
                            AlertAction(id="dismiss_away", label="I'm Back", action_type="dismiss"),
                        ],
                        timestamp=datetime.utcnow().isoformat()
                    )

            # Level 2: Away for >= 30 seconds
            elif away_duration >= self.config.level2_passive_sec and self._last_alert_level < 2:
                if time_since_last_alert >= 20.0:
                    self._last_alert_level = 2
                    self._last_alert_time = current_time
                    return AlertData(
                        level=2,
                        type="passive",
                        message="Attention dropped: screen visual engagement not detected.",
                        actions=[],
                        timestamp=datetime.utcnow().isoformat()
                    )

            # Level 1: Under 10s -> Grace period, no alert

        return None
