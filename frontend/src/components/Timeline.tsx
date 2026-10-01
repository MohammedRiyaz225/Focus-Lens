import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { AttentionEvent } from '../lib/types';

interface TimelineProps {
  events: AttentionEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return null;
  }

  const chartData = events.map((e) => ({
    time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    score: Math.round(e.score * 100),
    state: e.state,
  }));

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
          Visual Engagement Timeline
        </h3>
        <span className="text-xs text-slate-400">Score (%) vs Time</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(val: any) => [`${val}%`, 'Engagement Score']}
            />
            {/* Threshold reference lines */}
            <ReferenceLine y={75} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'High', fill: '#10b981', fontSize: 10 }} />
            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Away', fill: '#ef4444', fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#scoreGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
