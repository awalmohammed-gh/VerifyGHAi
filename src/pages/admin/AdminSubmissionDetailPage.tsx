import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Globe,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { verificationService } from '../../services/verificationService';
import { adminService } from '../../services/adminService';
import { Submission, FactCheck } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ClassificationBadge } from '../../components/verification/ClassificationBadge';
import { SourceCard } from '../../components/verification/SourceCard';
import { IndicatorCard } from '../../components/verification/IndicatorCard';
import { ClaimCard } from '../../components/verification/ClaimCard';
import { EvidenceCard } from '../../components/verification/EvidenceCard';
import { RecommendationCard } from '../../components/verification/RecommendationCard';
import { ExplanationSection } from '../../components/verification/ExplanationSection';
import { VerificationSourcesCard } from '../../components/verification/VerificationSourcesCard';
import { CommentsSection } from '../../components/verification/CommentsSection';
import { VerificationResultSkeleton } from '../../components/common/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';

export const AdminSubmissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [matchingFactChecks, setMatchingFactChecks] = useState<FactCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdjudicating, setIsAdjudicating] = useState(false);

  useEffect(() => {
    const loadSubmissionData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const sub = await verificationService.getSubmissionById(id);
        if (sub) {
          setSubmission(sub);
          // Load related fact checks
          const fcs = await adminService.getFactChecks();
          const query = sub.contentPreview.toLowerCase();
          const matches = fcs.filter(
            (fc) =>
              query.includes(fc.source.toLowerCase()) ||
              fc.claim.toLowerCase().includes(query.slice(0, 20)) ||
              sub.result?.claims.some((c) => fc.claim.toLowerCase().includes(c.text.slice(0, 15).toLowerCase()))
          );
          setMatchingFactChecks(matches.slice(0, 3));
        } else {
          setError('Submission record not found.');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve submission record.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissionData();
  }, [id]);

  const handleQuickAdjudicate = async (
    decision: 'CONFIRMED' | 'MARKED_TRUSTED' | 'MARKED_MISLEADING' | 'NEEDS_FURTHER_REVIEW'
  ) => {
    if (!submission) return;
    try {
      setIsAdjudicating(true);
      await adminService.reviewSubmission({
        submissionId: submission.id,
        decision,
        adminNotes: `Adjudicated directly from admin inspection desk: ${decision}.`,
        adminName: 'Administrator',
      });
      toast.success('Adjudication Saved', `Submission marked as: ${decision}`);
    } catch (err: any) {
      toast.error('Adjudication Failed', err?.message || 'Could not record review.');
    } finally {
      setIsAdjudicating(false);
    }
  };

  if (isLoading) {
    return <VerificationResultSkeleton title="Loading submission forensic data..." />;
  }

  if (error || !submission || !submission.result) {
    return (
      <ErrorState
        title="Submission Not Found"
        message={error || 'The requested submission record does not exist.'}
        onRetry={() => navigate('/admin/submissions')}
      />
    );
  }

  const { result } = submission;

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/submissions"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Submissions Repository
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            isLoading={isAdjudicating}
            onClick={() => handleQuickAdjudicate('MARKED_TRUSTED')}
          >
            Mark Trusted
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={isAdjudicating}
            onClick={() => handleQuickAdjudicate('MARKED_MISLEADING')}
          >
            Mark Misleading
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isLoading={isAdjudicating}
            onClick={() => handleQuickAdjudicate('CONFIRMED')}
          >
            Confirm AI Score
          </Button>
        </div>
      </div>

      {/* Primary Ingestion & Overview Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <ClassificationBadge classification={result.classification} size="md" />
              <Badge variant="neutral" size="sm">
                {submission.contentType}
              </Badge>
              <Badge variant="info" size="sm">
                ID: {submission.id}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Ingestion Forensic Audit Report
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Submitted by: <Link to={`/admin/users/${submission.userId}`} className="text-blue-600 font-bold hover:underline">{submission.userName}</Link>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(submission.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 self-start lg:self-auto">
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Credibility Score
              </span>
              <span className="text-3xl font-black text-slate-900 font-mono">
                {result.score}<span className="text-sm font-bold text-slate-400">/100</span>
              </span>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                AI Confidence
              </span>
              <span className="text-3xl font-black text-blue-600 font-mono">
                {result.confidence}%
              </span>
            </div>
          </div>
        </div>

        {/* Original Content Inspector */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" /> Original Submitted Content
          </h2>
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
            {submission.contentPreview}
          </div>
          {submission.url && (
            <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> URL: <a href={submission.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{submission.url}</a>
            </p>
          )}
        </div>
      </div>

      {/* Verification Sources & Cross-Referenced Evidence */}
      <VerificationSourcesCard
        sources={result.verificationSources}
        referencedLinks={result.referencedTrustedSources}
      />

      {/* Deep Forensic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Source Credibility & Evidence */}
        <div className="space-y-6">
          <SourceCard source={result.source} />
          <EvidenceCard evidence={result.evidence} />
          <RecommendationCard recommendation={result.recommendation} />
        </div>

        {/* Right Column: Indicators, Claims & Fact-Checks */}
        <div className="space-y-6">
          {/* Detected Indicators */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Content Characteristics & Indicators
            </h3>
            <div className="space-y-3">
              {result.indicators.map((ind, idx) => (
                <IndicatorCard key={idx} indicator={ind} />
              ))}
            </div>
          </div>

          {/* Claims Assessment */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Extracted Factual Claims
            </h3>
            <div className="space-y-3">
              {result.claims.map((claim, idx) => (
                <ClaimCard key={idx} claim={claim} />
              ))}
            </div>
          </div>

          {/* Reasoning & Explanations */}
          <ExplanationSection explanations={result.explanations} />

          {/* Cross-Matched Fact Checks */}
          {matchingFactChecks.length > 0 && (
            <div className="rounded-3xl border border-blue-200/90 bg-blue-50/50 p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Cross-Matched Knowledge Base Fact-Checks
              </div>
              <div className="space-y-2">
                {matchingFactChecks.map((fc) => (
                  <div key={fc.id} className="p-3 rounded-xl bg-white border border-blue-100 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">{fc.claim}</span>
                      <Badge variant={fc.verdict === 'FALSE' ? 'danger' : 'warning'} size="sm">
                        {fc.verdict}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Source: {fc.source} • Verified by: {fc.verifiedBy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Community Context & Editorial Comments Section */}
      <div className="pt-2">
        <CommentsSection
          verificationId={submission.id}
          verificationTitle={submission.contentPreview}
        />
      </div>
    </div>
  );
};
