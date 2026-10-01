from typing import Dict, Any
from fastapi import APIRouter
from app.schemas.schemas import CalibrationRequest, CalibrationResponse
from app.engine.session_manager import session_manager

router = APIRouter(prefix="/api/calibrate", tags=["calibration"])


@router.post("", response_model=CalibrationResponse)
async def save_calibration(req: CalibrationRequest):
    calib_dict = req.model_dump()
    session_manager.apply_calibration(calib_dict)
    return CalibrationResponse(
        success=True,
        message="Calibration offsets updated successfully. Head pose and gaze thresholds adapted.",
        calibration_data=calib_dict
    )
