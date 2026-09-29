import React, { useEffect, useState } from 'react';
import { Loader2, Shield, Lock, CheckCircle2 } from 'lucide-react';

export interface AuthProgressIndicatorProps {
  isLoading: boolean;
  steps?: string[];
  currentStepIndex?: number;
  variant?: 'default' | 'admin' | 'success';
  className?: string;
}

export const AuthProgressIndicator: React.FC<AuthProgressIndicatorProps> = ({
  isLoading,
  steps = ['Validating request...', 'Authenticating credentials...', 'Finalizing secure session...'],
  currentStepIndex,
  variant = 'default',
  className = '',
}) => {
  const [internalStep, setInternalStep] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setInternalStep(0);
      return;
    }

    if (currentStepIndex !== undefined) {
      setInternalStep(currentStepIndex);
      return;
    }

    // Automatically transition through progress steps during network wait
    const interval = setInterval(() => {
      setInternalStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);

    return () => clearInterval(interval);
  }, [isLoading, currentStepIndex, steps.length]);

  if (!isLoading) return null;

  const currentText = steps[Math.min(internalStep, steps.length - 1)] || 'Processing...';

  const colorStyles = {
    default: {
      bar: 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600',
      badge: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: 'text-blue-600',
    },
    admin: {
      bar: 'bg-gradient-to-r from-slate-900 via-blue-700 to-slate-900',
      badge: 'bg-slate-900 text-slate-100 border-slate-700',
      icon: 'text-blue-400',
    },
    success: {
      bar: 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: 'text-emerald-600',
    },
  };

  const style = colorStyles[variant];

  return (
    <div className={`space-y-2.5 overflow-hidden transition-all duration-300 ${className}`}>
      {/* Top indeterminate animated progress bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`absolute inset-y-0 h-full w-2/3 rounded-full animate-[shimmer_1.5s_infinite_linear] ${style.bar}`}
          style={{
            backgroundImage:
              variant === 'admin'
                ? 'linear-gradient(90deg, #0f172a 0%, #2563eb 50%, #0f172a 100%)'
                : 'linear-gradient(90deg, #2563eb 0%, #6366f1 50%, #2563eb 100%)',
            backgroundSize: '200% 100%',
            animation: 'pulse 1.2s ease-in-out infinite, indeterminate 1.6s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite',
          }}
        />
      </div>

      {/* Progress status badge */}
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium ${style.badge} animate-fadeIn`}
      >
        <div className="flex items-center gap-2">
          <Loader2 className={`w-3.5 h-3.5 animate-spin ${style.icon}`} />
          <span className="tracking-tight">{currentText}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] opacity-80 uppercase font-mono tracking-wider">
          <Lock className="w-3 h-3" />
          <span>Encrypted</span>
        </div>
      </div>
    </div>
  );
};
