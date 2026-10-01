import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Session } from '../lib/types';
import { SessionCard } from '../components/SessionCard';
import { History as HistoryIcon, Filter, Layers, RefreshCw } from 'lucide-react';

interface HistoryPageProps {
  onSelectSession: (sessionId: number) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSessions(50, 0, selectedMode);
      setSessions(data);
    } catch (e) {
      console.error('Failed to load session history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedMode]);

  const modes = ['All', 'Coding', 'Study', 'Reading', 'Meeting'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <HistoryIcon size={24} className="text-indigo-400" />
            <span>Session History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review past focus sessions, visual engagement trends, and distraction metrics.
          </p>
        </div>

        {/* Mode Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 self-start">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMode(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedMode === m
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <RefreshCw size={28} className="animate-spin mx-auto text-indigo-500" />
          <p className="text-xs text-slate-400 mt-2">Loading session records...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 max-w-lg mx-auto space-y-3">
          <Layers size={36} className="mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-200">No Sessions Found</h3>
          <p className="text-xs text-slate-400">
            Start a new focus session from the Dashboard to record visual engagement metrics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} onClick={onSelectSession} />
          ))}
        </div>
      )}
    </div>
  );
};
