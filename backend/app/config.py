from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AlertConfig(BaseModel):
    # Level 1: Under 10s away -> no action
    level1_grace_sec: float = 10.0
    # Level 2: 30s away -> passive indicator
    level2_passive_sec: float = 30.0
    # Level 3: 2 mins away -> gentle notification
    level3_gentle_sec: float = 120.0
    # Level 4: 3 or more drops in 10 mins -> adaptive pause suggestion
    level4_drop_window_sec: float = 600.0
    level4_drop_count_threshold: int = 3
    # Cooldown between similar level alerts (seconds)
    alert_cooldown_sec: float = 45.0
    # Break suggestion threshold: long stretch + increasing drops
    break_streak_sec: float = 1500.0  # 25 minutes


class ModeThresholds(BaseModel):
    head_yaw_max: float = 25.0
    head_pitch_max: float = 20.0
    gaze_tol_x: float = 0.22
    gaze_tol_y: float = 0.25
    blink_ear_threshold: float = 0.18
    # Reading mode tolerates more downward pitch/gaze
    # Coding tolerates brief side glances


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="FOCUSLENS_", env_file=".env", extra="ignore")

    app_name: str = "FocusLens"
    app_version: str = "1.0.0"
    debug: bool = False
    simulate: bool = False

    # Server
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

    # Database
    db_url: str = "sqlite+aiosqlite:///./focuslens.db"

    # Vision & Camera
    camera_index: int = 0
    target_fps: int = 15
    capture_width: int = 640
    capture_height: int = 480
    frame_skip: int = 0  # Process every Nth frame if needed for lower CPU
    stream_preview_fps: int = 10

    # Attention Weights
    weight_face: float = 0.25
    weight_head: float = 0.30
    weight_eyes: float = 0.30
    weight_stability: float = 0.15

    # Smoothing & Hysteresis
    ema_alpha: float = 0.35  # Exponential moving average factor
    state_hysteresis_frames: int = 5  # Frames required to switch state
    stability_window_size: int = 15

    # State Thresholds
    threshold_away: float = 0.30
    threshold_distracted: float = 0.55
    threshold_engaged: float = 0.75
    threshold_highly_engaged: float = 1.00

    # Persistence Downsampling
    db_downsample_interval_sec: float = 2.0  # Write 1 event per 2s to DB

    # Data Retention (0 = infinite)
    retention_days: int = 30

    # Alert Configuration
    alerts: AlertConfig = Field(default_factory=AlertConfig)

    # Preset Mode Configurations
    mode_presets: Dict[str, Dict[str, float]] = {
        "Coding": {
            "weight_face": 0.25,
            "weight_head": 0.30,
            "weight_eyes": 0.30,
            "weight_stability": 0.15,
            "head_yaw_max": 28.0,
            "head_pitch_max": 22.0,
        },
        "Study": {
            "weight_face": 0.25,
            "weight_head": 0.35,
            "weight_eyes": 0.25,
            "weight_stability": 0.15,
            "head_yaw_max": 24.0,
            "head_pitch_max": 20.0,
        },
        "Reading": {
            "weight_face": 0.25,
            "weight_head": 0.25,
            "weight_eyes": 0.35,
            "weight_stability": 0.15,
            "head_yaw_max": 22.0,
            "head_pitch_max": 32.0,  # tolerates reading lower on screen/desk
        },
        "Meeting": {
            "weight_face": 0.35,
            "weight_head": 0.30,
            "weight_eyes": 0.20,
            "weight_stability": 0.15,
            "head_yaw_max": 30.0,
            "head_pitch_max": 25.0,
        },
    }


settings = Settings()
