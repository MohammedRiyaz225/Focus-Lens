# FocusLens Privacy Architecture & Data Policy

## Core Philosophy
FocusLens is built around a non-negotiable architectural invariant: **Your camera stays strictly local. FocusLens stores attention metrics, never your video.**

---

## 1. What Is NEVER Stored or Transmitted
- **No Raw Frames:** Webcam video frames are never written to disk, saved to a database, or transmitted over any external network.
- **No Biometric Identifiers:** Facial geometry and iris coordinates are processed exclusively in volatile memory (RAM) and immediately garbage-collected after computing relative angles.
- **No Cloud Dependencies:** 100% of computer vision and inference computation runs locally on your device's CPU.

---

## 2. In-Memory Lifecycle of a Video Frame
```
Webcam Sensor
    │ (Frame captured via OpenCV)
    ▼
RAM Buffer (1/15th of a second)
    │
    ├── MediaPipe Landmark Extraction (478 points)
    ├── Head Pose Euler Angles (Yaw, Pitch, Roll)
    ├── Iris Relative Ratios (Gaze X, Gaze Y)
    ├── Attention Engine Weight Synthesis (0.00 - 1.00)
    │
    ▼
Frame Discarded & Memory Recycled
```

---

## 3. What IS Stored Locally (Telemetry Only)
Only derived mathematical metrics are saved in your local SQLite database (`focuslens.db`):
- **Sessions:** `start_time`, `duration_sec`, `focus_pct`, `away_pct`, `longest_focus_sec`, `drop_count`.
- **Attention Events:** Downsampled to 1 row per 2 seconds containing timestamp, numerical score (e.g. `0.85`), discrete state (`engaged`), yaw/pitch in degrees, and normalized gaze ratios.
- **Calibration Offsets:** Neutral angle offsets configured by the user.

---

## 4. User Consent & Total Data Control
- **First-Run Dialog:** The camera will never activate until explicit consent is given.
- **Visual Camera Indicator:** A prominent blinking badge is displayed whenever the webcam hardware is active.
- **Immediate Hardware Release:** As soon as a session is paused or ended, the camera handle is immediately closed and released.
- **Instant Data Wipe:** A single click on the "Delete All My Data" button in the Privacy or Settings page permanently drops all session tables and wipes the database clean.

---

## 5. Scientific Honesty & Limitations
A webcam can only estimate **visual engagement** (face presence, head orientation, eye direction, and stability). It cannot know true neurological concentration or mental absorption. Environmental lighting, eyeglasses, camera angle, and multi-monitor setups can influence readings.
