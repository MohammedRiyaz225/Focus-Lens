from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# Sessions
class SessionStartRequest(BaseModel):
    mode: str = Field(default="Coding", description="Focus mode: Coding, Study, Reading, Meeting")
    planned_duration_min: int = Field(default=25, ge=1, le=240, description="Planned duration in minutes")


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    mode: str
    start_time: datetime
    end_time: Optional[datetime] = None
    planned_duration_sec: int
    duration_sec: int
    focus_pct: float
    away_pct: float
    uncertain_pct: float
    longest_focus_sec: int
    drop_count: int
    status: str
    notes: Optional[str] = None


class AttentionEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    timestamp: datetime
    score: float
    state: str
    face_detected: bool
    yaw: float
    pitch: float
    gaze_x: float
    gaze_y: float


class SessionDetailResponse(SessionResponse):
    events: List[AttentionEventResponse] = []
    distraction_pattern: Optional[str] = None
    most_distracted_window: Optional[str] = None
    ai_summary: Optional[str] = None


# Analytics
class DailyAnalytics(BaseModel):
    date: str
    focus_minutes: float
    away_minutes: float
    sessions_count: int
    avg_attention_score: float
    drop_count: int


class WeeklyAnalytics(BaseModel):
    week_start: str
    total_focus_minutes: float
    total_sessions: int
    daily_breakdown: List[DailyAnalytics]


class AnalyticsSummary(BaseModel):
    focus_time_today_min: float
    away_time_today_min: float
    sessions_today: int
    current_streak_days: int
    avg_session_length_min: float
    longest_session_min: float
    total_drops_today: int
    focus_drop_insight: str  # e.g. "Your visual engagement usually drops after ~18 minutes (estimate)"
    mode_distribution: Dict[str, int]


# Calibration
class CalibrationRequest(BaseModel):
    neutral_yaw: float = 0.0
    neutral_pitch: float = 0.0
    center_gaze_x: float = 0.5
    center_gaze_y: float = 0.5
    top_left_gaze: Optional[List[float]] = None
    top_right_gaze: Optional[List[float]] = None
    bottom_left_gaze: Optional[List[float]] = None
    bottom_right_gaze: Optional[List[float]] = None


class CalibrationResponse(BaseModel):
    success: bool
    message: str
    calibration_data: Dict[str, Any]


# WebSocket Live Packet
class HeadPoseData(BaseModel):
    yaw: float
    pitch: float
    roll: float
    direction: str = "center"


class GazeData(BaseModel):
    x: float
    y: float
    blink: bool = False


class AlertAction(BaseModel):
    id: str
    label: str
    action_type: str  # pause, resume, dismiss, take_break


class AlertData(BaseModel):
    level: int  # 1, 2, 3, 4
    type: str   # passive, notification, suggestion, break_suggestion
    message: str
    actions: List[AlertAction] = []
    timestamp: str


class LiveSessionInfo(BaseModel):
    id: Optional[int] = None
    elapsed_sec: int = 0
    remaining_sec: Optional[int] = None
    status: str = "idle"  # idle, running, paused
    mode: str = "Coding"


class LiveStreamPacket(BaseModel):
    timestamp: str
    attention_score: float
    state: str  # away, possibly_distracted, engaged, highly_engaged
    face_detected: bool
    head: HeadPoseData
    gaze: GazeData
    stability: float
    alert: Optional[AlertData] = None
    session: LiveSessionInfo
    preview_frame: Optional[str] = None  # Base64 JPEG frame if preview enabled
