import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Check,
  RefreshCw,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Submission, AdminReview, Classification } from '../../types';
import { Button } from '../../components/common/Button';
import { ClassificationBadge } from '../../components/verification/ClassificationBadge';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { SourceTraceCard } from '../../components/verification/SourceTraceCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const AdminReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [review, setReview] = useState<AdminReview | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [selectedDecision, setSelectedDecision] = useState<'CONFIRMED' | 'CHANGED' | 'NEEDS_FURTHER_REVIEW'>('CONFIRMED');
  const [overrideClassification, setOverrideClassification] = useState<Classification>('SUSPICIOUS');
  const [adminNotes, setAdminNotes] = useState('');

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await adminService.getReviewById(id);
      if (data.submission) {
        setSubmission(data.submission);
        setReview(data.review || null);
        if (data.review?.adminNotes) {
          setAdminNotes(data.review.adminNotes);
        }
        if (data.review?.finalClassification) {
          setOverrideClassification(data.review.finalClassification);
        } else if (data.submission.result) {
          setOverrideClassification(data.submission.result.classification);
        }
      } else {
        setError('Review item or submission record not found.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load review case.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSubmitAdjudication = async (decision: 'CONFIRMED' | 'CHANGED' | 'NEEDS_FURTHER_REVIEW') => {
    if (!submission) return;
    if (!adminNotes.trim()) {
      toast.warning('Notes Required', 'Please enter administrative justification notes before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.submitReview({
        reviewId: review?.id,
        submissionId: submission.id,
        decision,
        newClassification: decision === 'CHANGED' ? overrideClassification : undefined,
        adminNotes,
        adminName: currentUser?.name || 'Administrator',
      });

      toast.success(
        'Adjudication Saved',
        `Submission ${submission.id} successfully adjudicated with decision [${decision}].`
      );

      navigate('/admin/reviews');
    } catch (err: any) {
      toast.error('Adjudication Error', err?.message || 'Could not record manual review decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading manual adjudication dossier..." />;
  }

  if (error || !submission || !submission.result) {
    return (
      <ErrorState
        title="Review Item Not Found"
        message={error || 'The requested review submission could not be located.'}
        onRetry={() => navigate('/admin/reviews')}
      />
    );
  }

  const { result } = submission;

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header & Back link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/reviews"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Review Queue
        </Link>
        <div className="flex items-center gap-2">
          {review && <PriorityBadge priority={review.priority} size="md" />}
          <span
            className={`px-2.5 py-1 text-xs font-extrabold uppercase rounded-full border ${
              review?.status === 'RESOLVED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {review?.status || 'PENDING REVIEW'}
          </span>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Manual Adjudication Case Dossier
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Submission Review: {submission.id}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Submitted by: <strong className="text-slate-800">{submission.userName}</strong> ({submission.userEmail}) • {new Date(submission.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 self-start sm:self-auto">
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Auto Score</span>
              <span className="text-2xl font-black text-slate-900 font-mono">{result.score}/100</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Confidence</span>
              <span className="text-2xl font-black text-blue-600 font-mono">{result.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Original Content Snippet */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Original Input Content ({submission.contentType})
          </span>
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 text-xs sm:text-sm text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
            {submission.fullContent || submission.contentPreview}
          </div>
        </div>
      </div>

      {/* Provenance & Source Trace View */}
      {result.sourceTrace && (
        <SourceTraceCard sourceTrace={result.sourceTrace} />
      )}

      {/* Side-by-Side: Automated Assessment vs Admin Adjudication */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Automated Findings Breakdown */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">Automated AI Assessment</h2>
            </div>
            <ClassificationBadge classification={result.classification} size="sm" />
          </div>

          {/* AI Summary */}
          <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-100 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-blue-900 block mb-1">Executive Summary:</span>
            {result.summary}
          </div>

          {/* Source Info */}
          <div className="space-y-1.5 text-xs">
            <span className="font-bold text-slate-700">Source Entity Evaluation:</span>
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">{result.source.name}</span>
                <span className="text-slate-400 font-mono text-[11px]">{result.source.domain}</span>
              </div>
              <div className="text-right">
                <StatusBadge status={result.source.status} size="sm" />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Score: {result.source.credibilityScore}/100
                </span>
              </div>
            </div>
          </div>

          {/* Key Indicators */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-700">Flagged Indicators:</span>
            <div className="space-y-1.5">
              {result.indicators.map((ind) => (
                <div key={ind.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <span className="font-medium text-slate-800">{ind.name}</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                    ind.level === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {ind.level} ({ind.score}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="space-y-1 text-xs">
            <span className="font-bold text-slate-700">Automated Recommendation:</span>
            <p className="text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              "{result.recommendation}"
            </p>
          </div>
        </div>

        {/* Right: Admin Adjudication Form */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">Administrator Adjudication</h2>
            </div>

            {/* Adjudicator Officer Identity Card */}
            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center">
                  {(currentUser?.name || 'Dion Malik Deh').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-700 block">Adjudicating Reviewer</span>
                  <span className="font-extrabold text-slate-900">{currentUser?.name || 'Dion Malik Deh'}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-purple-900 font-bold px-2 py-0.5 rounded-lg bg-white border border-purple-200">
                ROLE: ADMIN
              </span>
            </div>

            {/* Adjudication Decision Type */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800 block">Select Adjudication Action:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDecision('CONFIRMED')}
                  className={`p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer ${
                    selectedDecision === 'CONFIRMED'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mb-1 text-blue-600" />
                  Confirm AI Result
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDecision('CHANGED')}
                  className={`p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer ${
                    selectedDecision === 'CHANGED'
                      ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 mb-1 text-purple-600" />
                  Override Result
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDecision('NEEDS_FURTHER_REVIEW')}
                  className={`p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer ${
                    selectedDecision === 'NEEDS_FURTHER_REVIEW'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 mb-1 text-amber-600" />
                  Request Fact-Check
                </button>
              </div>
            </div>

            {/* Classification Override Dropdown (When CHANGED) */}
            {selectedDecision === 'CHANGED' && (
              <div className="space-y-2 text-xs p-4 rounded-2xl bg-purple-50/50 border border-purple-100 animate-in fade-in-50">
                <label className="font-bold text-purple-950 block">Override Classification Verdict:</label>
                <select
                  value={overrideClassification}
                  onChange={(e) => setOverrideClassification(e.target.value as Classification)}
                  className="w-full h-10 px-3 rounded-xl border border-purple-200 bg-white font-bold text-purple-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="VERIFIED">VERIFIED (High Credibility)</option>
                  <option value="TRUSTED">TRUSTED (Credible with Context)</option>
                  <option value="SUSPICIOUS">SUSPICIOUS (Requires Caution)</option>
                  <option value="FAKE">FAKE (Disproven / Hoax)</option>
                </select>
              </div>
            )}

            {/* Justification Notes */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>Administrative Justification & Verification Notes:</span>
                <span className="text-slate-400 font-normal text-[11px]">(Required)</span>
              </label>
              <textarea
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Explain the corroborating sources, official press statements, or factual reasons justifying this adjudication..."
                className="w-full p-3 rounded-2xl border border-slate-200 text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Action Submission Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link to="/admin/reviews">
              <Button variant="secondary" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={() => handleSubmitAdjudication(selectedDecision)}
            >
              Submit Official Adjudication
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
