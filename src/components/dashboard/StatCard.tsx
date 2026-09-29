import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label?: string;
  };
  icon?: LucideIcon;
  variant?: 'default' | 'verified' | 'trusted' | 'suspicious' | 'fake';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
      valColor: 'text-slate-900 dark:text-white',
    },
    verified: {
      border: 'border-emerald-200/90 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
      valColor: 'text-emerald-900 dark:text-emerald-300',
    },
    trusted: {
      border: 'border-blue-200/90 dark:border-blue-800/80 bg-blue-50/20 dark:bg-blue-950/20',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
      valColor: 'text-blue-900 dark:text-blue-300',
    },
    suspicious: {
      border: 'border-amber-200/90 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
      valColor: 'text-amber-900 dark:text-amber-300',
    },
    fake: {
      border: 'border-red-200/90 dark:border-red-800/80 bg-red-50/20 dark:bg-red-950/20',
      iconBg: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800',
      valColor: 'text-red-900 dark:text-red-300',
    },
  };

  const current = variantStyles[variant];

  return (
    <div
      className={`rounded-2xl border p-5 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between ${current.border} ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${current.iconBg}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-2xl sm:text-3xl font-black tracking-tight ${current.valColor}`}>
          {value}
        </span>

        {trend && (
          <span
            className={`text-xs font-bold flex items-center gap-0.5 ${
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">{subtitle}</p>}
    </div>
  );
};
