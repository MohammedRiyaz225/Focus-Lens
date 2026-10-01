import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { FocusMode } from './pages/FocusMode';
import { HistoryPage } from './pages/History';
import { SessionDetailPage } from './pages/SessionDetail';
import { SettingsPage } from './pages/Settings';
import { PrivacyPage } from './pages/Privacy';
import { AdaptiveFocusShowcase } from './pages/AdaptiveFocusShowcase';
import { PrivacyBanner } from './components/PrivacyBanner';
import { useLiveAttention } from './hooks/useLiveAttention';
import {
  Activity,
  History as HistoryIcon,
  Settings,
  ShieldCheck,
  Sparkles,
  Eye,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'showcase' | 'focus' | 'history' | 'sessionDetail' | 'settings' | 'privacy'
  >('dashboard');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const { packet } = useLiveAttention();
  const isCameraActive = packet?.session?.status === 'running' || packet?.face_detected === true;

  const navigateToSessionDetail = (id: number) => {
    setSelectedSessionId(id);
    setActiveTab('sessionDetail');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      {activeTab !== 'focus' && (
        <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                  Focus<span className="text-emerald-400">Lens</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Privacy-First Attention
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity size={14} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            {/* Adaptive Focus Showcase Tab */}
            <button
              onClick={() => setActiveTab('showcase')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'showcase'
                  ? 'bg-gradient-to-r from-blue-900/80 to-indigo-900/80 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900'
              }`}
            >
              <Sparkles size={14} className="text-cyan-400 animate-pulse" />
              <span>Adaptive Focus</span>
              <span className="hidden md:inline text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                Feature
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <HistoryIcon size={14} />
              <span className="hidden sm:inline">History</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Settings size={14} />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'privacy'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="hidden sm:inline">Privacy</span>
            </button>
          </nav>

          {/* Active Camera Status & Focus Mode Quick Trigger */}
          <div className="flex items-center gap-2">
            <PrivacyBanner cameraActive={isCameraActive} />
          </div>
        </header>
      )}

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigateToFocusMode={() => setActiveTab('focus')}
            onNavigateToSessionDetail={navigateToSessionDetail}
            onNavigateToShowcase={() => setActiveTab('showcase')}
          />
        )}

        {activeTab === 'showcase' && (
          <AdaptiveFocusShowcase
            onStartSession={() => setActiveTab('focus')}
          />
        )}

        {activeTab === 'focus' && (
          <FocusMode
            onExit={() => setActiveTab('dashboard')}
            onSessionEnded={navigateToSessionDetail}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage onSelectSession={navigateToSessionDetail} />
        )}

        {activeTab === 'sessionDetail' && selectedSessionId && (
          <SessionDetailPage
            sessionId={selectedSessionId}
            onBack={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'settings' && <SettingsPage />}

        {activeTab === 'privacy' && <PrivacyPage />}
      </main>

      {/* Bottom Footer Notice */}
      {activeTab !== 'focus' && (
        <footer className="border-t border-slate-900/80 py-4 px-6 text-center text-[11px] text-slate-400">
          FocusLens • Privacy-First Visual Attention & Engagement Telemetry • Runs 100% on localhost CPU • No video ever leaves your machine
        </footer>
      )}
    </div>
  );
}

export default App;
