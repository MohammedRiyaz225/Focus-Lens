import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

interface AdaptiveBreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakDurationSec?: number;
}

export const AdaptiveBreakModal: React.FC<AdaptiveBreakModalProps> = ({
  isOpen,
  onClose,
  breakDurationSec = 120,
}) => {
  const [timeLeft, setTimeLeft] = useState(breakDurationSec);
  const [isCompleted, setIsCompleted] = useState(false);
  const [phase, setPhase] = useState<'breathe' | 'lookAway' | 'stretch'>('lookAway');

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(breakDurationSec);
      setIsCompleted(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCompleted(true);
          return 0;
        }
        // Change phases every 40 seconds
        if (prev > 80) setPhase('lookAway');
        else if (prev > 40) setPhase('breathe');
        else setPhase('stretch');
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, breakDurationSec]);

  if (!isOpen) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = ((breakDurationSec - timeLeft) / breakDurationSec) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition p-1.5 rounded-full hover:bg-slate-800"
          aria-label="Close break modal"
        >
          <X size={18} />
        </button>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 text-xs font-semibold">
            <Sparkles size={14} className="text-indigo-400" />
            <span>Adaptive Focus Recovery</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            {isCompleted ? 'Break Complete!' : '2-Minute Adaptive Eye Break'}
          </h2>

          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            {phase === 'lookAway' &&
              'Look at an object 20 feet away to relax your ciliary eye muscles (20-20-20 rule).'}
            {phase === 'breathe' &&
              'Take slow, deep breaths in through your nose and out through your mouth.'}
            {phase === 'stretch' &&
              'Gently roll your shoulders and blink your eyes to rehydrate your cornea.'}
          </p>

          {/* Circular Countdown Progress Ring */}
          <div className="relative w-44 h-44 mx-auto my-6 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="74"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="88"
                cy="88"
                r="74"
                stroke="url(#breakGradient)"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 74}
                strokeDashoffset={2 * Math.PI * 74 * (1 - progress / 100)}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black font-mono text-white tracking-tight">
                {mins}:{secs.toString().padStart(2, '0')}
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-1">
                {isCompleted ? 'Ready to resume' : 'Remaining'}
              </span>
            </div>
          </div>

          {/* Interactive Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>{isCompleted ? 'Resume Focus Session' : 'I am refreshed, resume now'}</span>
            </button>

            <button
              onClick={() => {
                setTimeLeft(breakDurationSec);
                setIsCompleted(false);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Reset 2m</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
