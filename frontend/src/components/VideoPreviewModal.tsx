import React from 'react';
import { X, ShieldCheck, Eye, Compass } from 'lucide-react';
import { LiveStreamPacket } from '../lib/types';

interface VideoPreviewModalProps {
  packet: LiveStreamPacket | null;
  onClose: () => void;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ packet, onClose }) => {
  return (
    <div className="fixed bottom-6 left-6 z-50 animate-fade-in">
      <div className="glass-panel w-72 sm:w-80 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Local Camera Preview</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={15} />
          </button>
        </div>

        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {packet?.preview_frame ? (
            <img
              src={`data:image/jpeg;base64,${packet.preview_frame}`}
              alt="Local Camera Feed"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4 text-xs text-slate-500 space-y-1">
              <Compass size={24} className="mx-auto text-slate-600 animate-spin" />
              <p>Preview stream loading or camera running in simulation mode...</p>
            </div>
          )}

          {/* HUD Overlay */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-emerald-400 font-mono">
            {packet?.face_detected ? 'FACE LOCKED' : 'NO FACE'}
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 font-mono">
            Score: {packet ? Math.round(packet.attention_score * 100) : 0}%
          </div>
        </div>

        <div className="p-2.5 bg-slate-900/90 text-[10px] text-slate-400 flex items-center gap-1.5 border-t border-slate-800">
          <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
          <span>Streamed over localhost only. Never stored to disk.</span>
        </div>
      </div>
    </div>
  );
};
