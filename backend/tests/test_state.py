import pytest
from app.engine.state import StateClassifier


def test_state_classifier_raw_boundaries():
    classifier = StateClassifier(
        threshold_away=0.30,
        threshold_distracted=0.55,
        threshold_engaged=0.75
    )
    assert classifier.classify_raw(0.10) == "away"
    assert classifier.classify_raw(0.30) == "away"
    assert classifier.classify_raw(0.40) == "possibly_distracted"
    assert classifier.classify_raw(0.55) == "possibly_distracted"
    assert classifier.classify_raw(0.65) == "engaged"
    assert classifier.classify_raw(0.75) == "engaged"
    assert classifier.classify_raw(0.85) == "highly_engaged"


def test_state_hysteresis_flicker_rejection():
    classifier = StateClassifier(
        threshold_away=0.30,
        threshold_distracted=0.55,
        threshold_engaged=0.75,
        hysteresis_frames=4
    )
    classifier.reset("engaged")

    # Single spike to away (0.10)
    st = classifier.update(0.10)
    assert st == "engaged"  # 1st frame: suppressed by hysteresis

    # 2nd frame at 0.10
    st = classifier.update(0.10)
    assert st == "engaged"  # 2nd frame: suppressed

    # Returns back to 0.70 (flicker was temporary)
    st = classifier.update(0.70)
    assert st == "engaged"  # Stays engaged, candidate reset


def test_state_hysteresis_committed_transition():
    classifier = StateClassifier(
        threshold_away=0.30,
        threshold_distracted=0.55,
        threshold_engaged=0.75,
        hysteresis_frames=3
    )
    classifier.reset("engaged")

    assert classifier.update(0.15) == "engaged"  # 1 of 3
    assert classifier.update(0.15) == "engaged"  # 2 of 3
    assert classifier.update(0.15) == "away"     # 3 of 3 -> committed transition!
    assert classifier.current_state == "away"
