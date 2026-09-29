import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  BellRing,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Submission, AlertItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ClassificationBadge } from '../../components/verification/ClassificationBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { AlertModal } from '../../components/admin/AlertModal';
import { useToast } from '../../context/ToastContext';

export const AdminFlaggedDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  useEffect(() => {
    const loadFlaggedDetail = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const sub = await adminService.getSubmissionById(id);
        if (sub) {
          setSubmission(sub);
        } else {
          setError('Flagged submission record not found.');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve flagged dossier.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFlaggedDetail();
  }, [id]);

  const handleBroadcastAlert = async (alertData: any) => {
    try {
      await adminService.createAlert({
        ...alertData,
        title: `URGENT FACT CHECK: ${submission?.contentPreview.slice(0, 60)}...`,
      });
      toast.success('Alert Broadcasted', 'Public warning has been published across the portal.');
      setIsAlertModalOpen(false);
    } catch (err: any) {
      toast.error('Failed to Broadcast', err?.message || 'Could not publish advisory.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading flagged forensic investigation dossier..." />;
  }

  if (error || !submission || !submission.result) {
    return (
      <ErrorState
        title="Flagged Record Not Found"
        message={error || 'The requested flagged content does not exist.'}
        onRetry={() => navigate('/admin/flagged')}
      />
    );
  }

  const { result } = submission;

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header Back & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/flagged"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Flagged Feed
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsAlertModalOpen(true)}
            leftIcon={<BellRing className="w-3.5 h-3.5" />}
          >
            Broadcast Public Advisory
          </Button>
          <Link to={`/admin/reviews/${submission.id}`}>
            <Button variant="primary" size="sm">
              Open Review Workspace
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Forensic Dossier Card */}
      <div className="rounded-3xl border border-rose-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <ClassificationBadge classification={result.classification} size="md" />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                CRITICAL MISINFORMATION RISK
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {submission.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              Flagged Misinformation Investigation Dossier
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Submitted by: <strong className="text-slate-800">{submission.userName}</strong> ({submission.userEmail})
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Ingested: {new Date(submission.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 p-4 rounded-2xl bg-rose-50/50 border border-rose-100 self-start sm:self-auto">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                Credibility Score
              </span>
              <span className="text-3xl font-black text-rose-600 font-mono">
                {result.score}<span className="text-sm font-bold text-rose-400">/100</span>
              </span>
            </div>
            <div className="h-10 w-px bg-rose-200" />
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                AI Confidence
              </span>
              <span className="text-3xl font-black text-slate-900 font-mono">
                {result.confidence}%
              </span>
            </div>
          </div>
        </div>

        {/* Flagged Content Preview */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Original Flagged Content ({submission.contentType})
          </h2>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
            {submission.fullContent || submission.contentPreview}
          </div>
        </div>

        {/* AI Forensic Summary */}
        <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 text-xs text-slate-800 space-y-1">
          <span className="font-bold text-rose-950 uppercase tracking-wider text-[11px] block">
            Automated Disinformation Analysis:
          </span>
          <p className="leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {/* Two Column Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Flagged Indicators */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900">
            High-Risk Misinformation Indicators ({result.indicators.length})
          </h2>
          <div className="space-y-2.5">
            {result.indicators.map((ind) => (
              <div
                key={ind.id}
                className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">{ind.name}</span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{ind.description}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase flex-shrink-0 ${
                    ind.level === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {ind.level} ({ind.score}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Origin Publisher Profile & Counter-Evidence */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900">
              Source Domain Credibility Analysis
            </h2>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{result.source.name}</span>
                <span className="font-mono text-xs text-blue-600">{result.source.domain}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{result.source.details}</p>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-500">Domain Trust Score:</span>
                <span className="font-black text-rose-600">{result.source.credibilityScore}/100</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900">
              Corroborating / Counter Evidence ({result.evidence.length})
            </h2>
            <div className="space-y-2 text-xs">
              {result.evidence.map((ev) => (
                <div key={ev.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate">{ev.sourceName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{ev.sourceDomain}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-2">{ev.contentSnippet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Alert Modal */}
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onSubmit={handleBroadcastAlert}
        initialData={{
          title: `PUBLIC WARNING: Misleading claims regarding "${submission.contentPreview.slice(0, 50)}"`,
          description: `Official Fact-Check Refutation:\n${result.summary}\n\nEvidence confirms this viral claim is inaccurate.`,
          severity: 'HIGH',
          targetAudience: 'ALL_USERS',
        }}
      />
    </div>
  );
};
