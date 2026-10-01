import pytest
from sqlalchemy import inspect
from app.db.models import Session, AttentionEvent, User, SettingRecord


def test_no_raw_frames_in_db_models():
    """Verify that no database model contains image/blob/frame storage attributes."""
    models = [Session, AttentionEvent, User, SettingRecord]
    for model in models:
        mapper = inspect(model)
        for column in mapper.columns:
            col_name = column.name.lower()
            col_type = str(column.type).lower()
            # Assert no blob, binary, or image frame column exists
            assert "frame" not in col_name or col_name == "frame_skip"
            assert "image" not in col_name
            assert "blob" not in col_type
            assert "binary" not in col_type
            assert "video" not in col_name


def test_attention_event_stores_only_derived_metrics():
    """Verify that AttentionEvent only stores numerical telemetry."""
    mapper = inspect(AttentionEvent)
    column_names = {col.name for col in mapper.columns}
    expected_allowed = {
        "id", "session_id", "timestamp", "score", "state",
        "face_detected", "yaw", "pitch", "gaze_x", "gaze_y"
    }
    assert column_names == expected_allowed
