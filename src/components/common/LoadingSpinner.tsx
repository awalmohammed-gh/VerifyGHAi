import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  sublabel?: string;
  className?: string;
  centered?: boolean;
  minHeight?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  sublabel,
  className = '',
  centered = false,
  minHeight = 'min-h-[40vh]',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 text-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <Loader2 className={`${sizeMap[size]} animate-spin text-blue-600 dark:text-blue-400`} />
      </div>
      {label && (
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          {label}
        </p>
      )}
      {sublabel && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {sublabel}
        </p>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className={`w-full ${minHeight} flex flex-col items-center justify-center`}>
        {content}
      </div>
    );
  }

  return content;
};

export const CenteredLoadingState: React.FC<{
  title?: string;
  subtitle?: string;
  badge?: string;
  minHeight?: string;
  className?: string;
}> = ({
  title = 'Loading Information...',
  subtitle = 'Fetching the latest real-time data from the verification engine.',
  badge = 'VERIFICATION ENGINE ACTIVE',
  minHeight = 'min-h-[50vh]',
  className = '',
}) => {
  return (
    <div
      className={`w-full ${minHeight} flex flex-col items-center justify-center text-center p-8 select-none ${className}`}
    >
      <div className="relative mb-4">
        {/* Ambient background glow ring */}
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-full blur-lg animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>

      {badge && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 mb-2.5">
          <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          {badge}
        </span>
      )}

      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

