import React, { useState, useEffect } from 'react';
import { useLiveAttention } from '../hooks/useLiveAttention';
import { useSession } from '../hooks/useSession';
import { api } from '../lib/api';
import { AnalyticsSummary, Session } from '../lib/types';
import { AdaptiveFocusCard } from '../components/AdaptiveFocusCard';
import { AttentionMeter } from '../components/AttentionMeter';
import { FocusTimer } from '../components/FocusTimer';
import { Heatmap } from '../components/Heatmap';
import { Toast } from '../components/Toast';
import { CalibrationWizard } from '../components/CalibrationWizard';
import { VideoPreviewModal } from '../components/VideoPreviewModal';
import {
  Flame,
  Clock,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Crosshair,
  Maximize2,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface DashboardProps {
  onNavigateToFocusMode: () => void;
  onNavigateToSessionDetail: (sessionId: number) => void;
  onNavigateToShowcase?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToFocusMode,
  onNavigateToSessionDetail,
  onNavigateToShowcase,
}) => {
  const { packet, isConnected, activeAlert, dismissAlert, historyScores } = useLiveAttention();
  const { startSession, pauseSession, resumeSession, endSession } = useSession();

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [latestSession, setLatestSession] = useState<Session | null>(null);
  const [latestEvents, setLatestEvents] = useState<any[]>([]);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [meterLayout, setMeterLayout] = useState<'assistant' | 'dial'>('assistant');

  const loadDashboardData = async () => {
    try {
      const summaryData = await api.getAnalyticsSummary();
      setSummary(summaryData);

      const sessions = await api.getSessions(1);
      if (sessions && sessions.length > 0) {
        setLatestSession(sessions[0]);
        const detail = await api.getSessionDetail(sessions[0].id);
        setLatestEvents(detail.events || []);
      }
    } catch (e) {
      console.error('Failed to load dashboard analytics:', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleStartSession = async (mode: string, durationMin: number) => {
    await startSession(mode, durationMin);
    onNavigateToFocusMode();
  };

  const handleToastAction = async (actionType: string) => {
    if (actionType === 'pause' && packet?.session?.id) {
      await pauseSession(packet.session.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            FocusLens Dashboard
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              v1.0 Local
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual engagement & distraction pattern estimation engine.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToShowcase && (
            <button
              onClick={onNavigateToShowcase}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 hover:from-blue-800/80 hover:to-indigo-800/80 text-cyan-200 border border-cyan-500/40 text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-950/50"
            >
              <Sparkles size={14} className="text-cyan-400" />
              <span>Adaptive Focus Overview</span>
              <ArrowRight size={12} className="text-cyan-300" />
            </button>
          )}

          <button
            onClick={() => setShowCalibration(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition"
          >
            <Crosshair size={14} className="text-emerald-400" />
            <span>Calibrate</span>
          </button>

          {packet?.session?.status === 'running' && (
            <button
              onClick={onNavigateToFocusMode}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition animate-pulse"
            >
              <Maximize2 size={14} />
              <span>Enter Focus Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* Adaptive Focus Pitch / Hero Banner */}
      {onNavigateToShowcase && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-cyan-400">
                  Adaptive Focus Concept
                </span>
                <span className="text-[10px] text-slate-400 italic">
                  Not just a timer, but a smart eye on your focus.
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                Pomodoros only count time. FocusLens uses webcam AI to detect gaze, screen presence, and trigger adaptive breaks.
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToShowcase}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition shrink-0"
          >
            <span>Explore Presentation Flow</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Focus Time Today</span>
            <Clock size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {summary?.focus_time_today_min || 0}m
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Estimated visual engagement
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Away Time Today</span>
            <EyeOff size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {summary?.away_time_today_min || 0}m
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Glances & absences
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sessions Today</span>
            <CheckCircle2 size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {summary?.sessions_today || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Completed or active
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Focus Streak</span>
            <Flame size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {summary?.current_streak_days || 0} <span className="text-sm font-normal text-slate-400">days</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Daily consistency streak
          </div>
        </div>
      </div>

      {/* Main Interactive Grid: Adaptive Focus Assistant + Focus Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Visual Telemetry Assistant</span>
            </span>

            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setMeterLayout('assistant')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  meterLayout === 'assistant' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Assistant View
              </button>
              <button
                onClick={() => setMeterLayout('dial')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  meterLayout === 'dial' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Gauge Dial
              </button>
            </div>
          </div>

          {meterLayout === 'assistant' ? (
            <AdaptiveFocusCard
              packet={packet}
              mode="live"
              allowToggleMode={true}
              onTakeBreak={async () => {
                if (packet?.session?.id) await pauseSession(packet.session.id);
              }}
            />
          ) : (
            <AttentionMeter
              packet={packet}
              isConnected={isConnected}
              onTogglePreview={() => setShowPreview(!showPreview)}
            />
          )}
        </div>

        <div className="lg:col-span-6">
          <FocusTimer
            sessionInfo={packet?.session || null}
            onStart={handleStartSession}
            onPause={async () => {
              if (packet?.session?.id) await pauseSession(packet.session.id);
            }}
            onResume={async () => {
              if (packet?.session?.id) await resumeSession(packet.session.id);
            }}
            onEnd={async () => {
              if (packet?.session?.id) {
                await endSession(packet.session.id);
                loadDashboardData();
                onNavigateToSessionDetail(packet.session.id);
              }
            }}
          />
        </div>
      </div>

      {/* Adaptive Focus Drop Insight Card */}
      {summary?.focus_drop_insight && (
        <div className="glass-panel rounded-2xl p-4 border border-indigo-500/30 bg-indigo-950/30 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="text-xs">
            <span className="font-semibold text-indigo-200 block">Personal Attention Pattern Insight</span>
            <p className="text-slate-300 mt-0.5 leading-relaxed">{summary.focus_drop_insight}</p>
          </div>
        </div>
      )}

      {/* Real-time Live Engagement Sparkline Stream */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Live Stream Attention Sparkline (Last 30 updates)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {packet ? `${Math.round(packet.attention_score * 100)}%` : '--'}
          </span>
        </div>

        <div className="h-28 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyScores}>
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latest Session Heatmap */}
      {latestEvents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Latest Session Heatmap</h3>
            {latestSession && (
              <button
                onClick={() => onNavigateToSessionDetail(latestSession.id)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                View Full Session Report
              </button>
            )}
          </div>
          <Heatmap events={latestEvents} totalDurationSec={latestSession?.duration_sec || 0} />
        </div>
      )}

      {/* Modals and Toasts */}
      {showCalibration && (
        <CalibrationWizard
          packet={packet}
          onClose={() => setShowCalibration(false)}
          onCompleted={() => loadDashboardData()}
        />
      )}

      {showPreview && (
        <VideoPreviewModal packet={packet} onClose={() => setShowPreview(false)} />
      )}

      <Toast
        alert={activeAlert}
        onDismiss={dismissAlert}
        onActionClick={handleToastAction}
      />
    </div>
  );
};
