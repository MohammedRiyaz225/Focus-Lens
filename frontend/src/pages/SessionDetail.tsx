import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SessionDetail } from '../lib/types';
import { Heatmap } from '../components/Heatmap';
import { Timeline } from '../components/Timeline';
import {
  ArrowLeft,
  Clock,
  Eye,
  EyeOff,
  Flame,
  AlertTriangle,
  Download,
  Sparkles,
  Calendar,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface SessionDetailPageProps {
  sessionId: number;
  onBack: () => void;
}

export const SessionDetailPage: React.FC<SessionDetailPageProps> = ({
  sessionId,
  onBack,
}) => {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const data = await api.getSessionDetail(sessionId);
        setDetail(data);
      } catch (e) {
        console.error('Failed to load session detail:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [sessionId]);

  const handleExportJSON = () => {
    if (!detail) return;
    const blob = new Blob([JSON.stringify(detail, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focuslens_session_${detail.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!detail || !detail.events) return;
    const headers = 'timestamp,score,state,face_detected,yaw,pitch,gaze_x,gaze_y\n';
    const rows = detail.events
      .map(
        (e) =>
          `"${e.timestamp}",${e.score},"${e.state}",${e.face_detected},${e.yaw},${e.pitch},${e.gaze_x},${e.gaze_y}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focuslens_session_${detail.id}_events.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  if (isLoading || !detail) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Loading session breakdown...
      </div>
    );
  }

  const dateStr = new Date(detail.start_time).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header with back and export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">Session #{detail.id} Summary</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                {detail.mode}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <Calendar size={13} />
              <span>{dateStr}</span>
            </div>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <FileText size={13} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Download size={13} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400">Total Duration</div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {formatSec(detail.duration_sec)}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400">Visual Focus Ratio</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {detail.focus_pct}%
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400">Longest Focus Streak</div>
          <div className="text-2xl font-black text-indigo-300 font-mono mt-1">
            {formatSec(detail.longest_focus_sec)}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400">Attention Drops</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {detail.drop_count}
          </div>
        </div>
      </div>

      {/* AI Coach Summary Card */}
      {detail.ai_summary && (
        <div className="glass-panel rounded-2xl p-5 border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 to-slate-900/60 shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles size={18} />
            <h3 className="text-xs font-bold uppercase tracking-wider">AI Session Coach Analysis</h3>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">{detail.ai_summary}</p>
        </div>
      )}

      {/* Pattern Breakdown & Most Distracted Window */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold uppercase text-slate-400">Distraction Pattern</span>
          <p className="text-sm font-bold text-slate-200 capitalize">
            {detail.distraction_pattern?.replace(/_/g, ' ') || 'High sustained focus'}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold uppercase text-slate-400">
            Most Fluctuating Window
          </span>
          <p className="text-sm font-bold text-amber-300 font-mono">
            {detail.most_distracted_window || 'No significant drop window detected'}
          </p>
        </div>
      </div>

      {/* Visual Timeline and Heatmap */}
      <Timeline events={detail.events} />
      <Heatmap events={detail.events} totalDurationSec={detail.duration_sec} />
    </div>
  );
};
