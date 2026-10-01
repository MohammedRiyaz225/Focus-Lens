import React, { useState } from 'react';
import { AttentionEvent, AttentionState } from '../lib/types';
import { StateChip } from './StateChip';

interface HeatmapProps {
  events: AttentionEvent[];
  totalDurationSec?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ events, totalDurationSec = 0 }) => {
  const [selectedEvent, setSelectedEvent] = useState<AttentionEvent | null>(null);

  if (!events || events.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center py-10">
        <p className="text-slate-400 text-sm">No attention event telemetry recorded yet for this session.</p>
      </div>
    );
  }

  const getStateColor = (state: AttentionState) => {
    switch (state) {
      case 'highly_engaged':
        return 'bg-emerald-500 hover:bg-emerald-400';
      case 'engaged':
        return 'bg-green-500 hover:bg-green-400';
      case 'possibly_distracted':
        return 'bg-amber-500 hover:bg-amber-400';
      case 'away':
        return 'bg-rose-500 hover:bg-rose-400';
      default:
        return 'bg-slate-700';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
            Session Focus Heatmap
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any block to inspect estimated visual engagement at that interval.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Deep</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500" />
            <span>Engaged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>Glance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span>Away</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-24 sm:grid-cols-30 md:grid-cols-40 lg:grid-cols-50 gap-1 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 max-h-48 overflow-y-auto">
        {events.map((ev, index) => {
          const isSelected = selectedEvent?.id === ev.id;
          return (
            <button
              key={ev.id || index}
              onClick={() => setSelectedEvent(ev)}
              title={`${new Date(ev.timestamp).toLocaleTimeString()}: ${ev.state} (${Math.round(
                ev.score * 100
              )}%)`}
              className={`h-6 rounded-sm transition-all ${getStateColor(ev.state)} ${
                isSelected ? 'ring-2 ring-white scale-110 z-10' : 'opacity-85 hover:opacity-100'
              }`}
            />
          );
        })}
      </div>

      {/* Selected Event Detail Card */}
      {selectedEvent && (
        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <StateChip state={selectedEvent.state} size="sm" />
            <span className="text-slate-300 font-mono">
              {new Date(selectedEvent.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-slate-400">
              Score: <strong className="text-white">{Math.round(selectedEvent.score * 100)}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>
              Head: Yaw {selectedEvent.yaw.toFixed(1)}°, Pitch {selectedEvent.pitch.toFixed(1)}°
            </span>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
