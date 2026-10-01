# FocusLens API Reference

Base URL: `http://localhost:8000`

## REST Endpoints

### Sessions
- **`POST /api/sessions/start`**
  - Body: `{"mode": "Coding" | "Study" | "Reading" | "Meeting", "planned_duration_min": 25}`
  - Returns: Session object
- **`POST /api/sessions/{id}/pause`**
  - Pauses active session and pauses camera capture.
- **`POST /api/sessions/{id}/resume`**
  - Resumes session and camera capture.
- **`POST /api/sessions/{id}/end`**
  - Finalizes session stats (`focus_pct`, `away_pct`, `drop_count`, `longest_focus_sec`) and closes camera.
- **`GET /api/sessions?limit=20&offset=0&mode=Coding`**
  - Returns paginated list of past sessions.
- **`GET /api/sessions/{id}`**
  - Returns complete session breakdown including timeline attention events and AI coach summary.

### Analytics
- **`GET /api/analytics/summary`**
  - Returns today's focus time, away time, sessions count, current streak (consecutive days), and focus drop insights.
- **`GET /api/analytics/daily?days=7`**
  - Returns day-by-day focus duration and drop count trends.

### Settings & Privacy
- **`GET /api/settings`**
  - Retrieves active weights, thresholds, alert timings, and camera parameters.
- **`PUT /api/settings`**
  - Dynamically updates engine configuration.
- **`DELETE /api/data`**
  - **Privacy Wipe:** Permanently erases all session telemetry and attention events from local SQLite database.

### Calibration
- **`POST /api/calibrate`**
  - Body: `{"neutral_yaw": float, "neutral_pitch": float, "center_gaze_x": float, "center_gaze_y": float}`
  - Applies neutral posture offset to head pose and gaze estimators.

---

## WebSocket Stream

- **`ws://localhost:8000/ws/live`**
  - Streams real-time JSON packets at 5-10 Hz:
  ```json
  {
    "timestamp": "2026-09-28T16:45:00.000Z",
    "attention_score": 0.88,
    "state": "highly_engaged",
    "face_detected": true,
    "head": {"yaw": 1.2, "pitch": -2.5, "roll": 0.3, "direction": "center"},
    "gaze": {"x": 0.51, "y": 0.49, "blink": false},
    "stability": 0.96,
    "alert": null,
    "session": {"id": 1, "elapsed_sec": 420, "remaining_sec": 1080, "status": "running", "mode": "Coding"},
    "preview_frame": null
  }
  ```
