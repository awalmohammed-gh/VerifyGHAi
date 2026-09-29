import React, { useState } from 'react';
import { FileText, Flag, AlertTriangle, MessageSquare, ShieldAlert } from 'lucide-react';
import { Claim } from '../../types';
import { ClassificationBadge } from './ClassificationBadge';
import { Button } from '../common/Button';
import { ReportVerdictModal } from './ReportVerdictModal';

export interface ClaimCardProps {
  claims?: Claim[];
  claim?: Claim;
  verificationId?: string;
  currentClassification?: string;
  onReportInaccuracy?: (claim?: Claim, index?: number) => void;
  className?: string;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({
  claims,
  claim,
  verificationId,
  currentClassification,
  onReportInaccuracy,
  className = '',
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [selectedClaimForModal, setSelectedClaimForModal] = useState<Claim | null>(null);
  const [selectedClaimIndexForModal, setSelectedClaimIndexForModal] = useState<number | null>(null);

  // Normalize claims array
  const claimsList: Claim[] = claims || (claim ? [claim] : []);

  const handleOpenReport = (targetClaim?: Claim, index?: number) => {
    if (onReportInaccuracy) {
      onReportInaccuracy(targetClaim, index);
    } else if (verificationId) {
      setSelectedClaimForModal(targetClaim || null);
      setSelectedClaimIndexForModal(index ?? null);
      setInternalModalOpen(true);
    }
  };

  const renderClaimStatusBadge = (status: string) => {
    let badgeType = 'UNVERIFIED';
    let customLabel = 'Requires Verification';

    if (status === 'VERIFIED') {
      badgeType = 'VERIFIED';
      customLabel = 'Verified Authentic';
    } else if (status === 'CONTRADICTED') {
      badgeType = 'DEBUNKED';
      customLabel = 'Contradicted by Facts';
    } else if (status === 'UNSUPPORTED') {
      badgeType = 'LIKELY_FALSE';
      customLabel = 'Unsupported Claim';
    }

    return (
      <ClassificationBadge
        classification={badgeType}
        customLabel={customLabel}
        size="sm"
        className="flex-shrink-0"
      />
    );
  };

  // If a single claim is passed without container wrapper
  if (claim && !claims) {
    return (
      <>
        <div
          className={`p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col gap-3 ${className}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                •
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                "{claim.text}"
              </p>
            </div>
            {renderClaimStatusBadge(claim.status)}
          </div>

          {claim.details && (
            <p className="text-xs text-slate-600 dark:text-slate-300 pl-7 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
              {claim.details}
            </p>
          )}

          {/* Action Row */}
          {(onReportInaccuracy || verificationId) && (
            <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleOpenReport(claim, 0)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                title="Submit feedback disputing this claim's AI analysis"
              >
                <Flag className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Inaccuracy Report</span>
              </button>
            </div>
          )}
        </div>

        {verificationId && (
          <ReportVerdictModal
            isOpen={internalModalOpen}
            onClose={() => setInternalModalOpen(false)}
            verificationId={verificationId}
            currentClassification={currentClassification}
            claims={claimsList}
            initialSelectedClaim={selectedClaimForModal}
            initialClaimIndex={selectedClaimIndexForModal}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        id="verification-claims-card"
        className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs ${className}`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Extracted Key Claims
            </h4>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium ml-1">
              ({claimsList.length} claims extracted)
            </span>
          </div>

          {(onReportInaccuracy || verificationId) && (
            <button
              id="report-claims-general-btn"
              type="button"
              onClick={() => handleOpenReport(undefined, undefined)}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
              title="Contest or report inaccuracies in extracted claims"
            >
              <Flag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Inaccuracy Report</span>
            </button>
          )}
        </div>

        {/* Claims List */}
        <div className="space-y-3.5">
          {claimsList.map((c, idx) => (
            <div
              key={c.id || idx}
              id={`claim-card-item-${idx + 1}`}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs flex flex-col gap-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    "{c.text}"
                  </p>
                </div>
                {renderClaimStatusBadge(c.status)}
              </div>

              {c.details && (
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-7 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  {c.details}
                </p>
              )}

              {/* Claim Action Bar with Inaccuracy Report Button */}
              {(onReportInaccuracy || verificationId) && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50 pl-7 text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">
                    Claim #{idx + 1} Assessment
                  </span>
                  <button
                    id={`report-inaccuracy-claim-${idx + 1}`}
                    type="button"
                    onClick={() => handleOpenReport(c, idx)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
                    title={`Submit feedback disputing the AI analysis for Claim #${idx + 1}`}
                  >
                    <Flag className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Inaccuracy Report</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {verificationId && (
        <ReportVerdictModal
          isOpen={internalModalOpen}
          onClose={() => setInternalModalOpen(false)}
          verificationId={verificationId}
          currentClassification={currentClassification}
          claims={claimsList}
          initialSelectedClaim={selectedClaimForModal}
          initialClaimIndex={selectedClaimIndexForModal}
        />
      )}
    </>
  );
};
