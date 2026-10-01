import React, { useState } from 'react';
import { useLiveAttention } from '../hooks/useLiveAttention';
import { AdaptiveFocusCard } from '../components/AdaptiveFocusCard';
import {
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Eye,
  Play,
  Monitor,
  ShieldCheck,
} from 'lucide-react';

interface AdaptiveFocusShowcaseProps {
  onStartSession?: () => void;
}

export const AdaptiveFocusShowcase: React.FC<AdaptiveFocusShowcaseProps> = ({
  onStartSession,
}) => {
  const { packet } = useLiveAttention();
  const [selectedDemoView, setSelectedDemoView] = useState<'both' | 'live' | 'high' | 'low'>('both');

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Top Banner exactly from reference image */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#1e1b4b] border border-blue-500/30 p-6 sm:p-8 shadow-2xl text-white">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Eye size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  FocusLens <span className="font-light text-slate-300">– AI Attention & Focus Assistant</span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Concept & Product Architecture
                </span>
              </div>
              <p className="text-sm sm:text-base text-cyan-200/90 italic font-serif mt-1 font-medium">
                “Not just a timer, but a smart eye on your focus.”
              </p>
            </div>
          </div>

          {onStartSession && (
            <button
              onClick={onStartSession}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 transition transform active:scale-95 flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <Play size={16} />
              <span>Launch Live Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 4-Column Presentation Flow matching the image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Column 1: Existing (Pomodoro) */}
        <div className="lg:col-span-2.5 flex flex-col justify-between rounded-3xl p-5 sm:p-6 bg-slate-900/80 border border-slate-800 text-slate-100 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight text-white">Existing</h2>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Status Quo
              </span>
            </div>

            {/* Realistic visual: Pomodoro timer tomato + laptop illustration */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 flex items-center justify-around gap-2 shadow-inner">
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md shrink-0 border border-rose-500/30">
                <img
                  src="/assets/pomodoro.jpg"
                  alt="Pomodoro timer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="text-slate-400">
                <Monitor size={38} className="text-slate-500 group-hover:text-indigo-400 transition" />
              </div>
            </div>

            {/* Bullet points */}
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-slate-500 font-bold">•</span>
                <span>
                  <strong className="text-white">Pomodoro apps</strong> only track time.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 font-bold">•</span>
                <span>No understanding of real attention or gaze.</span>
              </li>
            </ul>
          </div>

          <div className="hidden lg:flex items-center justify-end text-slate-600 mt-4">
            <ArrowRight size={20} className="text-slate-600 group-hover:translate-x-1 transition text-indigo-400" />
          </div>
        </div>

        {/* Column 2: Gap (Warning) */}
        <div className="lg:col-span-2.5 flex flex-col justify-between rounded-3xl p-5 sm:p-6 bg-rose-950/20 border border-rose-500/30 text-rose-100 shadow-xl relative overflow-hidden group hover:border-rose-500/50 transition">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle size={16} />
              </div>
              <h2 className="text-lg font-black tracking-tight text-white">Gap</h2>
            </div>

            <div className="bg-rose-950/40 rounded-2xl p-3 border border-rose-500/20 text-xs text-rose-200">
              <span className="font-semibold block text-rose-300">The Concentration Blindspot:</span>
              Standard clocks keep ticking even when you are totally zoning out or scrolling on your phone.
            </div>

            {/* Bullet points */}
            <ul className="space-y-3 text-xs sm:text-sm text-rose-100/90 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>
                  You can be <strong className="text-white">“active”</strong> but not actually focused.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>No detection of looking away, distractions or real concentration.</span>
              </li>
            </ul>
          </div>

          <div className="hidden lg:flex items-center justify-end text-rose-500/50 mt-4">
            <ArrowRight size={20} className="text-rose-400 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Column 3: My Solution (Unique Feature) */}
        <div className="lg:col-span-3 flex flex-col justify-between rounded-3xl p-5 sm:p-6 bg-emerald-950/25 border border-emerald-500/30 text-emerald-100 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Lightbulb size={16} />
              </div>
              <h2 className="text-sm font-black tracking-tight text-emerald-300 uppercase">
                My Solution <span className="font-normal text-emerald-400/80">(Unique Feature)</span>
              </h2>
            </div>

            <div className="pt-1">
              <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Adaptive Focus
                <Sparkles size={18} className="text-emerald-400" />
              </h3>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Privacy-preserving on-device vision telemetry
              </p>
            </div>

            {/* Bullet points */}
            <ul className="space-y-3 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  Uses <strong className="text-white">webcam + AI</strong> to track gaze, face and attention.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Detects if you're looking at the screen or away.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Gives smart, adaptive breaks and suggestions.</span>
              </li>
            </ul>

            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/20 text-[11px] text-emerald-300/90 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>100% on-device CPU execution. No frames ever leave localhost.</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-end text-emerald-500/50 mt-4">
            <ArrowRight size={20} className="text-emerald-400 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Column 4: Sample UI / Image (Interactive Side-by-Side widgets) */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-3xl p-5 sm:p-6 bg-sky-950/20 border border-sky-500/30 text-white shadow-xl relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Sample UI / Image
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </h2>

              {/* View toggles */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 text-xs">
                <button
                  onClick={() => setSelectedDemoView('both')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                    selectedDemoView === 'both' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setSelectedDemoView('live')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                    selectedDemoView === 'live' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Live AI
                </button>
              </div>
            </div>

            {/* Dual Cards or Single Card based on view */}
            {selectedDemoView === 'both' ? (
              <div className="space-y-4">
                {/* High Focus Card (82%) */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>State A: Sustained High Concentration</span>
                  </div>
                  <AdaptiveFocusCard mode="preset-high" allowToggleMode={false} />
                </div>

                {/* Distracted Card (34%) with Break Prompt */}
                <div className="space-y-1 pt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>State B: Distraction Detected & Adaptive Break</span>
                  </div>
                  <AdaptiveFocusCard mode="preset-low" allowToggleMode={false} />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 px-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span>Interactive Live Stream / Simulation</span>
                </div>
                <AdaptiveFocusCard
                  packet={packet}
                  mode="live"
                  allowToggleMode={true}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-sky-900/50 flex items-center justify-between text-[11px] text-slate-400">
            <span>Click “Take Break” to test adaptive break modal</span>
            <span className="text-sky-400 font-semibold font-mono">v1.0 Ready</span>
          </div>
        </div>
      </div>

      {/* Feature Deep Dive Comparison Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Feature Comparison: Traditional Pomodoro vs. FocusLens Adaptive Focus
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Why visual engagement tracking transforms personal productivity and cognitive health.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Capability</th>
                <th className="py-3 px-4 font-semibold text-slate-400">Traditional Pomodoro</th>
                <th className="py-3 px-4 font-semibold text-emerald-400">FocusLens (Our Solution)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-3 px-4 font-medium text-white">Timer Mechanism</td>
                <td className="py-3 px-4 text-slate-400">Fixed static countdown (e.g. 25 min)</td>
                <td className="py-3 px-4 text-emerald-300 font-semibold">
                  Adaptive visual timer that reacts to engagement
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-3 px-4 font-medium text-white">Distraction Detection</td>
                <td className="py-3 px-4 text-rose-400">None (counts time while on phone)</td>
                <td className="py-3 px-4 text-emerald-300 font-semibold">
                  Real-time head pose & gaze tracking
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-3 px-4 font-medium text-white">Break Reminders</td>
                <td className="py-3 px-4 text-slate-400">Blunt loud alarm at end of clock</td>
                <td className="py-3 px-4 text-emerald-300 font-semibold">
                  Gentle 4-level progressive adaptive prompts
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-3 px-4 font-medium text-white">Privacy Guarantee</td>
                <td className="py-3 px-4 text-slate-400">N/A (simple timer)</td>
                <td className="py-3 px-4 text-emerald-300 font-semibold">
                  100% on-device processing; zero video saved
                </td>
              </tr>
              <tr className="hover:bg-slate-900/40 transition">
                <td className="py-3 px-4 font-medium text-white">Fatigue Management</td>
                <td className="py-3 px-4 text-slate-400">Forces arbitrary break even in flow state</td>
                <td className="py-3 px-4 text-emerald-300 font-semibold">
                  Detects natural fatigue patterns (5+ glances away)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
