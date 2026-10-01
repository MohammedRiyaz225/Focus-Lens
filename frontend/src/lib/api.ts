import {
  Session,
  SessionDetail,
  AnalyticsSummary,
  DailyAnalytics,
  SettingsData,
  CalibrationPayload,
} from './types';

const API_BASE = 'http://localhost:8000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; camera_active: boolean; simulate_mode: boolean }>('/api/health'),

  // Sessions
  startSession: (mode: string, planned_duration_min: number) =>
    request<Session>('/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ mode, planned_duration_min }),
    }),

  pauseSession: (sessionId: number) =>
    request<Session>(`/api/sessions/${sessionId}/pause`, { method: 'POST' }),

  resumeSession: (sessionId: number) =>
    request<Session>(`/api/sessions/${sessionId}/resume`, { method: 'POST' }),

  endSession: (sessionId: number) =>
    request<Session>(`/api/sessions/${sessionId}/end`, { method: 'POST' }),

  getSessions: (limit: number = 20, offset: number = 0, mode?: string) => {
    const url = `/api/sessions?limit=${limit}&offset=${offset}${mode && mode !== 'All' ? `&mode=${mode}` : ''}`;
    return request<Session[]>(url);
  },

  getSessionDetail: (sessionId: number) =>
    request<SessionDetail>(`/api/sessions/${sessionId}`),

  // Analytics
  getAnalyticsSummary: () => request<AnalyticsSummary>('/api/analytics/summary'),
  getDailyAnalytics: (days: number = 7) => request<DailyAnalytics[]>(`/api/analytics/daily?days=${days}`),

  // Settings
  getSettings: () => request<SettingsData>('/api/settings'),
  updateSettings: (settings: Partial<SettingsData>) =>
    request<{ status: string; message: string }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  deleteAllData: () =>
    request<{ status: string; message: string }>('/api/data', {
      method: 'DELETE',
    }),

  // Calibration
  saveCalibration: (calib: CalibrationPayload) =>
    request<{ success: boolean; message: string; calibration_data: any }>('/api/calibrate', {
      method: 'POST',
      body: JSON.stringify(calib),
    }),
};
