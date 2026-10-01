import React, { useState } from 'react';
import { api } from '../lib/api';
import { LiveStreamPacket } from '../lib/types';
import { Crosshair, Check, Sparkles, AlertCircle, X } from 'lucide-react';

interface CalibrationWizardProps {
  packet: LiveStreamPacket | null;
  onClose: () => void;
  onCompleted?: () => void;
}

export const CalibrationWizard: React.FC<CalibrationWizardProps> = ({
  packet,
  onClose,
  onCompleted,
}) => {
  const [step, setStep] = useState<number>(0);
  const [calibrationData, setCalibrationData] = useState({
    neutral_yaw: 0.0,
    neutral_pitch: 0.0,
    center_gaze_x: 0.5,
    center_gaze_y: 0.5,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const steps = [
    {
      title: 'Neutral Center Position',
      instruction: 'Look straight ahead at the center of your screen in your normal working posture.',
      targetPos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    },
    {
      title: 'Top Left Corner',
      instruction: 'Glance naturally at the top-left corner of your monitor.',
      targetPos: 'top-8 left-8',
    },
    {
      title: 'Top Right Corner',
      instruction: 'Glance naturally at the top-right corner of your monitor.',
      targetPos: 'top-8 right-8',
    },
    {
      title: 'Bottom Left Corner',
      instruction: 'Glance naturally at the bottom-left corner of your monitor.',
      targetPos: 'bottom-8 left-8',
    },
    {
      title: 'Bottom Right Corner',
      instruction: 'Glance naturally at the bottom-right corner of your monitor.',
      targetPos: 'bottom-8 right-8',
    },
  ];

  const handleCaptureStep = () => {
    if (step === 0 && packet) {
      setCalibrationData((prev) => ({
        ...prev,
        neutral_yaw: packet.head.yaw,
        neutral_pitch: packet.head.pitch,
        center_gaze_x: packet.gaze.x,
        center_gaze_y: packet.gaze.y,
      }));
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = async () => {
    setIsSaving(true);
    try {
      await api.saveCalibration(calibrationData);
      setSuccessMsg('Calibration saved! Your neutral angles and gaze bounds are now applied.');
      setTimeout(() => {
        onCompleted?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(`Calibration failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4 animate-fade-in">
      {/* Target Marker moving around screen */}
      <div className={`fixed ${current.targetPos} transition-all duration-700 pointer-events-none z-50`}>
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-400 animate-ping opacity-75 absolute" />
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-sm shadow-lg shadow-emerald-500/50">
            <Crosshair size={22} className="animate-spin" />
          </div>
        </div>
      </div>

      {/* Main Control Card */}
      <div className="glass-panel max-w-lg w-full rounded-3xl p-7 border border-slate-700 shadow-2xl relative z-40 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-400" />
            <h3 className="text-base font-bold text-white">Posture & Gaze Calibration</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i === step ? 'bg-emerald-400' : i < step ? 'bg-emerald-700' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-200">{current.title}</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{current.instruction}</p>
        </div>

        {/* Live Feedback */}
        <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Face Detected:</span>
            <strong className={packet?.face_detected ? 'text-emerald-400' : 'text-rose-400'}>
              {packet?.face_detected ? 'Yes' : 'No (check lighting/camera)'}
            </strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Current Yaw / Pitch:</span>
            <span className="font-mono text-slate-200">
              {packet?.head.yaw.toFixed(1)}° / {packet?.head.pitch.toFixed(1)}°
            </span>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs flex items-center gap-2">
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCaptureStep}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-600/30"
          >
            {step === steps.length - 1 ? 'Complete & Save' : 'Next Point'}
          </button>
        </div>
      </div>
    </div>
  );
};
