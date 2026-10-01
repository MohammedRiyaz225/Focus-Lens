import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

interface PrivacyBannerProps {
  cameraActive: boolean;
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ cameraActive }) => {
  const [hasConsented, setHasConsented] = useState<boolean>(true);

  useEffect(() => {
    const consent = localStorage.getItem('focuslens_consent_given');
    if (!consent) {
      setHasConsented(false);
    }
  }, []);

  const handleGrantConsent = () => {
    localStorage.setItem('focuslens_consent_given', 'true');
    setHasConsented(true);
  };

  return (
    <>
      {/* Active Camera Indicator Pill */}
      {cameraActive && (
        <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg animate-pulse-subtle">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="flex items-center gap-1">
            <Lock size={12} />
            Camera Active • In-Memory Processing Only
          </span>
        </div>
      )}

      {/* First-Run Privacy Consent Modal */}
      {!hasConsented && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-7 border border-slate-700 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">FocusLens Privacy & Consent</h2>
                <p className="text-xs text-slate-400">Your camera and video stay 100% on your device.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-start gap-2">
                <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Video Persistence:</strong> Raw webcam frames are processed strictly in RAM and are NEVER saved to disk, database, or network.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Derived Metrics Only:</strong> Only numerical attention scores, head angles, and session durations are stored locally in SQLite.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Honesty Limitation:</strong> FocusLens estimates <em>visual engagement</em> (head pose, eye gaze, stability). It cannot know true neurological concentration. Lighting, glasses, and multi-monitor setups may influence readings.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleGrantConsent}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/30"
              >
                I Understand & Agree to Start
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
