import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { ShieldCheck, Trash2, Lock, HardDrive, Cpu, AlertTriangle, CheckCircle } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  const { deleteAllData } = useSettings();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deletedMsg, setDeletedMsg] = useState<string | null>(null);

  const handleDeleteAll = async () => {
    if (
      window.confirm(
        'Are you sure you want to permanently erase all focus sessions, event logs, and calibration data from your device?'
      )
    ) {
      setIsDeleting(true);
      try {
        const res = await deleteAllData();
        setDeletedMsg(res.message);
      } catch (e: any) {
        alert(`Failed to delete data: ${e.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
        <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Privacy Architecture & Data Control</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Privacy-first design is the core foundation of FocusLens, not an afterthought.
          </p>
        </div>
      </div>

      {deletedMsg && (
        <div className="p-4 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle size={18} />
          <span>{deletedMsg}</span>
        </div>
      )}

      {/* 3 Core Privacy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <Cpu className="text-emerald-400" size={24} />
          <h3 className="text-sm font-bold text-white">RAM-Only Video Ingestion</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Webcam frames exist exclusively in volatile system RAM for 1/15th of a second during landmark extraction. Raw frames are immediately discarded.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <Lock className="text-indigo-400" size={24} />
          <h3 className="text-sm font-bold text-white">Zero Cloud Transmissions</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            100% of face mesh and gaze computation runs locally on your CPU. No frames or biometric data ever leave your localhost machine.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <HardDrive className="text-amber-400" size={24} />
          <h3 className="text-sm font-bold text-white">Minimal Derived Telemetry</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Only aggregated numerical scores (e.g. 0.85 attention, 12.0° yaw) are saved to your local SQLite database for personal analytics.
          </p>
        </div>
      </div>

      {/* Scientific Limitation Disclosure */}
      <div className="glass-panel rounded-3xl p-6 border border-amber-500/40 bg-amber-950/20 space-y-2">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle size={20} />
          <h3 className="text-sm font-bold uppercase tracking-wider">Scientific Honesty Limitation</h3>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          FocusLens estimates <strong>visual engagement</strong> based on head orientation, eye gaze coordinates, and posture stability. It does not measure neurological concentration, cognitive depth, or mental comprehension. Environmental factors such as lighting variations, eyeglasses, external webcam placement, and multi-monitor setups can affect telemetry readings.
        </p>
      </div>

      {/* Wipe All Data Section */}
      <div className="glass-panel rounded-3xl p-6 border border-rose-500/30 bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Trash2 size={18} className="text-rose-400" />
            <span>Permanent Data Erasure</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Wipe all stored focus sessions, attention event timelines, and calibration records from your local database immediately.
          </p>
        </div>

        <button
          onClick={handleDeleteAll}
          disabled={isDeleting}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-lg shadow-rose-600/30 shrink-0"
        >
          {isDeleting ? 'Erasing...' : 'Delete All My Data'}
        </button>
      </div>
    </div>
  );
};
