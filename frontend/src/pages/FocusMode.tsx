import React from 'react';
import { useLiveAttention } from '../hooks/useLiveAttention';
import { useSession } from '../hooks/useSession';
import { StateChip } from '../components/StateChip';
import { Toast } from '../components/Toast';
import { Play, Pause, Square, ArrowLeft, ShieldCheck, Sparkles, Activity } from 'lucide-react';

interface FocusModeProps {
  onExit: () => void;
  onSessionEnded: (sessionId: number) => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ onExit, onSessionEnded }) => {
  const { packet, activeAlert, dismissAlert } = useLiveAttention();
  const { pauseSession, resumeSession, endSession } = useSession();

  const session = packet?.session;
  const isPaused = session?.status === 'paused';
  const score = packet ? Math.round(packet.attention_score * 100) : 0;
  const state = packet ? packet.state : 'away';

  const elapsedSec = session?.elapsed_sec || 0;
  const remainingSec = session?.remaining_sec ?? 0;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = async () => {
    if (session?.id) await pauseSession(session.id);
  };

  const handleResume = async () => {
    if (session?.id) await resumeSession(session.id);
  };

  const handleEnd = async () => {
    if (session?.id) {
      await endSession(session.id);
      onSessionEnded(session.id);
    } else {
      onExit();
    }
  };

  return (
    <div className="min-h-[82vh] flex flex-col justify-between py-6 px-4 animate-fade-in max-w-4xl mx-auto">
      {/* Top minimal header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 transition"
        >
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
            {session?.mode || 'Coding'} Mode
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30">
            <ShieldCheck size={13} />
            <span>Private Local Session</span>
          </div>
        </div>
      </div>

      {/* Main Big Focus Display */}
      <div className="my-auto flex flex-col items-center justify-center text-center space-y-6">
        {/* State Chip */}
        <div className="scale-110">
          <StateChip state={state} size="lg" />
        </div>

        {/* Big Countdown Timer */}
        <div className="text-8xl sm:text-9xl font-black font-mono tracking-tighter text-white select-none">
          {formatTime(remainingSec)}
        </div>

        {/* Live Attention Percentage & Subtle Status Line */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <Activity size={18} className="text-emerald-400" />
            <span className="text-xl font-bold font-mono">{score}%</span>
            <span className="text-sm text-slate-400">Visual Engagement</span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {state === 'highly_engaged'
              ? '✨ Deep visual engagement sustained'
              : state === 'engaged'
              ? '👁️ Attention stable on screen'
              : state === 'possibly_distracted'
              ? '⚠️ Slight glance away from screen'
              : '🚫 User visual presence not detected'}
          </div>
        </div>

        {/* Minimal Controls */}
        <div className="flex items-center gap-4 pt-6">
          {isPaused ? (
            <button
              onClick={handleResume}
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-emerald-600/30 transition transform active:scale-95"
            >
              <Play size={18} />
              <span>Resume Session</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm flex items-center gap-2 transition transform active:scale-95"
            >
              <Pause size={18} />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleEnd}
            className="px-8 py-3.5 rounded-2xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold text-sm flex items-center gap-2 transition transform active:scale-95"
          >
            <Square size={18} />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center text-[11px] text-slate-400">
        Estimates visual engagement via local camera orientation. Does not claim mental state.
      </div>

      {/* Non-blocking alerts toast */}
      <Toast
        alert={activeAlert}
        onDismiss={dismissAlert}
        onActionClick={async (act) => {
          if (act === 'pause' && session?.id) await pauseSession(session.id);
        }}
      />
    </div>
  );
};
