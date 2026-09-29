import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  X,
  Send,
  Link as LinkIcon,
  HelpCircle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  ArrowRight,
  UserCheck,
  Tag,
  ListFilter,
  CheckSquare,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Claim } from '../../types';
import { ClassificationBadge } from './ClassificationBadge';
import { verificationService } from '../../services/verificationService';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';

export interface ReportVerdictModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationId: string;
  currentClassification?: string;
  claims?: Claim[];
  initialSelectedClaim?: Claim | null;
  initialClaimIndex?: number | null;
  onReportSuccess?: () => void;
}

const GENERAL_REPORT_REASONS = [
  {
    value: 'INCORRECT_RESULT',
    label: 'Incorrect Overall Verdict / Classification',
    desc: 'The AI concluded Real when it is Fake, or vice-versa.',
  },
  {
    value: 'MISLEADING_INFORMATION',
    label: 'Missing Context or Subtle Nuance',
    desc: 'The report misses crucial background facts or local Ghanaian context.',
  },
  {
    value: 'INSUFFICIENT_EVIDENCE',
    label: 'Insufficient Evidence Grounding',
    desc: 'The reasoning lacks verified corroboration or reputable public data.',
  },
  {
    value: 'WRONG_SOURCE',
    label: 'Inaccurate or Biased Sources Cited',
    desc: 'The sources referenced are invalid, outdated, or misattributed.',
  },
  {
    value: 'OTHER',
    label: 'Other Editorial or Factual Error',
    desc: 'Any other inaccuracy or discrepancy in the overall assessment.',
  },
];

const CLAIM_REPORT_REASONS = [
  {
    value: 'CLAIM_MISCLASSIFIED',
    label: 'AI Misclassified This Specific Claim',
    desc: 'The AI status for this claim contradicts reality or official records.',
  },
  {
    value: 'CLAIM_FACTUALLY_TRUE',
    label: 'Claim is Actually True / Verifiable',
    desc: 'The AI flagged this claim as false/unsupported, but verified facts support it.',
  },
  {
    value: 'CLAIM_FACTUALLY_FALSE',
    label: 'Claim is Actually False / Debunked',
    desc: 'The AI treated this claim as authentic, but it is fabricated or refuted.',
  },
  {
    value: 'CLAIM_MISSING_CONTEXT',
    label: 'Claim Taken Out of Context',
    desc: 'Missing key timing, regional nuances, or prerequisite qualifiers.',
  },
  {
    value: 'CLAIM_OUTDATED_STATUS',
    label: 'Outdated Information / Situation Evolved',
    desc: 'The claim was accurate in the past but current developments have altered it.',
  },
  {
    value: 'CLAIM_POOR_EVIDENCE',
    label: 'Cited Evidence Does Not Support Claim Analysis',
    desc: 'The AI rationale does not match the actual content of referenced sources.',
  },
  {
    value: 'OTHER',
    label: 'Other Specific Discrepancy',
    desc: 'Other contested details regarding this specific claim.',
  },
];

