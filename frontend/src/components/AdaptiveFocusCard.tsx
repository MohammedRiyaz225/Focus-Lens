import React, { useState } from 'react';
import { LiveStreamPacket } from '../lib/types';
import {
  CheckCircle,
  TrendingDown,
  Timer,
  Maximize2,
  RefreshCw,
  Check,
} from 'lucide-react';
import { AdaptiveBreakModal } from './AdaptiveBreakModal';

interface AdaptiveFocusCardProps {
  packet?: LiveStreamPacket | null;
  mode?: 'live' | 'preset-high' | 'preset-low';
  title?: string;
  onTakeBreak?: () => void;
  className?: string;
  allowToggleMode?: boolean;
}

export const AdaptiveFocusCard: React.FC<AdaptiveFocusCardProps> = ({
  packet,
  mode: initialMode = 'live',
  title = 'FocusLens',
  onTakeBreak,
  className = '',
  allowToggleMode = false,
}) => {
  const [activePreset, setActivePreset] = useState<'live' | 'preset-high' | 'preset-low'>(initialMode);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);

  // Compute effective state based on active preset or live packet
  const isHighPreset = activePreset === 'preset-high';
  const isLowPreset = activePreset === 'preset-low';
  const isLive = activePreset === 'live';

  let attentionScore = 82;
  let focusLevel: 'HIGH' | 'LOW' | 'MED' = 'HIGH';
  let sessionMinutes = 42;
  let isLookingAtScreen = true;
  let isFaceDetected = true;
  let isStableAttention = true;
  let lookawayCount = 0;
  let showBreakAlert = false;
  let previewImage = '/assets/focused_person.jpg';

  if (isHighPreset) {
    attentionScore = 82;
    focusLevel = 'HIGH';
    sessionMinutes = 42;
    isLookingAtScreen = true;
    isFaceDetected = true;
    isStableAttention = true;
    showBreakAlert = false;
    previewImage = '/assets/focused_person.jpg';
  } else if (isLowPreset) {
    attentionScore = 34;
    focusLevel = 'LOW';
    sessionMinutes = 46;
    isLookingAtScreen = false;
    isFaceDetected = true;
    isStableAttention = false;
    lookawayCount = 5;
    showBreakAlert = true;
    previewImage = '/assets/distracted_person.jpg';
  } else if (isLive && packet) {
    attentionScore = Math.round(packet.attention_score * 100);
    isFaceDetected = Boolean(packet.face_detected);
    isLookingAtScreen = isFaceDetected && Math.abs(packet.head?.yaw || 0) < 18;
    isStableAttention = (packet.stability || 0) > 0.65;
    sessionMinutes = Math.max(1, Math.round((packet.session?.elapsed_sec || 0) / 60));

    if (attentionScore >= 70) {
      focusLevel = 'HIGH';
      showBreakAlert = false;
    } else if (attentionScore >= 45) {
      focusLevel = 'MED';
      showBreakAlert = false;
    } else {
      focusLevel = 'LOW';
      showBreakAlert = true;
      lookawayCount = 4;
    }

    if (packet.preview_frame) {
      previewImage = `data:image/jpeg;base64,${packet.preview_frame}`;
    } else {
      previewImage = attentionScore >= 50 ? '/assets/focused_person.jpg' : '/assets/distracted_person.jpg';
    }
  }

  // Ring gauge calculation
  const radius = 28;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attentionScore / 100) * circumference;

  const ringColor =
    focusLevel === 'HIGH'
      ? '#22c55e' // emerald / green
      : focusLevel === 'MED'
      ? '#eab308' // yellow
      : '#f59e0b'; // amber / orange

  const handleBreakClick = () => {
    setIsBreakModalOpen(true);
    if (onTakeBreak) onTakeBreak();
  };

  return (
    <div
      className={`bg-[#0d1527] text-white rounded-2xl p-4 sm:p-5 border border-[#1e293b] shadow-2xl relative flex flex-col justify-between overflow-hidden select-none ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="font-bold text-sm tracking-tight text-white">{title}</span>
        </div>

        {allowToggleMode && (
          <div className="flex items-center gap-1 bg-[#162238] p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActivePreset('live')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                isLive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setActivePreset('preset-high')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                isHighPreset ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              82% High
            </button>
            <button
              onClick={() => setActivePreset('preset-low')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                isLowPreset ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              34% Low
            </button>
          </div>
        )}
      </div>

      {/* Main Dual Grid: Left Video Feed HUD + Right Attention Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
        {/* Left Side: Video Preview with AI Bounding Box */}
        <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black border border-slate-700/80 shadow-inner group">
          <img
            src={previewImage}
            alt="Webcam AI tracking view"
            className="w-full h-full object-cover"
          />

          {/* AI Face Bounding Box Overlay */}
          <div
            className={`absolute transition-all duration-300 pointer-events-none ${
              focusLevel === 'HIGH'
                ? 'top-[16%] bottom-[14%] left-[24%] right-[24%] border-2 border-emerald-400/90 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                : 'top-[14%] bottom-[16%] left-[32%] right-[16%] border-2 border-amber-400/90 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
            }`}
          >
            {/* Corner reticle brackets */}
            <div
              className={`absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 ${
                focusLevel === 'HIGH' ? 'border-emerald-300' : 'border-amber-300'
              }`}
            />
            <div
              className={`absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 ${
                focusLevel === 'HIGH' ? 'border-emerald-300' : 'border-amber-300'
              }`}
            />
            <div
              className={`absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 ${
                focusLevel === 'HIGH' ? 'border-emerald-300' : 'border-amber-300'
              }`}
            />
            <div
              className={`absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 ${
                focusLevel === 'HIGH' ? 'border-emerald-300' : 'border-amber-300'
              }`}
            />

            {/* Eye crosshair lines (Green for focused, shifted for looking away) */}
            {focusLevel === 'HIGH' ? (
              <div className="absolute top-[32%] left-[22%] right-[22%] flex justify-between px-1">
                <div className="w-3 h-3 rounded-full border border-emerald-400/80 flex items-center justify-center">
                  <div className="w-1 h-1 bg-emerald-300 rounded-full animate-ping" />
                </div>
                <div className="w-3 h-3 rounded-full border border-emerald-400/80 flex items-center justify-center">
                  <div className="w-1 h-1 bg-emerald-300 rounded-full animate-ping" />
                </div>
              </div>
            ) : (
              <div className="absolute top-[32%] right-[18%] flex gap-4">
                <div className="w-3 h-3 rounded-full border border-amber-400/80 flex items-center justify-center">
                  <div className="w-1 h-1 bg-amber-300 rounded-full" />
                </div>
              </div>
            )}
          </div>

          {/* Top-left HUD status pill */}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{focusLevel === 'HIGH' ? 'GAZE: SCREEN' : 'GAZE: AWAY'}</span>
          </div>

          {/* Bottom HUD icons */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-slate-300 text-[10px]">
            <span className="p-1 rounded bg-black/50 backdrop-blur-sm hover:text-white cursor-pointer">
              <RefreshCw size={11} />
            </span>
          </div>
          <div className="absolute bottom-2 right-2 text-slate-300 text-[10px]">
            <span className="p-1 rounded bg-black/50 backdrop-blur-sm hover:text-white cursor-pointer">
              <Maximize2 size={11} />
            </span>
          </div>
        </div>

        {/* Right Side: Circular Attention Meter + Focus Level + Session Time */}
        <div className="flex flex-col justify-center space-y-3">
          {/* Circular Attention Ring */}
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="#1e293b"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke={ringColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Attention</div>
              <div className="text-xl font-black text-white font-mono leading-none">
                {attentionScore}%
              </div>
            </div>
          </div>

          {/* Focus Level Card */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                focusLevel === 'HIGH'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {focusLevel === 'HIGH' ? (
                <CheckCircle size={18} className="text-emerald-400" />
              ) : (
                <TrendingDown size={18} className="text-amber-400" />
              )}
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Focus</div>
              <div
                className={`text-sm font-extrabold tracking-wide ${
                  focusLevel === 'HIGH' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {focusLevel}
              </div>
            </div>
          </div>

          {/* Session Duration Card */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 shadow-md">
              <Timer size={18} />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Session</div>
              <div className="text-sm font-bold text-white font-mono">{sessionMinutes} min</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Status checklist OR Distraction break prompt */}
      <div className="mt-4 pt-3 border-t border-[#1e293b]">
        {!showBreakAlert ? (
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition ${
                isLookingAtScreen
                  ? 'bg-slate-900/90 border border-emerald-500/30 text-slate-200'
                  : 'bg-amber-950/40 border border-amber-500/30 text-amber-200'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                  isLookingAtScreen ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              >
                <Check size={9} className="text-black stroke-[3]" />
              </div>
              <span className="font-medium">
                {isLookingAtScreen ? 'Looking at screen' : 'Looking away'}
              </span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition ${
                isFaceDetected
                  ? 'bg-slate-900/90 border border-emerald-500/30 text-slate-200'
                  : 'bg-rose-950/40 border border-rose-500/30 text-rose-200'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                  isFaceDetected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              >
                <Check size={9} className="text-black stroke-[3]" />
              </div>
              <span className="font-medium">
                {isFaceDetected ? 'Face detected' : 'No face detected'}
              </span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition ${
                isStableAttention
                  ? 'bg-slate-900/90 border border-emerald-500/30 text-slate-200'
                  : 'bg-amber-950/40 border border-amber-500/30 text-amber-200'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                  isStableAttention ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              >
                <Check size={9} className="text-black stroke-[3]" />
              </div>
              <span className="font-medium">
                {isStableAttention ? 'Stable attention' : 'Attention fluctuating'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5">
            <div className="text-xs text-amber-200">
              <span className="font-semibold">
                You've looked away {lookawayCount || 5} times.
              </span>{' '}
              <span className="text-slate-300">Take a 2-minute break?</span>
            </div>

            <button
              onClick={handleBreakClick}
              className="px-4 py-1.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition transform active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Take Break</span>
            </button>
          </div>
        )}
      </div>

      {/* Break Recovery Modal */}
      <AdaptiveBreakModal
        isOpen={isBreakModalOpen}
        onClose={() => setIsBreakModalOpen(false)}
        breakDurationSec={120}
      />
    </div>
  );
};
