import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { Settings, Sliders, Bell, Eye, Database, Save, CheckCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, isLoading, isSaving, message, updateSettings } = useSettings();

  const [formWeights, setFormWeights] = useState({
    weight_face: 0.25,
    weight_head: 0.30,
    weight_eyes: 0.30,
    weight_stability: 0.15,
  });

  const [formThresholds, setFormThresholds] = useState({
    threshold_away: 0.30,
    threshold_distracted: 0.55,
    threshold_engaged: 0.75,
    threshold_highly_engaged: 1.00,
  });

  const [formFps, setFormFps] = useState<number>(15);
  const [formSimulate, setFormSimulate] = useState<boolean>(false);
  const [formPreview, setFormPreview] = useState<boolean>(false);
  const [formRetention, setFormRetention] = useState<number>(30);

  useEffect(() => {
    if (settings) {
      setFormWeights(settings.weights);
      setFormThresholds(settings.thresholds);
      setFormFps(settings.target_fps);
      setFormSimulate(settings.simulate);
      setFormPreview(settings.preview_enabled);
      setFormRetention(settings.retention_days);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      weights: formWeights,
      thresholds: formThresholds,
      target_fps: formFps,
      simulate: formSimulate,
      preview_enabled: formPreview,
      retention_days: formRetention,
    });
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Loading configuration...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Settings size={24} className="text-indigo-400" />
            <span>FocusLens Engine Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure attention scoring weights, state thresholds, alert timings, and camera settings.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          <Save size={15} />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle size={16} />
          <span>{message}</span>
        </div>
      )}

      {/* Attention Score Signal Weights */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders size={18} className="text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Attention Signal Weights
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Face Presence Weight</span>
              <span className="text-slate-400 font-mono">{(formWeights.weight_face * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.05"
              value={formWeights.weight_face}
              onChange={(e) => setFormWeights({ ...formWeights, weight_face: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Head Pose Facing Weight</span>
              <span className="text-slate-400 font-mono">{(formWeights.weight_head * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.05"
              value={formWeights.weight_head}
              onChange={(e) => setFormWeights({ ...formWeights, weight_head: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Eye Gaze Direction Weight</span>
              <span className="text-slate-400 font-mono">{(formWeights.weight_eyes * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.05"
              value={formWeights.weight_eyes}
              onChange={(e) => setFormWeights({ ...formWeights, weight_eyes: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Pose Stability Weight</span>
              <span className="text-slate-400 font-mono">{(formWeights.weight_stability * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.4"
              step="0.05"
              value={formWeights.weight_stability}
              onChange={(e) => setFormWeights({ ...formWeights, weight_stability: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* State Machine Boundaries */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Eye size={18} className="text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            State Classifier Thresholds
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-rose-400 font-medium">Away Threshold</span>
              <span className="text-slate-400 font-mono">≤ {(formThresholds.threshold_away * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.45"
              step="0.05"
              value={formThresholds.threshold_away}
              onChange={(e) => setFormThresholds({ ...formThresholds, threshold_away: parseFloat(e.target.value) })}
              className="w-full accent-rose-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-amber-400 font-medium">Glance / Distracted</span>
              <span className="text-slate-400 font-mono">≤ {(formThresholds.threshold_distracted * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.40"
              max="0.65"
              step="0.05"
              value={formThresholds.threshold_distracted}
              onChange={(e) => setFormThresholds({ ...formThresholds, threshold_distracted: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-emerald-400 font-medium">Engaged Threshold</span>
              <span className="text-slate-400 font-mono">≤ {(formThresholds.threshold_engaged * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.60"
              max="0.85"
              step="0.05"
              value={formThresholds.threshold_engaged}
              onChange={(e) => setFormThresholds({ ...formThresholds, threshold_engaged: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Vision, Capture & Simulation */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Database size={18} className="text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Vision & System Performance
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Camera Target Frame Rate</span>
              <span className="text-slate-400 font-mono">{formFps} FPS</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={formFps}
              onChange={(e) => setFormFps(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formSimulate}
                onChange={(e) => setFormSimulate(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-300">
                <strong>Simulation Mode:</strong> Generate synthetic attention telemetry (no camera needed).
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formPreview}
                onChange={(e) => setFormPreview(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-300">
                <strong>Enable Local Preview:</strong> Stream downscaled frame to localhost UI.
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
