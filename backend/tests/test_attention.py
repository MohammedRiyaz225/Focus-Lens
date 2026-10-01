import pytest
from app.engine.attention import AttentionEngine
from app.vision.features import FrameFeatures, HeadPoseResult, GazeResult


def test_attention_engine_face_absent():
    engine = AttentionEngine()
    features = FrameFeatures(
        timestamp=1000.0,
        face_detected=False,
        head_pose=HeadPoseResult(facing_score=0.0),
        gaze=GazeResult(gaze_score=0.0)
    )
    raw, smoothed, stab = engine.process(features)
    assert raw == 0.0
    assert smoothed == 0.0
    assert stab == 0.0


def test_attention_engine_perfect_focus():
    engine = AttentionEngine(ema_alpha=1.0)  # No smoothing delay for exact test
    features = FrameFeatures(
        timestamp=1000.0,
        face_detected=True,
        head_pose=HeadPoseResult(facing_score=1.0),
        gaze=GazeResult(gaze_score=1.0)
    )
    raw, smoothed, stab = engine.process(features)
    assert raw >= 0.95
    assert smoothed >= 0.95
    assert stab == 1.0


def test_attention_engine_weights():
    # Weights: face=0.25, head=0.25, eyes=0.25, stability=0.25
    engine = AttentionEngine(
        weight_face=0.25,
        weight_head=0.25,
        weight_eyes=0.25,
        weight_stability=0.25,
        ema_alpha=1.0
    )
    # Head turned away (0.0), eyes away (0.0), face present (1.0), stable (1.0)
    features = FrameFeatures(
        timestamp=1000.0,
        face_detected=True,
        head_pose=HeadPoseResult(facing_score=0.0),
        gaze=GazeResult(gaze_score=0.0)
    )
    raw, smoothed, stab = engine.process(features)
    # Expected: (0.25 * 1.0 + 0.25 * 0.0 + 0.25 * 0.0 + 0.25 * 1.0) = 0.50
    assert 0.49 <= raw <= 0.51


def test_attention_ema_smoothing():
    engine = AttentionEngine(ema_alpha=0.5)
    # Start with 1.0
    f1 = FrameFeatures(timestamp=1.0, face_detected=True, head_pose=HeadPoseResult(facing_score=1.0), gaze=GazeResult(gaze_score=1.0))
    _, s1, _ = engine.process(f1)
    assert s1 >= 0.95

    # Sudden drop to 0.0
    f2 = FrameFeatures(timestamp=2.0, face_detected=False)
    _, s2, _ = engine.process(f2)
    # Smoothed should be roughly 0.5 * 0.0 + 0.5 * s1 ~= 0.50
    assert 0.45 <= s2 <= 0.55
