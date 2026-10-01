export type AttentionState = 'away' | 'possibly_distracted' | 'engaged' | 'highly_engaged';

export interface HeadPoseData {
  yaw: number;
  pitch: number;
  roll: number;
  direction: 'center' | 'left' | 'right' | 'up' | 'down' | 'unknown';
}

export interface GazeData {
  x: number;
  y: number;
  blink: boolean;
}

export interface AlertAction {
  id: string;
  label: string;
  action_type: 'pause' | 'resume' | 'dismiss' | 'take_break';
}

export interface AlertData {
  level: number; // 1, 2, 3, 4
  type: 'passive' | 'notification' | 'suggestion' | 'break_suggestion';
  message: string;
  actions: AlertAction[];
  timestamp: string;
}

export interface LiveSessionInfo {
  id: number | null;
  elapsed_sec: number;
  remaining_sec: number | null;
  status: 'idle' | 'running' | 'paused';
  mode: string;
}

export interface LiveStreamPacket {
  timestamp: string;
  attention_score: number;
  state: AttentionState;
  face_detected: boolean;
  head: HeadPoseData;
  gaze: GazeData;
  stability: number;
  alert: AlertData | null;
  session: LiveSessionInfo;
  preview_frame?: string | null;
}

export interface Session {
  id: number;
  user_id: number;
  mode: string;
  start_time: string;
  end_time: string | null;
  planned_duration_sec: number;
  duration_sec: number;
  focus_pct: number;
  away_pct: number;
  uncertain_pct: number;
  longest_focus_sec: number;
  drop_count: number;
  status: string;
  notes?: string | null;
}

export interface AttentionEvent {
  id: number;
  session_id: number;
  timestamp: string;
  score: number;
  state: AttentionState;
  face_detected: boolean;
  yaw: number;
  pitch: number;
  gaze_x: number;
  gaze_y: number;
}

export interface SessionDetail extends Session {
  events: AttentionEvent[];
  distraction_pattern?: string | null;
  most_distracted_window?: string | null;
  ai_summary?: string | null;
}

export interface AnalyticsSummary {
  focus_time_today_min: number;
  away_time_today_min: number;
  sessions_today: number;
  current_streak_days: number;
  avg_session_length_min: number;
  longest_session_min: number;
  total_drops_today: number;
  focus_drop_insight: string;
  mode_distribution: Record<string, number>;
}

export interface DailyAnalytics {
  date: string;
  focus_minutes: number;
  away_minutes: number;
  sessions_count: number;
  avg_attention_score: number;
  drop_count: number;
}

export interface SettingsData {
  app_name: string;
  app_version: string;
  camera_index: number;
  target_fps: number;
  simulate: boolean;
  weights: {
    weight_face: number;
    weight_head: number;
    weight_eyes: number;
    weight_stability: number;
  };
  thresholds: {
    threshold_away: number;
    threshold_distracted: number;
    threshold_engaged: number;
    threshold_highly_engaged: number;
  };
  alerts: {
    level1_grace_sec: number;
    level2_passive_sec: number;
    level3_gentle_sec: number;
    level4_drop_window_sec: number;
    level4_drop_count_threshold: number;
    alert_cooldown_sec: number;
    break_streak_sec: number;
  };
  retention_days: number;
  mode_presets: Record<string, Record<string, number>>;
  preview_enabled: boolean;
  calibration: Record<string, any>;
}

export interface CalibrationPayload {
  neutral_yaw: number;
  neutral_pitch: number;
  center_gaze_x: number;
  center_gaze_y: number;
  top_left_gaze?: [number, number];
  top_right_gaze?: [number, number];
  bottom_left_gaze?: [number, number];
  bottom_right_gaze?: [number, number];
}
