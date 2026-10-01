import React from 'react';
import { AttentionState } from '../lib/types';
import { Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

interface StateChipProps {
  state: AttentionState;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StateChip: React.FC<StateChipProps> = ({ state, size = 'md', showIcon = true }) => {
  const configs = {
    highly_engaged: {
      label: 'Deep Engagement',
      bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      icon: Sparkles,
      dot: 'bg-emerald-400',
    },
    engaged: {
      label: 'Engaged',
      bg: 'bg-green-950/80 text-green-300 border-green-500/30',
      icon: Eye,
      dot: 'bg-green-400',
    },
    possibly_distracted: {
      label: 'Glancing Away',
      bg: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
      icon: AlertCircle,
      dot: 'bg-amber-400',
    },
    away: {
      label: 'Away from Screen',
      bg: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      icon: EyeOff,
      dot: 'bg-rose-400',
    },
  };

  const config = configs[state] || configs.engaged;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1 gap-2',
    lg: 'text-base px-4 py-1.5 gap-2.5 font-medium',
  };

  const iconSizes = {
    sm: 12,
    md: 15,
    lg: 18,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-md transition-all duration-300 shadow-sm ${config.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-2 h-2 rounded-full animate-pulse ${config.dot}`} />
      {showIcon && <Icon size={iconSizes[size]} className="shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
