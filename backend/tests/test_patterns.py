import pytest
from app.engine.patterns import DistractionPatternDetector


def test_pattern_high_sustained_focus():
    detector = DistractionPatternDetector()
    t0 = 100.0
    for i in range(10):
        detector.record_state("engaged", 0.85, t0 + i * 10.0)

    pattern = detector.classify_pattern(session_duration_sec=100.0)
    assert pattern == "high_sustained_focus"


def test_pattern_frequent_short_drops():
    detector = DistractionPatternDetector(short_drop_max_sec=15.0)
    t = 100.0
    # Simulate 3 quick glances away (e.g. 5 sec drops)
    for _ in range(4):
        detector.record_state("away", 0.2, t)
        t += 6.0
        detector.record_state("engaged", 0.8, t)
        t += 30.0

    pattern = detector.classify_pattern(session_duration_sec=180.0)
    assert pattern == "frequent_short_drops"


def test_pattern_prolonged_absence():
    detector = DistractionPatternDetector(long_drop_min_sec=60.0)
    t0 = 100.0
    detector.record_state("away", 0.05, t0)
    detector.record_state("engaged", 0.80, t0 + 120.0)  # 2 minute absence

    pattern = detector.classify_pattern(session_duration_sec=150.0)
    assert pattern == "prolonged_absence"
