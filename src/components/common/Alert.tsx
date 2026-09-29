import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const configs = {
    info: {
      bg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
      iconColor: 'text-blue-600 dark:text-blue-400',
      textColor: 'text-slate-700 dark:text-slate-300',
      Icon: Info,
    },
    success: {
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      textColor: 'text-slate-700 dark:text-slate-300',
      Icon: CheckCircle2,
    },
    warning: {
      bg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
      iconColor: 'text-amber-600 dark:text-amber-400',
      textColor: 'text-slate-700 dark:text-slate-300',
      Icon: AlertTriangle,
    },
    error: {
      bg: 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-slate-700 dark:text-slate-300',
      Icon: AlertCircle,
    },
  };

  const { bg, iconColor, textColor, Icon } = configs[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${bg} ${className}`} role="alert">
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 text-sm leading-relaxed">
        {title && <h5 className="font-bold mb-1 text-inherit">{title}</h5>}
        <div className={textColor}>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