export const ReportVerdictModal: React.FC<ReportVerdictModalProps> = ({
  isOpen,
  onClose,
  verificationId,
  currentClassification,
  claims = [],
  initialSelectedClaim = null,
  initialClaimIndex = null,
  onReportSuccess,
}) => {
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  // Selected claim ID ('__ALL__' or specific claim ID / index key)
  const [selectedClaimKey, setSelectedClaimKey] = useState<string>('__ALL__');
  const [reason, setReason] = useState<string>('INCORRECT_RESULT');
  const [description, setDescription] = useState('');
  const [suggestedClassification, setSuggestedClassification] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Initialize or update selection when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedClaim) {
        const claimKey = initialSelectedClaim.id || `claim-idx-${initialClaimIndex ?? 0}`;
        setSelectedClaimKey(claimKey);
        setReason('CLAIM_MISCLASSIFIED');
      } else if (initialClaimIndex !== null && initialClaimIndex !== undefined && claims[initialClaimIndex]) {
        setSelectedClaimKey(claims[initialClaimIndex].id || `claim-idx-${initialClaimIndex}`);
        setReason('CLAIM_MISCLASSIFIED');
      } else {
        setSelectedClaimKey('__ALL__');
        setReason('INCORRECT_RESULT');
      }
      setIsSubmitted(false);
    }
  }, [isOpen, initialSelectedClaim, initialClaimIndex, claims]);

  // Find active claim object
  const activeClaim: Claim | null =
    selectedClaimKey === '__ALL__'
      ? null
      : claims.find((c, idx) => c.id === selectedClaimKey || `claim-idx-${idx}` === selectedClaimKey) ||
        initialSelectedClaim ||
        null;

  const isClaimSpecific = Boolean(activeClaim && selectedClaimKey !== '__ALL__');
  const activeReasons = isClaimSpecific ? CLAIM_REPORT_REASONS : GENERAL_REPORT_REASONS;

  const handleClaimSelectionChange = (newKey: string) => {
    setSelectedClaimKey(newKey);
    if (newKey === '__ALL__') {
      setReason('INCORRECT_RESULT');
      setSuggestedClassification('');
    } else {
      setReason('CLAIM_MISCLASSIFIED');
      setSuggestedClassification('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || description.trim().length < 10) {
      toast.error(
        'More Details Required',
        'Please provide at least a brief explanation (minimum 10 characters) explaining why this AI analysis is contested.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const suffix = isClaimSpecific ? 'CLM' : 'VRD';
      const generatedTicket = `FLAG-${verificationId.slice(-6).toUpperCase()}-${suffix}`;
      setTicketId(generatedTicket);

      await verificationService.reportIncorrectVerdict(verificationId, {
        reason,
        description: description.trim(),
        suggestedClassification: suggestedClassification || undefined,
        evidenceUrl: evidenceUrl.trim() || undefined,
        claimText: activeClaim?.text || undefined,
        claimId: activeClaim?.id || undefined,
        claimStatus: activeClaim?.status || undefined,
      });

      setIsSubmitted(true);

      // In-app notification center sync
      const targetLabel = isClaimSpecific
        ? `Contested Claim: "${activeClaim?.text.slice(0, 45)}..."`
        : `Assessment #${verificationId.slice(-6).toUpperCase()}`;

      addNotification({
        type: 'SYSTEM_ALERT',
        title: isClaimSpecific ? 'Claim Inaccuracy Report Submitted' : 'Verdict Dispute Submitted for Review',
        message: `Your feedback regarding ${targetLabel} has been logged and queued for human fact-checker adjudication.`,
        relatedResultId: verificationId,
      });

      // Clear, informative confirmation toast
      toast.success(
        'Inaccuracy Report Submitted for Review',
        `Your feedback on ${isClaimSpecific ? 'Claim Analysis' : 'Verdict'} was successfully registered under Ticket ${generatedTicket}. Our editorial team has been notified.`
      );

      onReportSuccess?.();
    } catch (err: any) {
      toast.error('Submission Failed', err?.message || 'Could not submit dispute report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicket = async () => {
    if (!ticketId) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(ticketId);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = ticketId;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 2000);
      toast.success('Ticket ID Copied', `Dispute reference ${ticketId} copied to clipboard.`);
    } catch (e) {
      // ignore
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setDescription('');
    setEvidenceUrl('');
    setSuggestedClassification('');
    setSelectedClaimKey('__ALL__');
    onClose();
  };

  const selectedReasonLabel =
    activeReasons.find((r) => r.value === reason)?.label || 'Disputed Assessment';

  return (
    <div
      id="report-verdict-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-verdict-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                isSubmitted
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isSubmitted ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3
                id="report-verdict-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {isSubmitted
                  ? 'Inaccuracy Feedback Submitted'
                  : isClaimSpecific
                  ? 'Inaccuracy Report: Contested Claim'
                  : 'Report Inaccurate AI Verdict'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSubmitted
                  ? `Ticket #${ticketId || verificationId.slice(-6).toUpperCase()} • In Review Queue`
                  : isClaimSpecific
                  ? `Submit feedback disputing the AI's analysis for this specific claim`
                  : `Flag assessment #${verificationId.slice(-6).toUpperCase()} for human fact-check audit`}
              </p>
            </div>
          </div>
          <button
            id="close-report-modal-btn"
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isSubmitted ? (
          <div className="p-6 overflow-y-auto space-y-5 text-left">
            {/* Success Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                  Feedback Successfully Logged for Human Review
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                    Active
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Your inaccuracy dispute regarding {isClaimSpecific ? 'the specified claim' : 'this verification'} has been forwarded to our editorial fact-checking desk. Human adjudicators will cross-reference the submitted context with Ghanaian public records.
                </p>
              </div>
            </div>

            {/* Contested Target Summary */}
            {activeClaim && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Contested Claim Summary
                </span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 italic">
                  "{activeClaim.text}"
                </p>
              </div>
            )}

            {/* Ticket & Reference ID Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Dispute Tracking Reference
                </span>
                <button
                  id="copy-dispute-ticket-btn"
                  type="button"
                  onClick={handleCopyTicket}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedTicket ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy ID
                    </>
                  )}
                </button>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 font-mono text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>{ticketId || `FLAG-${verificationId.slice(-6).toUpperCase()}`}</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal">
                  Ref: #{verificationId}
                </span>
              </div>
            </div>

            {/* Workflow Review Progress Steps */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Editorial Review Workflow
              </label>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      1. Inaccuracy Report Received
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Reason: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedReasonLabel}</span>
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse shadow-2xs">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      2. In Human Fact-Checker Review Queue
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Assigned for manual evidence cross-examination (typically within 24 hours).
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      3. Adjudication & Calibration
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      If confirmed inaccurate, human review status, refined scores, and fact-checking seals will update.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Action */}
            <div className="pt-2">
              <Button
                id="ack-report-submitted-btn"
                variant="primary"
                onClick={handleResetAndClose}
                className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                Back to Assessment
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {/* Target Selection: Entire Verdict vs Specific Claim */}
            {claims.length > 0 && (
              <div className="space-y-1.5">
                <label
                  htmlFor="dispute-target-select"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <ListFilter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Target of Inaccuracy Report
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {claims.length} claims extracted
                  </span>
                </label>
                <select
                  id="dispute-target-select"
                  value={selectedClaimKey}
                  onChange={(e) => handleClaimSelectionChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all"
                >
                  <option value="__ALL__">Overall Verification Verdict (Entire Assessment)</option>
                  {claims.map((c, idx) => {
                    const key = c.id || `claim-idx-${idx}`;
                    return (
                      <option key={key} value={key}>
                        Claim #{idx + 1}: "{c.text.length > 55 ? c.text.slice(0, 52) + '...' : c.text}" [{c.status}]
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Contested Specific Claim Callout Box */}
            {activeClaim && (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-amber-900 dark:text-amber-200">
                    <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Contested Claim Focus
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100">
                    AI Status: {activeClaim.status}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 italic leading-relaxed">
                  "{activeClaim.text}"
                </p>
                {activeClaim.details && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40">
                    <strong className="text-slate-700 dark:text-slate-200">AI Finding:</strong> {activeClaim.details}
                  </p>
                )}
              </div>
            )}

            {/* General Notice */}
            {!activeClaim && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  Current AI classification is{' '}
                  <strong className="font-bold uppercase underline">
                    {currentClassification || 'UNVERIFIED'}
                  </strong>
                  . Human adjudicators evaluate reports within 24 hours.
                </span>
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-1.5">
              <label
                htmlFor="report-reason-select"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Primary Inaccuracy Reason <span className="text-red-500">*</span>
              </label>
              <select
                id="report-reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all"
              >
                {activeReasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Suggested Status / Classification */}
            <div className="space-y-1.5">
              <label
                htmlFor="suggested-classification-select"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                {isClaimSpecific
                  ? 'What should this claim’s status be? (Optional)'
                  : 'What should the correct verdict be? (Optional)'}
              </label>
              <select
                id="suggested-classification-select"
                value={suggestedClassification}
                onChange={(e) => setSuggestedClassification(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all"
              >
                <option value="">-- Leave as Unspecified --</option>
                {isClaimSpecific ? (
                  <>
                    <option value="VERIFIED">VERIFIED (Authentic & Corroborated)</option>
                    <option value="CONTRADICTED">CONTRADICTED (Refuted / Factually Inaccurate)</option>
                    <option value="UNSUPPORTED">UNSUPPORTED (Lacks Factual Basis)</option>
                    <option value="REQUIRES_VERIFICATION">REQUIRES_VERIFICATION (Needs Context)</option>
                  </>
                ) : (
                  <>
                    <option value="VERIFIED">VERIFIED (Authentic & Validated)</option>
                    <option value="TRUSTED">TRUSTED (Credible Source)</option>
                    <option value="SUSPICIOUS">SUSPICIOUS (Misleading / Distorted)</option>
                    <option value="FAKE">FAKE (Fabricated / Misinformation)</option>
                    <option value="UNVERIFIED">UNVERIFIED (Insufficient Info)</option>
                  </>
                )}
              </select>
            </div>

            {/* Description / Explanation */}
            <div className="space-y-1.5">
              <label
                htmlFor="report-description-textarea"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                {isClaimSpecific
                  ? 'Why is the AI’s analysis of this claim contested?'
                  : 'Explanation & Context'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="report-description-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isClaimSpecific
                    ? 'Explain why the AI analysis for this claim is flawed, citing any specific counter-facts, dates, or official statements...'
                    : 'Explain what specific claims or details in the report are inaccurate, and why...'
                }
                rows={3}
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all resize-none"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Minimum 10 characters.</span>
                <span>{description.length} chars</span>
              </div>
            </div>

            {/* Evidence URL / Counter Reference */}
            <div className="space-y-1.5">
              <label
                htmlFor="report-evidence-url-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span>Supporting Source / Ref Link (Optional)</span>
                <span className="text-[10px] font-normal text-slate-400">e.g. Official gazette, news, or agency URL</span>
              </label>
              <div className="relative">
                <input
                  id="report-evidence-url-input"
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://official-source.gov.gh/statement"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all"
                />
                <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                id="cancel-report-btn"
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                id="submit-report-btn"
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-3.5 h-3.5" />}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Submit Inaccuracy Report
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
