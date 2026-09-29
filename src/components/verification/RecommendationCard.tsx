import React from 'react';
import { Compass, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { Classification } from '../../types';

export interface RecommendationCardProps {
  classification: Classification;
  recommendation: string;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  classification,
  recommendation,
  className = '',
}) => {
  const configs = {
    VERIFIED: {
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
      Icon: ShieldCheck,
      headline: 'Safe to Reference & Share Responsibly',
    },
    TRUSTED: {
      bg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100',
      iconBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
      Icon: ShieldCheck,
      headline: 'Reasonably Credible Information',
    },
    SUSPICIOUS: {
      bg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100',
      iconBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
      Icon: AlertTriangle,
      headline: 'Verify Before Sharing',
    },
    FAKE: {
      bg: 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-950 dark:text-red-100',
      iconBg: 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300',
      Icon: AlertTriangle,
      headline: 'Do Not Share — Misleading Content',
    },
  };

  const current = configs[classification] || configs.SUSPICIOUS;
  const Icon = current.Icon;

  return (
    <div className={`rounded-2xl border p-5 shadow-2xs ${current.bg} ${className}`}>
      <div className="flex items-start gap-3.5">
        <div className={`p-2 rounded-xl flex-shrink-0 ${current.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-extrabold uppercase tracking-wider text-[11px] opacity-80 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Recommendation
            </span>
          </div>
          <h5 className="text-sm font-bold mb-1.5">{current.headline}</h5>
          <p className="leading-relaxed opacity-90">{recommendation}</p>
        </div>
      </div>
    </div>
  );
};
