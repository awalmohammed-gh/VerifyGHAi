import React from 'react';
import { Priority, AlertSeverity } from '../../types';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority | AlertSeverity;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showIcon = true,
}) => {
  const getBadgeConfig = () => {
    switch (priority) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          icon: AlertCircle,
          label: 'CRITICAL',
        };
      case 'HIGH':
        return {
          bg: 'bg-red-50 border-red-200 text-red-700',
          icon: AlertCircle,
          label: 'HIGH PRIORITY',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          icon: AlertTriangle,
          label: 'MEDIUM',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-600',
          icon: Info,
          label: 'LOW',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border ${config.bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
