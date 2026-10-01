import React, { useState } from 'react';
import { Play, Pause, Square, Sparkles, Clock, Target } from 'lucide-react';
import { LiveSessionInfo } from '../lib/types';

interface FocusTimerProps {
  sessionInfo: LiveSessionInfo | null;
  onStart: (mode: string, durationMin: number) => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onEnd: () => Promise<void>;
  disabled?: boolean;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  sessionInfo,
  onStart,
  onPause,
  onResume,
  onEnd,
  disabled = false,
}) => {
  const [selectedMode, setSelectedMode] = useState<string>('Coding');
  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isRunning = sessionInfo?.status === 'running';
  const isPaused = sessionInfo?.status === 'paused';
  const hasActiveSession = isRunning || isPaused;

  const elapsedSec = sessionInfo?.elapsed_sec || 0;
  const remainingSec = sessionInfo?.remaining_sec ?? Math.max(0, selectedDuration * 60 - elapsedSec);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      await onStart(selectedMode, selectedDuration);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modes = [
    { id: 'Coding', label: 'Coding', desc: 'Tolerates brief glances to notes' },
    { id: 'Study', label: 'Study', desc: 'Balanced focus sensitivity' },
    { id: 'Reading', label: 'Reading', desc: 'Tolerates downward gaze' },
    { id: 'Meeting', label: 'Meeting', desc: 'Focus on face presence' },
  ];

  const durationOptions = [15, 25, 45, 60, 90];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
      {/* Session Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-indigo-400" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
            Focus Session
          </h3>
        </div>
        {hasActiveSession && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
            {sessionInfo.mode} Mode
          </span>
        )}
      </div>

      {/* Timer Main Area */}
      <div className="py-6 flex flex-col items-center justify-center">
        <div className="text-6xl font-black font-mono tracking-tight text-white mb-2">
          {formatTime(hasActiveSession ? remainingSec : selectedDuration * 60)}
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Elapsed: {formatTime(elapsedSec)}</span>
          <span>•</span>
          <span>
            {hasActiveSession
              ? isRunning
                ? 'Session Active'
                : 'Session Paused'
              : 'Planned Session'}
          </span>
        </div>

        {/* Progress Bar */}
        {hasActiveSession && (
          <div className="w-full max-w-xs mt-4 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isPaused ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (elapsedSec / (selectedDuration * 60 || 1500)) * 100
                )}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Mode & Duration Config when idle */}
      {!hasActiveSession ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-2">Select Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={`p-2.5 rounded-xl text-left border transition text-xs ${
                    selectedMode === m.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200">{m.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-2">Duration (minutes)</label>
            <div className="flex gap-2">
              {durationOptions.map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSelectedDuration(mins)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selectedDuration === mins
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={disabled || isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <Play size={16} />
            <span>Start Focus Session</span>
          </button>
        </div>
      ) : (
        /* Action Controls when session active */
        <div className="flex gap-3 mt-2">
          {isRunning ? (
            <button
              onClick={onPause}
              disabled={disabled}
              className="flex-1 py-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <Pause size={16} />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onResume}
              disabled={disabled}
              className="flex-1 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <Play size={16} />
              <span>Resume</span>
            </button>
          )}

          <button
            onClick={onEnd}
            disabled={disabled}
            className="flex-1 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            <Square size={16} />
            <span>End Session</span>
          </button>
        </div>
      )}
    </div>
  );
};
