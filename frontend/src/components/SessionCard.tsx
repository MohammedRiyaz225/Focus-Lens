import React from 'react';
import { Session } from '../lib/types';
import { Clock, Eye, AlertCircle, ChevronRight, Calendar } from 'lucide-react';

interface SessionCardProps {
  session: Session;
  onClick: (sessionId: number) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onClick }) => {
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const getScoreBadgeColor = (focusPct: number) => {
    if (focusPct >= 75) return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
    if (focusPct >= 50) return 'text-green-400 bg-green-950/60 border-green-500/30';
    if (focusPct >= 30) return 'text-amber-400 bg-amber-950/60 border-amber-500/30';
    return 'text-rose-400 bg-rose-950/60 border-rose-500/30';
  };

  const dateFormatted = new Date(session.start_time).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onClick={() => onClick(session.id)}
      className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 cursor-pointer group flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
            {session.mode}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
            <Calendar size={13} />
            <span>{dateFormatted}</span>
          </div>
        </div>

        <div
          className={`px-3 py-1 rounded-xl text-sm font-bold border font-mono ${getScoreBadgeColor(
            session.focus_pct
          )}`}
        >
          {session.focus_pct}% Focus
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
        <div>
          <div className="text-slate-400 text-[10px]">Duration</div>
          <div className="font-semibold text-slate-200 mt-0.5">
            {formatDuration(session.duration_sec)}
          </div>
        </div>

        <div>
          <div className="text-slate-400 text-[10px]">Longest Streak</div>
          <div className="font-semibold text-slate-200 mt-0.5">
            {formatDuration(session.longest_focus_sec)}
          </div>
        </div>

        <div>
          <div className="text-slate-400 text-[10px]">Attention Drops</div>
          <div className="font-semibold text-slate-200 mt-0.5">
            {session.drop_count}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-indigo-400 group-hover:text-indigo-300 transition">
        <span>Inspect Telemetry Details</span>
        <ChevronRight size={14} className="group-hover:translate-x-1 transition" />
      </div>
    </div>
  );
};
