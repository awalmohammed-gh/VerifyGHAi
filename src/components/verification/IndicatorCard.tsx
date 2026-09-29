import React from 'react';
import { Activity, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { Indicator } from '../../types';
import { Badge } from '../common/Badge';

export interface IndicatorCardProps {
  indicators: Indicator[];
  className?: string;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({ indicators, className = '' }) => {
  return (
    <div className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Content Characteristics & Indicators</h4>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{indicators.length} analyzed</span>
      </div>

      <div className="space-y-3">
        {indicators.map((ind, idx) => {
          const indicatorName = ind.name || (ind as any).label || (ind as any).type?.replace(/_/g, ' ') || `Indicator ${idx + 1}`;
          const indicatorLevel = ind.level || (ind as any).severity || 'MEDIUM';
          const isHigh = indicatorLevel === 'HIGH' || indicatorLevel === 'CRITICAL';
          const isMedium = indicatorLevel === 'MEDIUM';

          let badgeVariant: 'danger' | 'warning' | 'success' | 'info' = 'info';
          let icon = <Info className="w-3 h-3" />;

          if (isHigh) {
            badgeVariant = indicatorName.includes('Neutral') || indicatorName.includes('Scientific') || indicatorName.includes('Verified') ? 'success' : 'danger';
            icon = badgeVariant === 'success' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />;
          } else if (isMedium) {
            badgeVariant = 'warning';
            icon = <AlertTriangle className="w-3 h-3" />;
          } else {
            badgeVariant = 'success';
            icon = <ShieldCheck className="w-3 h-3" />;
          }

          const uniqueKey = ind.id || `ind_${idx}_${indicatorName.replace(/\s+/g, '_')}`;

          return (
            <div
              key={uniqueKey}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100/90 dark:border-slate-700/70 flex flex-col gap-1.5 transition-all hover:bg-slate-100/60 dark:hover:bg-slate-800"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{indicatorName}</span>
                <Badge variant={badgeVariant} size="sm" icon={icon}>
                  {indicatorLevel} {badgeVariant === 'success' ? 'SIGNAL' : 'RISK'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ind.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
