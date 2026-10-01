# FocusLens Attention Model & Scoring Mathematics

## 1. Overview
FocusLens estimates visual engagement by computing a continuous attention score $S \in [0.0, 1.0]$ for each incoming video frame, smoothing it across time with Exponential Moving Average (EMA), and passing it through a state classifier with temporal hysteresis.

---

## 2. Signal Extraction

### A. Face Presence ($S_{\text{face}}$)
$$
S_{\text{face}} = \begin{cases} 1.0 & \text{if MediaPipe detects face mesh} \\ 0.0 & \text{otherwise} \end{cases}
$$
*If $S_{\text{face}} = 0.0$, total raw attention drops to $0.0$ immediately.*

### B. Head Pose Facing Score ($S_{\text{head}}$)
Using `cv2.solvePnP` on key 3D model face points (nose tip, chin, eye corners, mouth corners):
- Compute calibrated Euler angles:
  $$\Delta \text{Yaw} = |\text{Yaw} - \text{Yaw}_{\text{neutral}}|$$
  $$\Delta \text{Pitch} = |\text{Pitch} - \text{Pitch}_{\text{neutral}}|$$
- Apply linear falloff beyond tolerance limits:
  $$S_{\text{yaw}} = \text{clamp}\left(1.0 - \frac{\Delta \text{Yaw} - 0.7\theta_{\text{max}}}{1.1\theta_{\text{max}}}, 0.0, 1.0\right)$$
  $$S_{\text{pitch}} = \text{clamp}\left(1.0 - \frac{\Delta \text{Pitch} - 0.7\phi_{\text{max}}}{1.1\phi_{\text{max}}}, 0.0, 1.0\right)$$
  $$S_{\text{head}} = 0.65 S_{\text{yaw}} + 0.35 S_{\text{pitch}}$$

### C. Eye Gaze Score ($S_{\text{eyes}}$)
- **Blink Filter:** Eye Aspect Ratio (EAR) is measured:
  $$\text{EAR} = \frac{|p_2 - p_6| + |p_3 - p_5|}{2|p_1 - p_4|}$$
  If $\text{EAR} < 0.18$, the frame is identified as a natural blink. The previous valid gaze score is preserved so blinking is never penalized.
- **Iris Offset:** Normalized horizontal and vertical position of iris center relative to eyelid bounds $(\Delta x, \Delta y)$ is mapped to $S_{\text{eyes}} \in [0.0, 1.0]$.

### D. Posture Stability ($S_{\text{stability}}$)
Calculated from the variance $\sigma^2$ of head pose over a rolling window of 15 frames:
$$
S_{\text{stability}} = \text{clamp}\left(1.0 - \frac{\sigma_{\text{total}}^2 - 4.0}{45.0}, 0.2, 1.0\right)
$$

---

## 3. Weighted Synthesis & EMA Smoothing

$$
S_{\text{raw}} = \frac{w_{\text{face}}S_{\text{face}} + w_{\text{head}}S_{\text{head}} + w_{\text{eyes}}S_{\text{eyes}} + w_{\text{stability}}S_{\text{stability}}}{w_{\text{face}} + w_{\text{head}} + w_{\text{eyes}} + w_{\text{stability}}}
$$

Default weights:
- Face Presence: $w_{\text{face}} = 0.25$
- Head Orientation: $w_{\text{head}} = 0.30$
- Eye Gaze: $w_{\text{eyes}} = 0.30$
- Pose Stability: $w_{\text{stability}} = 0.15$

Exponential Moving Average smoothing prevents erratic single-frame jumps:
$$
S_t = \alpha S_{\text{raw}} + (1 - \alpha) S_{t-1} \quad (\alpha = 0.35)
$$

---

## 4. State Classification & Hysteresis

| State | Score Range | Description |
|---|---|---|
| `away` | $0.00 - 0.30$ | Face absent or turned completely away |
| `possibly_distracted` | $0.31 - 0.55$ | Brief glances away, looking at phone |
| `engaged` | $0.56 - 0.75$ | Actively looking at screen |
| `highly_engaged` | $0.76 - 1.00$ | Centered posture & focused gaze |

**Hysteresis Filter:** To prevent rapid flickering around boundaries, any state transition requires the candidate state to persist for at least $N = 5$ consecutive frames before committing the state change.

---

## 5. Mode Presets

- **Coding:** Tolerates wider head yaw ($\pm 28^\circ$) for glancing at secondary notes.
- **Study:** Balanced sensitivity ($w_{\text{head}} = 0.35, w_{\text{eyes}} = 0.25$).
- **Reading:** Tolerates downward pitch ($\pm 32^\circ$) for reading lower sections of the screen or books.
- **Meeting:** Prioritizes face presence and orientation ($w_{\text{face}} = 0.35$).
