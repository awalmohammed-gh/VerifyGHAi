import React from 'react';
import { Globe, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SourceCredibility } from '../../types';
import { ClassificationBadge } from './ClassificationBadge';
import { SourceFolderBadge } from '../common/SourceFolderBadge';

export interface SourceCardProps {
  source: SourceCredibility;
  className?: string;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, className = '' }) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{source.name}</h4>
              <SourceFolderBadge domain={source.domain} sourceName={source.name} size="xs" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
              {source.domain}
            </span>
          </div>
        </div>
        <ClassificationBadge sourceStatus={source.status} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/60">
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Source Credibility</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-slate-800 dark:text-slate-100">{source.credibilityScore}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">/100</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/60">
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Misinformation Flags</span>
          <div className="flex items-center gap-1.5">
            {source.previousMisinformationCount > 0 ? (
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                {source.previousMisinformationCount} records
              </span>
            ) : (
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                0 flags
              </span>
            )}
          </div>
        </div>
      </div>

      {source.description && (
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
          {source.description}
        </p>
      )}
    </div>
  );
};
