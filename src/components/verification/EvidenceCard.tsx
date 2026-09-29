import React from 'react';
import { Database, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { EvidenceAssessment } from '../../types';
import { Badge } from '../common/Badge';

export interface EvidenceCardProps {
  evidence: EvidenceAssessment;
  className?: string;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence, className = '' }) => {
  const availabilityVariants = {
    HIGH: { variant: 'success' as const, label: 'HIGH AVAILABILITY' },
    MEDIUM: { variant: 'warning' as const, label: 'MODERATE AVAILABILITY' },
    LOW: { variant: 'warning' as const, label: 'LOW AVAILABILITY' },
    NONE: { variant: 'danger' as const, label: 'NO SUPPORTING EVIDENCE' },
  };

  const curr = availabilityVariants[evidence.availability] || availabilityVariants.LOW;

  return (
    <div className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Evidence Assessment</h4>
        </div>
        <Badge variant={curr.variant} size="sm">
          {curr.label}
        </Badge>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/70">
        {evidence.description}
      </p>

      {/* Supporting Evidence */}
      {evidence.supportingEvidence.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Supporting References
          </span>
          <div className="space-y-2">
            {evidence.supportingEvidence.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/30 text-xs flex flex-col gap-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200">{item.title}</span>
                  <Badge variant="success" size="sm">
                    {item.source}
                  </Badge>
                </div>
                <p className="text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">{item.summary}</p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                  >
                    View Primary Document <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Counter Evidence */}
      {evidence.counterEvidence.length > 0 && (
        <div>
          <span className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /> Contradictory Fact Checks & Advisories
          </span>
          <div className="space-y-2">
            {evidence.counterEvidence.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-red-100 dark:border-red-800/60 bg-red-50/40 dark:bg-red-950/30 text-xs flex flex-col gap-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-red-950 dark:text-red-200">{item.title}</span>
                  <Badge variant="danger" size="sm">
                    {item.source}
                  </Badge>
                </div>
                <p className="text-red-900/80 dark:text-red-300/80 leading-relaxed">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
