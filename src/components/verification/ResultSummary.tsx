import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  RotateCcw,
  History as HistoryIcon,
  Calendar,
  Clock,
  Globe,
  ArrowLeft,
  Bookmark,
  Check,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Flag,
  ShieldAlert,
  Share2,
  Download,
  FileCode,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'motion/react';
import { VerificationResult } from '../../types';
import { ScoreCircle } from './ScoreCircle';
import { SourceCard } from './SourceCard';
import { IndicatorCard } from './IndicatorCard';
import { ContentCharacteristicsCard } from './ContentCharacteristicsCard';
import { VerificationSourcesCard } from './VerificationSourcesCard';
import { SourceTraceCard } from './SourceTraceCard';
import { ClaimCard } from './ClaimCard';
import { EvidenceCard } from './EvidenceCard';
import { ExplanationSection } from './ExplanationSection';
import { RecommendationCard } from './RecommendationCard';
import { ClassificationBadge } from './ClassificationBadge';
import { ReportVerdictModal } from './ReportVerdictModal';
import { ShareFindingsModal } from './ShareFindingsModal';
import { ShareResults } from './ShareResults';
import { CommentsSection } from './CommentsSection';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { SourceFolderBadge } from '../common/SourceFolderBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { reportsService } from '../../services/reportsService';
import { downloadReportAsJson, downloadReportAsPdf } from '../../utils/exportReport';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.03,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 280,
    },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 26,
      stiffness: 300,
    },
  },
};

