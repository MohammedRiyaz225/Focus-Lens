import React from 'react';
import { AlertData } from '../lib/types';
import { AlertTriangle, Info, Coffee, X } from 'lucide-react';

interface ToastProps {
  alert: AlertData | null;
  onDismiss: () => void;
  onActionClick: (actionType: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ alert, onDismiss, onActionClick }) => {
  if (!alert) return null;

  const isLevel4 = alert.level === 4;
  const isBreak = alert.type === 'break_suggestion';
  const isPassive = alert.type === 'passive';

  const icons = {
    passive: Info,
    notification: AlertTriangle,
    suggestion: AlertTriangle,
    break_suggestion: Coffee,
  };

  const IconComponent = icons[alert.type] || Info;

  const borderColors = {
    passive: 'border-amber-500/40 bg-slate-900/95',
    notification: 'border-rose-500/50 bg-slate-900/95',
    suggestion: 'border-indigo-500/50 bg-slate-900/95',
    break_suggestion: 'border-emerald-500/50 bg-slate-900/95',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-fade-in">
      <div
        className={`rounded-2xl p-4 shadow-2xl border backdrop-blur-xl ${
          borderColors[alert.type] || borderColors.notification
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              isBreak
                ? 'bg-emerald-500/20 text-emerald-400'
                : isLevel4
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            <IconComponent size={20} />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {isBreak
                  ? 'Smart Break Suggestion'
                  : isLevel4
                  ? 'Adaptive Focus Insight'
                  : isPassive
                  ? 'Attention Notice'
                  : 'Visual Engagement Alert'}
              </span>
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-sm text-slate-200 mt-1 leading-snug">{alert.message}</p>

            {/* Action Buttons */}
            {alert.actions && alert.actions.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
                {alert.actions.map((act) => (
                  <button
                    key={act.id}
                    onClick={() => {
                      onActionClick(act.action_type);
                      onDismiss();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      act.action_type === 'pause'
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
