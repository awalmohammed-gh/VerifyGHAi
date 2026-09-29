import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badgeText?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger';
  icon?: LucideIcon;
  colorTheme?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  className?: string;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  title,
  value,
  subtitle,
  badgeText,
  badgeVariant = 'default',
  icon: Icon,
  colorTheme = 'slate',
  className = '',
}) => {
  const themeMap = {
    slate: 'border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900',
    blue: 'border-blue-200/90 dark:border-blue-800/80 text-blue-900 dark:text-blue-300 bg-blue-50/20 dark:bg-blue-950/20',
    emerald: 'border-emerald-200/90 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/20',
    amber: 'border-amber-200/90 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/20',
    rose: 'border-rose-200/90 dark:border-rose-800/80 text-rose-900 dark:text-rose-300 bg-rose-50/20 dark:bg-rose-950/20',
  };

  const iconBgMap = {
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    blue: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-2xs flex flex-col justify-between ${themeMap[colorTheme]} ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconBgMap[colorTheme]}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-black tracking-tight">{value}</span>
        {badgeText && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              badgeVariant === 'danger'
                ? 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                : badgeVariant === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : badgeVariant === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">{subtitle}</p>}
    </div>
  );
};
