import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, XCircle, ArrowRight, UserCheck, MessageSquare } from 'lucide-react';
import { Submission } from '../../types';
import { ClassificationBadge } from '../verification/ClassificationBadge';
import { Button } from '../common/Button';
import { Textarea } from '../common/Textarea';
import { Badge } from '../common/Badge';

export interface ReviewCardProps {
  submission: Submission;
  onReviewSubmit: (params: {
    submissionId: string;
    decision: 'CONFIRMED' | 'MARKED_TRUSTED' | 'MARKED_MISLEADING' | 'NEEDS_FURTHER_REVIEW';
    adminNotes: string;
  }) => void;
  isProcessing?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  submission,
  onReviewSubmit,
  isProcessing = false,
}) => {
  const [decision, setDecision] = useState<
    'CONFIRMED' | 'MARKED_TRUSTED' | 'MARKED_MISLEADING' | 'NEEDS_FURTHER_REVIEW'
  >('CONFIRMED');
  const [adminNotes, setAdminNotes] = useState('');
  const res = submission.result;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReviewSubmit({
      submissionId: submission.id,
      decision,
      adminNotes: adminNotes || `Assessment reviewed by administrator. Decision: ${decision}`,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold font-mono text-slate-400 dark:text-slate-500">
              #{submission.id.slice(-6).toUpperCase()}
            </span>
            <Badge variant="neutral" size="sm">
              {submission.contentType}
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">by {submission.userName}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-lg">
            "{submission.fullContent.slice(0, 100)}..."
          </h4>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase">Auto Score</span>
            <span className="text-base font-black font-mono text-slate-800 dark:text-slate-100">
              {res?.score ?? '—'}/100
            </span>
          </div>
          {res && <ClassificationBadge classification={res.classification} size="sm" />}
        </div>
      </div>

      {/* Extracted Reasons & Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/70">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
            Detected Indicators
          </span>
          <div className="space-y-1.5">
            {res?.indicators.map((ind) => (
              <div key={ind.id} className="flex items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300 truncate">{ind.name}</span>
                <span
                  className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                    ind.level === 'HIGH'
                      ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {ind.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/70">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
            Source & Domain Credibility
          </span>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{res?.source.name || 'Unknown Source'}</p>
          <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mb-2">{res?.source.domain}</p>
          <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            {res?.source.previousMisinformationCount} historical flags recorded
          </span>
        </div>
      </div>

      {/* Review Adjudication Form */}
      <form onSubmit={handleSubmit} className="pt-2 space-y-4 border-t border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
            Select Administrative Decision:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDecision('CONFIRMED')}
              className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                decision === 'CONFIRMED'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Confirm Assessment
            </button>
            <button
              type="button"
              onClick={() => setDecision('MARKED_TRUSTED')}
              className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                decision === 'MARKED_TRUSTED'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Mark as Trusted
            </button>
            <button
              type="button"
              onClick={() => setDecision('MARKED_MISLEADING')}
              className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                decision === 'MARKED_MISLEADING'
                  ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Mark as Misleading
            </button>
            <button
              type="button"
              onClick={() => setDecision('NEEDS_FURTHER_REVIEW')}
              className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                decision === 'NEEDS_FURTHER_REVIEW'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Needs Investigation
            </button>
          </div>
        </div>

        <Textarea
          label="Internal Admin Notes & Corroboration Links"
          placeholder="Document reason for manual override or additional investigative notes..."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={2}
          showCharCount={false}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" size="sm" isLoading={isProcessing} leftIcon={<UserCheck className="w-4 h-4" />}>
            Submit Review Adjudication
          </Button>
        </div>
      </form>
    </div>
  );
};