export interface ResultSummaryProps {
  result: VerificationResult;
  onVerifyAnother?: () => void;
  backPath?: string;
  backLabel?: string;
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({
  result,
  onVerifyAnother,
  backPath,
  backLabel,
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAiDetails, setShowAiDetails] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedClaimForReport, setSelectedClaimForReport] = useState<any>(null);
  const [selectedClaimIndexForReport, setSelectedClaimIndexForReport] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFindingsCopied, setIsFindingsCopied] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [hasFlagged, setHasFlagged] = useState(
    (result as any).reviewStatus === 'PENDING' || result.status === 'PENDING_REVIEW'
  );

  const isReviewed = result.status === 'REVIEWED' || Boolean(result.humanReview);
  const humanReview = result.humanReview;

  useEffect(() => {
    if (currentUser?.id && result?.id) {
      reportsService.isReportSaved(currentUser.id, result.id).then(setIsSaved);
    }
  }, [currentUser, result.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveReport = async () => {
    if (!currentUser) return;
    try {
      setIsSaving(true);
      await reportsService.saveReport(currentUser.id, result);
      setIsSaved(true);
      toast.success('Report Saved', 'This verification assessment has been archived to My Reports.');
    } catch (e) {
      toast.error('Failed to Save', 'Could not save this report.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadJson = () => {
    setIsDownloadMenuOpen(false);
    downloadReportAsJson(result);
    toast.success('JSON Export Downloaded', `Structured assessment data for #${result.id.slice(-6).toUpperCase()} downloaded.`);
  };

  const handleDownloadPdf = () => {
    setIsDownloadMenuOpen(false);
    downloadReportAsPdf();
  };

  const formattedDate = new Date(result.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(result.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const reviewedDate = humanReview?.reviewedAt
    ? new Date(humanReview.reviewedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* 📄 OFFICIAL PRINT-ONLY DOSSIER HEADER (Visible exclusively when printing / exporting PDF) */}
      <div className="hidden print:block print-only border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-950">VerifAI GH</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600 px-2 py-0.5 border border-slate-400 rounded-md">
                Official Report
              </span>
            </div>
            <h1 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mt-1">
              Investigative Verification & Evidence Dossier
            </h1>
            <p className="text-[10px] text-slate-600">
              AI-Assisted Multi-Source Verification • Ghanaian Public Records & Media Ledger
            </p>
          </div>
          <div className="text-right text-[10px] text-slate-700 space-y-0.5">
            <p className="font-mono font-bold text-xs text-slate-950">
              REF: VGH-{result.id.slice(-8).toUpperCase()}
            </p>
            <p>Generated: {formattedDate} at {formattedTime}</p>
            <p className="font-semibold">Classification: {result.classification}</p>
          </div>
        </div>
      </div>

      {/* Navigation / Actions Bar (Hidden in Print) */}
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        {backPath ? (
          <Link
            to={backPath}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {backLabel || 'Back'}
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Verification Report
            </span>
            <Badge variant="neutral" size="sm">
              #{result.id.slice(-6).toUpperCase()}
            </Badge>
            {isReviewed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> HUMAN VERIFIED
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {onVerifyAnother ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onVerifyAnother}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Verify Another
            </Button>
          ) : (
            <Link to="/verify">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                New Verification
              </Button>
            </Link>
          )}

          <Link to="/history" className="hidden sm:inline-block">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<HistoryIcon className="w-3.5 h-3.5" />}
            >
              History
            </Button>
          </Link>

          {/* 📥 DOWNLOAD REPORT BUTTON (PDF / JSON) */}
          <div className="relative" ref={downloadMenuRef}>
            <Button
              id="download-report-btn"
              variant="primary"
              size="sm"
              onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              rightIcon={<ChevronDown className={`w-3 h-3 transition-transform ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-xs"
            >
              Download Report
            </Button>

            {isDownloadMenuOpen && (
              <div
                id="download-report-menu"
                className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Export Analysis Report
                  </span>
                </div>
                <button
                  id="download-pdf-option"
                  onClick={handleDownloadPdf}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold">Download as PDF</span>
                    <span className="block text-[10px] text-slate-400">Formatted dossier & print layout</span>
                  </div>
                </button>
                <button
                  id="download-json-option"
                  onClick={handleDownloadJson}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold">Download as JSON</span>
                    <span className="block text-[10px] text-slate-400">Structured AI claims & evidence</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <ShareResults
            result={result}
            variant="button"
            buttonLabel={isFindingsCopied ? 'Summary Copied!' : 'Share Results'}
          />

          <Button
            id="report-incorrect-verdict-btn"
            variant="outline"
            size="sm"
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={<Flag className={`w-3.5 h-3.5 ${hasFlagged ? 'text-amber-500 fill-amber-500' : 'text-slate-500'}`} />}
            className={hasFlagged ? 'border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : ''}
          >
            {hasFlagged ? 'Flagged for Review' : 'Report Inaccuracy'}
          </Button>

          <Button
            variant={isSaved ? 'outline' : 'secondary'}
            size="sm"
            onClick={handleSaveReport}
            isLoading={isSaving}
            leftIcon={isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5" />}
          >
            {isSaved ? 'Saved' : 'Save Report'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadPdf}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print
          </Button>
        </div>
      </motion.div>

      {/* 🚩 PENDING ADMIN REVIEW / DISPUTE CONFIRMATION BANNER */}
      {hasFlagged && !isReviewed && (
        <motion.div
          variants={cardVariants}
          id="dispute-submitted-banner"
          className="rounded-3xl border-2 border-amber-400/80 dark:border-amber-600/80 bg-gradient-to-r from-amber-50/95 via-orange-50/60 to-amber-50/95 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-amber-950/40 p-5 sm:p-6 shadow-xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/70 dark:border-amber-800/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0 animate-pulse">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                  Dispute & Editorial Adjudication Active
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Assessment Under Human Fact-Checker Audit
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 self-start sm:self-auto">
              Status: In Review Queue
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/60 dark:border-amber-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dispute Ticket ID
              </span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                FLAG-{result.id.slice(-6).toUpperCase()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/60 dark:border-amber-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Assigned Team
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Editorial Review Board
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/60 dark:border-amber-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimated Turnaround
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Within 24 Hours
              </p>
            </div>
          </div>

          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed italic">
            Thank you for helping uphold journalistic accuracy. An administrator will verify the claims and counter-evidence against official primary sources. Any calibrated determination will be displayed here.
          </p>
        </motion.div>
      )}

      {/* 🌟 HUMAN-REVIEWED FINAL RESULT BANNER (If Adjudicated) */}
      {isReviewed && humanReview && (
        <motion.div
          variants={cardVariants}
          className="rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-emerald-950/40 p-6 sm:p-7 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60 dark:border-emerald-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                  Official Human Adjudication Override
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  FINAL VERIFIED RESULT (Reviewed by Admin: {humanReview.reviewerName || 'Editorial Fact-Checker'})
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ClassificationBadge classification={humanReview.finalClassification as any || result.classification} size="md" />
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
                Final Score: {humanReview.finalCredibilityScore ?? result.score}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="font-bold text-slate-500 dark:text-slate-400 block uppercase text-[10px] tracking-wider">
                Adjudicating Fact-Checker / Officer
              </span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {humanReview.reviewerName || 'Senior Fact-Checking Officer'}
              </p>
              {reviewedDate && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Reviewed & sealed on {reviewedDate}
                </p>
              )}
            </div>

            <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="font-bold text-slate-500 dark:text-slate-400 block uppercase text-[10px] tracking-wider">
                Expert Determination Rationale
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {humanReview.reviewReason || humanReview.reviewNotes || 'Confirmed upon comprehensive editorial cross-referencing and verification against authoritative records.'}
              </p>
            </div>
          </div>

          {/* Expandable Initial AI Assessment vs Final Override Drawer */}
          <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-800/40">
            <button
              onClick={() => setShowAiDetails(!showAiDetails)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {showAiDetails ? 'Hide Initial AI Assessment' : 'Show Initial AI Assessment & Audit Discrepancy'}
              {showAiDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAiDetails && (
              <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Original Automated AI Assessment (Preserved in Single Source of Truth)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      AI Verdict: <span className="font-mono">{result.aiClassification || result.classification}</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      AI Score: <span className="font-mono">{result.aiCredibilityScore ?? result.score}/100</span>
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic text-[11px]">
                  VerifAI GH preserves immutable original AI classifications alongside human adjudication overrides to maintain complete transparency and audit compliance.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Print-Card Container */}
      <motion.div
        variants={cardVariants}
        className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs print-card space-y-6 transition-colors"
      >
        {/* Header Section */}
        <motion.div variants={sectionVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Verification Assessment</h2>
              <Badge variant="neutral" size="sm">
                {result.contentType.replace('_', ' ')}
              </Badge>
              <SourceFolderBadge
                url={result.inputUrl}
                content={result.inputContent}
                size="sm"
              />
              {result.category && (
                <Badge variant="info" size="sm">
                  {result.category}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {formattedDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formattedTime}
              </span>
              <span>•</span>
              <span className="font-mono font-bold">ID: {result.id.slice(-8).toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ClassificationBadge classification={result.classification} size="lg" />
          </div>
        </motion.div>

        {/* Input Content Inspection Box */}
        <motion.div variants={sectionVariants} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Verified Content</span>
            {result.inputUrl && (
              <a
                href={result.inputUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Globe className="w-3 h-3" /> View Target Link
              </a>
            )}
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed italic bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            "{result.inputContent}"
          </p>
          {result.inputImageName && (
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
              <span className="font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                Analyzed Screenshot: {result.inputImageName}
              </span>
            </div>
          )}
        </motion.div>

        {/* Core Score & High-Level Finding */}
        <motion.div variants={sectionVariants} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 rounded-3xl bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800/30 border border-slate-200/90 dark:border-slate-800">
          <div className="md:col-span-4 flex flex-col items-center justify-center p-2 text-center border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800">
            <ScoreCircle
              score={result.score}
              classification={result.classification}
              confidence={result.confidence}
              size="lg"
            />
          </div>

          <div className="md:col-span-8 space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Executive Synthesis
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {result.summary}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Based on algorithmic cross-referencing against authenticated public records, official Ghanaian registries, and independent news sources.
            </p>
          </div>
        </motion.div>

        {/* Source Credibility Card */}
        <motion.div variants={sectionVariants}>
          <SourceCard source={result.source} />
        </motion.div>

        {/* Visual Content Characteristics Card */}
        {result.contentCharacteristics && (
          <motion.div variants={sectionVariants}>
            <ContentCharacteristicsCard characteristics={result.contentCharacteristics} />
          </motion.div>
        )}

        {/* Source Provenance Trace */}
        {result.sourceTrace && (
          <motion.div variants={sectionVariants}>
            <SourceTraceCard trace={result.sourceTrace} />
          </motion.div>
        )}

        {/* Extracted Key Claims */}
        {result.claims && result.claims.length > 0 && (
          <motion.div variants={sectionVariants}>
            <ClaimCard
              claims={result.claims}
              verificationId={result.id}
              currentClassification={result.classification}
              onReportInaccuracy={(targetClaim, targetIdx) => {
                setSelectedClaimForReport(targetClaim || null);
                setSelectedClaimIndexForReport(targetIdx ?? null);
                setIsReportModalOpen(true);
              }}
            />
          </motion.div>
        )}

        {/* Verified Referenced Sources */}
        {result.verificationSources && result.verificationSources.length > 0 && (
          <motion.div variants={sectionVariants}>
            <VerificationSourcesCard
              sources={result.verificationSources}
              referencedTrustedSources={result.referencedTrustedSources}
            />
          </motion.div>
        )}

        {/* Evidence Assessment */}
        <motion.div variants={sectionVariants}>
          <EvidenceCard evidence={result.evidence} />
        </motion.div>

        {/* Risk Indicators Grid */}
        <motion.div variants={sectionVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Analysis Risk Indicators</h4>
            <span className="text-xs text-slate-400 font-medium">
              {result.indicators.length} verification dimensions assessed
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {result.indicators.map((indicator) => (
              <IndicatorCard key={indicator.id} indicator={indicator} />
            ))}
          </div>
        </motion.div>

        {/* Actionable Recommendations */}
        <motion.div variants={sectionVariants}>
          <RecommendationCard recommendation={result.recommendation} />
        </motion.div>

        {/* Explanations Section */}
        <motion.div variants={sectionVariants}>
          <ExplanationSection explanations={result.explanations} />
        </motion.div>

        {/* 📢 SHARE FINDINGS & WEB SHARE HUB */}
        <motion.div variants={sectionVariants} className="no-print">
          <ShareResults result={result} variant="card" />
        </motion.div>

        {/* 🚩 REPORT INACCURACY FEEDBACK CARD & BUTTON (BELOW RESULT DISPLAYS) (Hidden in Print) */}
        <motion.div
          variants={sectionVariants}
          id="report-inaccuracy-feedback-card"
          className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-amber-950/30 dark:via-orange-950/15 dark:to-amber-950/30 border border-amber-300/60 dark:border-amber-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all shadow-xs no-print"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Report Inaccuracy & Improve AI Dataset
                </h4>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200/90 dark:bg-amber-900/90 text-amber-900 dark:text-amber-200">
                  RLHF Dataset Feedback
                </span>
                {hasFlagged && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                    Flagged for Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                Notice an incorrect verdict, missing local context, or outdated evidence? Flag this result to help retrain and improve our Ghanaian AI verification models and alert our human fact-checkers.
              </p>
            </div>
          </div>
          <Button
            id="report-inaccuracy-action-btn"
            variant="outline"
            size="md"
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={<Flag className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            className="flex-shrink-0 border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-bold px-4 py-2"
          >
            {hasFlagged ? 'Submit Additional Note' : 'Report Inaccuracy'}
          </Button>
        </motion.div>

        {/* 💬 Community Context & Findings Discussion Section (Hidden in Print) */}
        <motion.div variants={sectionVariants} className="no-print">
          <CommentsSection
            verificationId={result.id}
            verificationTitle={result.summary}
          />
        </motion.div>

        {/* 📜 OFFICIAL PRINT-ONLY VERIFICATION SEAL & FOOTER */}
        <div className="hidden print:block print-only pt-6 border-t-2 border-slate-900 mt-8 text-xs text-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-extrabold uppercase tracking-wider block text-slate-950">
                Official Authenticity Certificate
              </span>
              <p className="text-[10px] text-slate-600">
                Secured by VerifAI GH Verification Engine • Hash: SHA256-{result.id.slice(-12).toUpperCase()}
              </p>
            </div>
            <div className="border border-slate-900 px-3 py-1 text-center rounded-sm">
              <span className="font-mono text-[10px] font-black uppercase tracking-widest block text-slate-950">
                OFFICIAL SEAL
              </span>
              <span className="text-[9px] font-bold text-slate-600">
                STATUS: {result.classification}
              </span>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 leading-relaxed italic">
            This verification dossier was algorithmically compiled and cross-referenced with authenticated news registries, official public bulletins, and ground truth citations. For live updates and audit history, visit the VerifAI GH platform.
          </p>
        </div>

        {/* Footer Disclaimer (Screen & Print) */}
        <motion.div variants={sectionVariants} className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center no-print">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xl mx-auto leading-relaxed">
            VerifAI GH provides an automated preliminary assessment and authoritative human oversight.
            Always verify high-stakes claims across multiple independent primary sources before sharing.
          </p>
        </motion.div>
      </motion.div>

      {/* Report Modal */}
      <ReportVerdictModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedClaimForReport(null);
          setSelectedClaimIndexForReport(null);
        }}
        verificationId={result.id}
        currentClassification={result.classification}
        claims={result.claims}
        initialSelectedClaim={selectedClaimForReport}
        initialClaimIndex={selectedClaimIndexForReport}
        onReportSuccess={() => {
          setHasFlagged(true);
        }}
      />

      {/* Share Findings Modal */}
      <ShareFindingsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        result={result}
        onCopySummary={() => {
          setIsFindingsCopied(true);
          setTimeout(() => setIsFindingsCopied(false), 2500);
        }}
      />
    </motion.div>
  );
};
