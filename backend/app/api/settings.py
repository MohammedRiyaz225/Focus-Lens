from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.config import settings
from app.db.database import get_db
from app.db.models import Session, AttentionEvent, SettingRecord, User
from app.engine.session_manager import session_manager

router = APIRouter(prefix="/api", tags=["settings"])


@router.get("/settings")
async def get_settings():
    return {
        "app_name": settings.app_name,
        "app_version": settings.app_version,
        "camera_index": settings.camera_index,
        "target_fps": settings.target_fps,
        "simulate": settings.simulate,
        "weights": {
            "weight_face": settings.weight_face,
            "weight_head": settings.weight_head,
            "weight_eyes": settings.weight_eyes,
            "weight_stability": settings.weight_stability,
        },
        "thresholds": {
            "threshold_away": settings.threshold_away,
            "threshold_distracted": settings.threshold_distracted,
            "threshold_engaged": settings.threshold_engaged,
            "threshold_highly_engaged": settings.threshold_highly_engaged,
        },
        "alerts": settings.alerts.model_dump(),
        "retention_days": settings.retention_days,
        "mode_presets": settings.mode_presets,
        "preview_enabled": session_manager._preview_enabled,
        "calibration": session_manager.calibration_data,
    }


@router.put("/settings")
async def update_settings(payload: Dict[str, Any]):
    if "weights" in payload:
        w = payload["weights"]
        settings.weight_face = float(w.get("weight_face", settings.weight_face))
        settings.weight_head = float(w.get("weight_head", settings.weight_head))
        settings.weight_eyes = float(w.get("weight_eyes", settings.weight_eyes))
        settings.weight_stability = float(w.get("weight_stability", settings.weight_stability))
        session_manager.attention_engine.update_weights(
            settings.weight_face, settings.weight_head, settings.weight_eyes, settings.weight_stability
        )

    if "thresholds" in payload:
        t = payload["thresholds"]
        settings.threshold_away = float(t.get("threshold_away", settings.threshold_away))
        settings.threshold_distracted = float(t.get("threshold_distracted", settings.threshold_distracted))
        settings.threshold_engaged = float(t.get("threshold_engaged", settings.threshold_engaged))
        session_manager.state_classifier.update_thresholds(
            settings.threshold_away, settings.threshold_distracted, settings.threshold_engaged, settings.state_hysteresis_frames
        )

    if "target_fps" in payload:
        settings.target_fps = int(payload["target_fps"])
        session_manager.camera_service.target_fps = settings.target_fps

    if "preview_enabled" in payload:
        session_manager.set_preview_enabled(bool(payload["preview_enabled"]))

    if "simulate" in payload:
        settings.simulate = bool(payload["simulate"])
        session_manager.camera_service.simulate = settings.simulate

    if "retention_days" in payload:
        settings.retention_days = int(payload["retention_days"])

    return {"status": "success", "message": "Settings updated"}


@router.delete("/data")
async def delete_all_data(db: AsyncSession = Depends(get_db)):
    """
    Privacy-first: Wipe all attention events, sessions, and reset database.
    Raw frames were never stored, and this deletes all derived telemetry.
    """
    try:
        await db.execute(delete(AttentionEvent))
        await db.execute(delete(Session))
        await db.commit()

        # Reset session manager state
        session_manager.end_session()
        session_manager.pattern_detector.reset()
        session_manager.alert_engine.reset()

        return {
            "status": "success",
            "message": "All session telemetry and attention event data have been permanently erased from your device."
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to erase data: {str(e)}")
