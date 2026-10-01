import pytest
from app.config import AlertConfig
from app.engine.alerts import AdaptiveAlertEngine
from app.engine.patterns import DistractionPatternDetector


def test_alert_level1_grace_period():
    config = AlertConfig(level1_grace_sec=10.0, level2_passive_sec=30.0, level3_gentle_sec=120.0)
    engine = AdaptiveAlertEngine(config)
    detector = DistractionPatternDetector()

    # 5 seconds of 'away' state
    t0 = 1000.0
    detector.record_state("away", 0.1, t0)
    alert = engine.check("away", 0.1, t0 + 5.0, detector, session_elapsed_sec=30.0)

    # Within grace period (<10s) -> No alert fired
    assert alert is None


def test_alert_level2_passive_indicator():
    config = AlertConfig(level1_grace_sec=10.0, level2_passive_sec=30.0, level3_gentle_sec=120.0)
    engine = AdaptiveAlertEngine(config)
    detector = DistractionPatternDetector()

    t0 = 1000.0
    # User starts being away at t0
    engine.check("away", 0.1, t0, detector, session_elapsed_sec=60.0)
    # Check at 31 seconds away
    alert = engine.check("away", 0.1, t0 + 31.0, detector, session_elapsed_sec=91.0)

    assert alert is not None
    assert alert.level == 2
    assert alert.type == "passive"
    assert "Attention dropped" in alert.message


def test_alert_level3_gentle_notification():
    config = AlertConfig(level1_grace_sec=10.0, level2_passive_sec=30.0, level3_gentle_sec=120.0)
    engine = AdaptiveAlertEngine(config)
    detector = DistractionPatternDetector()

    t0 = 1000.0
    engine.check("away", 0.1, t0, detector, session_elapsed_sec=100.0)
    # Check at 125 seconds away
    alert = engine.check("away", 0.1, t0 + 125.0, detector, session_elapsed_sec=225.0)

    assert alert is not None
    assert alert.level == 3
    assert alert.type == "notification"
    assert len(alert.actions) >= 1


def test_alert_level4_repeated_drops():
    config = AlertConfig(level4_drop_window_sec=600.0, level4_drop_count_threshold=3, alert_cooldown_sec=10.0)
    engine = AdaptiveAlertEngine(config)
    detector = DistractionPatternDetector()

    t0 = 1000.0
    # Simulate 3 distinct drops in last 5 minutes
    # Drop 1
    detector.record_state("away", 0.1, t0 + 10.0)
    detector.record_state("engaged", 0.8, t0 + 20.0)
    # Drop 2
    detector.record_state("away", 0.1, t0 + 60.0)
    detector.record_state("engaged", 0.8, t0 + 70.0)
    # Drop 3
    detector.record_state("away", 0.1, t0 + 120.0)
    detector.record_state("engaged", 0.8, t0 + 130.0)

    # Check alert at t0 + 140s
    alert = engine.check("engaged", 0.8, t0 + 140.0, detector, session_elapsed_sec=140.0)

    assert alert is not None
    assert alert.level == 4
    assert alert.type == "suggestion"
    assert any(a.id == "pause" for a in alert.actions)
    assert any(a.id == "continue" for a in alert.actions)
