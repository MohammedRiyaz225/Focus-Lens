import time
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class DropEvent:
    start_time: float
    end_time: Optional[float] = None
    duration_sec: float = 0.0
    min_score: float = 0.0


class DistractionPatternDetector:
    """
    Analyzes visual engagement transitions and drop occurrences over time.
    Classifies patterns into:
    - 'frequent_short_drops' (e.g. quick phone checks, notification distractions)
    - 'prolonged_absence' (e.g. stepped away from desk)
    - 'gradual_focus_drift' (fatigue, looking around screen)
    - 'high_sustained_focus' (solid, uninterrupted engagement)
    """

    def __init__(self, short_drop_max_sec: float = 15.0, long_drop_min_sec: float = 60.0):
        self.short_drop_max_sec = short_drop_max_sec
        self.long_drop_min_sec = long_drop_min_sec

        self.drops: List[DropEvent] = []
        self._current_drop: Optional[DropEvent] = None
        self._focus_streaks: List[float] = []
        self._current_streak_start: Optional[float] = None

    def reset(self) -> None:
        self.drops.clear()
        self._current_drop = None
        self._focus_streaks.clear()
        self._current_streak_start = None

    def record_state(self, state: str, score: float, timestamp: float) -> None:
        is_low_attention = state in ("away", "possibly_distracted")

        # Track low attention drop segments
        if is_low_attention:
            if self._current_drop is None:
                self._current_drop = DropEvent(start_time=timestamp, min_score=score)
            else:
                self._current_drop.min_score = min(self._current_drop.min_score, score)

            # Close active focus streak
            if self._current_streak_start is not None:
                streak_len = timestamp - self._current_streak_start
                if streak_len > 5.0:
                    self._focus_streaks.append(streak_len)
                self._current_streak_start = None
        else:
            # Engaged state
            if self._current_drop is not None:
                self._current_drop.end_time = timestamp
                self._current_drop.duration_sec = max(0.1, timestamp - self._current_drop.start_time)
                self.drops.append(self._current_drop)
                self._current_drop = None

            if self._current_streak_start is None:
                self._current_streak_start = timestamp

    def get_drop_count_in_window(self, window_sec: float, current_time: float) -> int:
        cutoff = current_time - window_sec
        count = 0
        for d in self.drops:
            if d.start_time >= cutoff:
                count += 1
        if self._current_drop and self._current_drop.start_time >= cutoff:
            count += 1
        return count

    def get_longest_focus_streak(self, current_time: float) -> float:
        longest = max(self._focus_streaks) if self._focus_streaks else 0.0
        if self._current_streak_start is not None:
            active_streak = current_time - self._current_streak_start
            longest = max(longest, active_streak)
        return longest

    def classify_pattern(self, session_duration_sec: float) -> str:
        if session_duration_sec < 60.0:
            return "insufficient_data"

        total_drops = len(self.drops) + (1 if self._current_drop else 0)
        if total_drops == 0:
            return "high_sustained_focus"

        short_drops = [d for d in self.drops if d.duration_sec <= self.short_drop_max_sec]
        long_drops = [d for d in self.drops if d.duration_sec >= self.long_drop_min_sec]

        if len(short_drops) >= 3 and len(short_drops) / max(1, total_drops) >= 0.6:
            return "frequent_short_drops"

        if len(long_drops) >= 1:
            return "prolonged_absence"

        if total_drops >= 2:
            return "gradual_focus_drift"

        return "high_sustained_focus"

    def get_pattern_description(self, pattern: str) -> str:
        descriptions = {
            "high_sustained_focus": "Great job! You maintained sustained visual engagement throughout the session.",
            "frequent_short_drops": "Noticeable brief glances away. Often associated with phone notifications or multitasking.",
            "prolonged_absence": "One or more prolonged absences recorded during this session.",
            "gradual_focus_drift": "Visual attention gradually fluctuated over the session duration.",
            "insufficient_data": "Session too short to establish a reliable attention pattern."
        }
        return descriptions.get(pattern, "Pattern analyzed from session visual metrics.")
