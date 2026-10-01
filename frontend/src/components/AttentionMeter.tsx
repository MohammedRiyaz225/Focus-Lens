import React from 'react';
import { LiveStreamPacket } from '../lib/types';
import { StateChip } from './StateChip';
import { ShieldCheck, Video, Compass, Sparkles, Activity } from 'lucide-react';

interface AttentionMeterProps {
  packet: LiveStreamPacket | null;
  isConnected: boolean;
  onTogglePreview?: () => void;
  showPreviewToggle?: boolean;
}

export const AttentionMeter: React.FC<AttentionMeterProps> = ({
  packet,
  isConnected,
  onTogglePreview,
  showPreviewToggle = true,
}) => {
  const score = packet ? Math.round(packet.attention_score * 100) : 0;
  const state = packet ? packet.state : 'away';

  // Color gradient stroke for circular meter
  const getMeterColor = () => {
    if (!packet || !packet.face_detected) return '#ef4444'; // Red
    if (score >= 76) return '#10b981'; // Emerald
    if (score >= 56) return '#22c55e'; // Green
    if (score >= 31) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-between border border-slate-800 shadow-xl">
      {/* Background glow */}
      <div
        className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none"
        style={{ background: getMeterColor() }}
      />

      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-emerald-400" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
            Visual Engagement
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {showPreviewToggle && onTogglePreview && (
            <button
              onClick={onTogglePreview}
              className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Toggle low-res local camera preview"
            >
              <Video size={13} />
              <span>Preview</span>
            </button>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Center Circular Gauge */}
      <div className="relative my-2 flex items-center justify-center">
        <svg className="w-48 h-48 transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            className="text-slate-800/80"
            fill="transparent"
          />
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke={getMeterColor()}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
            {score}%
          </span>
          <span className="text-xs text-slate-400 mt-0.5">estimated</span>
        </div>
      </div>

      {/* State Chip */}
      <div className="my-3 z-10">
        <StateChip state={state} size="md" />
      </div>

      {/* Telemetry Micro-grid */}
      <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-800/80 text-xs">
        <div className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase">Face Presence</div>
          <div
            className={`font-medium mt-0.5 ${
              packet?.face_detected ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {packet?.face_detected ? 'Detected' : 'Not Visible'}
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase">Head Orientation</div>
          <div className="text-slate-200 font-mono mt-0.5 capitalize">
            {packet?.head?.direction || 'Center'}
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase">Pose Stability</div>
          <div className="text-slate-200 font-mono mt-0.5">
            {packet ? `${Math.round(packet.stability * 100)}%` : '--'}
          </div>
        </div>
      </div>

      {/* Privacy Guarantee footer */}
      <div className="w-full mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
        <span>100% on-device vision. No video is ever saved or sent.</span>
      </div>
    </div>
  );
};
