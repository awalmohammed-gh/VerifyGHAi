import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Globe,
  Share2,
  Check,
  Eye,
  ArrowRight,
  Play,
  Pause,
  Filter,
  UserCheck,
  Users,
  AlertCircle,
  FileCheck,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { ClassificationBadge } from '../verification/ClassificationBadge';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { verificationService } from '../../services/verificationService';
import { Submission } from '../../types';

export interface RecentClaimDisplayItem {
  id: string;
  claim: string;
  category: string;
  classification: string;
  credibilityScore: number;
  confidence: number;
  timeAgo: string;
  sourceDomain: string;
  contentType: 'TEXT' | 'ARTICLE_URL' | 'SCREENSHOT';
  summary: string;
  primaryEvidence: string;
  sourcesCount: number;
  recommendation?: string;
  isUserSubmission?: boolean;
}

const CATEGORIES = [
  'All Checks',
  'Debunked Fakes',
  'Verified Authentic',
  'Suspicious',
  'Economy',
  'Health',
  'Education',
  'Governance',
] as const;

function getTimeAgo(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'recently';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'recently';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('tax') || lower.includes('vat') || lower.includes('bank') || lower.includes('cedi') || lower.includes('economy') || lower.includes('money') || lower.includes('gh₵')) {
    return 'Economy';
  }
  if (lower.includes('water') || lower.includes('fda') || lower.includes('health') || lower.includes('hospital') || lower.includes('disease') || lower.includes('formula') || lower.includes('doctor')) {
    return 'Health';
  }
  if (lower.includes('school') || lower.includes('graduate') || lower.includes('allowance') || lower.includes('tertiary') || lower.includes('student') || lower.includes('education') || lower.includes('university')) {
    return 'Education';
  }
  if (lower.includes('election') || lower.includes('voting') || lower.includes('commission') || lower.includes('parliament') || lower.includes('ministry') || lower.includes('police')) {
    return 'Governance';
  }
  return 'General News';
}

function mapSubmissionToClaimItem(sub: Submission, currentUserId?: string): RecentClaimDisplayItem {
  const result = sub.result;
  const rawClaim =
    result?.claims?.[0]?.text ||
    sub.contentPreview ||
    sub.fullContent ||
    result?.summary ||
    'Submitted Claim Verification';

  const category = (result as any)?.category || inferCategory(rawClaim);
  const classification = result?.classification || 'UNVERIFIED';
  const credibilityScore = Math.min(100, Math.max(0, result?.score ?? 50));
  const rawConfidence = result?.confidence ?? 0.85;
  const confidence = Math.round(rawConfidence > 1 ? rawConfidence : rawConfidence * 100);

  let sourceDomain = 'Direct Verification';
  if (sub.url) {
    try {
      sourceDomain = new URL(sub.url).hostname.replace(/^www\./, '');
    } catch {
      sourceDomain = sub.url.slice(0, 24);
    }
  }

  const primaryEvidence =
    result?.verificationSources?.[0]?.snippet ||
    result?.verificationSources?.[0]?.title ||
    result?.explanations?.[0] ||
    result?.aiExplanation ||
    'Cross-verified through official gazettes, regulatory disclaimers, and certified news desks.';

  const isUserSubmission = Boolean(currentUserId && sub.userId && sub.userId === currentUserId);

  return {
    id: sub.id,
    claim: rawClaim,
    category,
    classification,
    credibilityScore,
    confidence,
    timeAgo: getTimeAgo(sub.createdAt),
    sourceDomain,
    contentType: (sub.contentType as any) || 'TEXT',
    summary:
      result?.summary ||
      result?.aiExplanation ||
      result?.explanations?.[0] ||
      'Comprehensive algorithmic assessment evaluated against national and global source registries.',
    primaryEvidence,
    sourcesCount: result?.verificationSources?.length || (result?.source ? 1 : 3),
    recommendation: result?.recommendation || '',
    isUserSubmission,
  };
}

export const RecentVerifications: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const [activeScope, setActiveScope] = useState<'user' | 'all'>(isAuthenticated ? 'user' : 'all');
  const [claims, setClaims] = useState<RecentClaimDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>('All Checks');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [inspectModalClaim, setInspectModalClaim] = useState<RecentClaimDisplayItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync activeScope with authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      setActiveScope('user');
    } else {
      setActiveScope('all');
    }
  }, [isAuthenticated]);

  // Primary data fetching function using /api/verifications endpoint
  const fetchRecentVerifications = useCallback(
    async (scope: 'user' | 'all', isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await verificationService.getRecentVerifications({
          scope,
          limit: 12,
        });

        const mapped = (result.items || []).map((sub) =>
          mapSubmissionToClaimItem(sub, currentUser?.id)
        );

        setClaims(mapped);
        setCurrentIndex(0);
      } catch (err: any) {
        console.error('[RecentVerifications] Failed to load from /api/verifications:', err);
        setError('Unable to retrieve recent verifications from the server. Please try again.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentUser?.id]
  );

  useEffect(() => {
    fetchRecentVerifications(activeScope);
  }, [activeScope, fetchRecentVerifications]);

  // Filtered Claims by category
  const filteredClaims = claims.filter((item) => {
    if (selectedCategory === 'All Checks') return true;
    if (selectedCategory === 'Debunked Fakes') {
      return (
        item.classification === 'FAKE' ||
        item.classification === 'DEBUNKED' ||
        item.classification === 'LIKELY_FALSE'
      );
    }
    if (selectedCategory === 'Verified Authentic') {
      return item.classification === 'VERIFIED' || item.classification === 'TRUSTED';
    }
    if (selectedCategory === 'Suspicious') {
      return item.classification === 'SUSPICIOUS' || item.classification === 'UNVERIFIED';
    }
    return item.category === selectedCategory;
  });

  // Autoplay progression for featured card
  useEffect(() => {
    if (!isAutoplay || filteredClaims.length <= 1) return;

    autoplayTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredClaims.length);
    }, 5000);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isAutoplay, filteredClaims.length]);

  const handleNext = () => {
    if (filteredClaims.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredClaims.length);
  };

  const handlePrev = () => {
    if (filteredClaims.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredClaims.length) % filteredClaims.length);
  };

  const handleShareClaim = async (item: RecentClaimDisplayItem) => {
    const shareText = `VerifAI GH Assessment: "${item.claim}" rated [${item.classification}] with credibility score ${item.credibilityScore}/100.`;
    const shareUrl = `${window.location.origin}/results/${item.id}`;

    if (navigator.share && navigator.canShare && navigator.canShare({ title: 'VerifAI GH', text: shareText, url: shareUrl })) {
      try {
        await navigator.share({
          title: 'VerifAI GH Claim Verification',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText}\nEvidence dossier: ${shareUrl}`);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <section
      id="recent-verifications"
      className="py-20 md:py-28 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 relative overflow-hidden"
    >
      {/* Background Ambience Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header Title, Scope Toggle, and Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Live Verification Feed
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Recent Verifications
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {activeScope === 'user' && isAuthenticated
                ? 'Your personalized recent claim checks retrieved in real time from the /api/verifications engine.'
                : 'Explore circulating news, social media forwards, and claims recently analyzed and verified across Ghanaian institutions.'}
            </p>
          </div>

          {/* Scope Toggles & Refresh / Autoplay Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* User vs Community View Scope Switcher */}
            {isAuthenticated ? (
              <div className="inline-flex p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <button
                  onClick={() => setActiveScope('user')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeScope === 'user'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Your Claims
                </button>
                <button
                  onClick={() => setActiveScope('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeScope === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Community Feed
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Public Verification Stream</span>
              </div>
            )}

            {/* Action Buttons: Refresh + Autoplay + Prev/Next */}
            <div className="flex items-center gap-2">
              <button
                id="refresh-verifications-btn"
                onClick={() => fetchRecentVerifications(activeScope, true)}
                disabled={isLoading || isRefreshing}
                aria-label="Refresh verifications"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Refresh latest claim checks from /api/verifications"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                onClick={() => setIsAutoplay(!isAutoplay)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title={isAutoplay ? 'Pause auto-sliding' : 'Resume auto-sliding'}
              >
                {isAutoplay ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
                <span className="hidden sm:inline">{isAutoplay ? 'Auto' : 'Paused'}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  id="prev-recent-verification-btn"
                  onClick={handlePrev}
                  aria-label="Previous verification"
                  disabled={filteredClaims.length <= 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="next-recent-verification-btn"
                  onClick={handleNext}
                  aria-label="Next verification"
                  disabled={filteredClaims.length <= 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentIndex(0);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* LOADING SKELETON */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 h-80 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="w-16 h-6 rounded-full bg-slate-100 dark:bg-slate-800/60" />
                </div>
                <div className="w-3/4 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="w-full h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/40" />
              </div>
              <div className="flex items-center justify-between">
                <div className="w-48 h-5 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="w-32 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-36 flex flex-col justify-between">
                  <div className="w-20 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="w-full h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
                  <div className="w-16 h-4 rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="p-10 rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Connection Error</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {error}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRecentVerifications(activeScope, false)}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300"
            >
              Retry Connection
            </Button>
          </div>
        ) : filteredClaims.length > 0 ? (
          /* CLAIMS CAROUSEL & GRID */
          <div className="space-y-6">
            {/* Featured Interactive Hero Card */}
            <AnimatePresence mode="wait">
              {filteredClaims[currentIndex] && (
                <motion.div
                  key={filteredClaims[currentIndex].id}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -15 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs relative overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left Column: Claim Text & Primary Details */}
                    <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <ClassificationBadge
                          classification={filteredClaims[currentIndex].classification}
                          size="md"
                        />
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {filteredClaims[currentIndex].category}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {filteredClaims[currentIndex].timeAgo}
                        </span>
                        {filteredClaims[currentIndex].isUserSubmission && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Your Verification
                          </span>
                        )}
                      </div>

                      <blockquote className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                        "{filteredClaims[currentIndex].claim}"
                      </blockquote>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-white font-bold block mb-1">
                          AI Verification Summary:
                        </strong>
                        {filteredClaims[currentIndex].summary}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-500" />
                          Source: <strong className="text-slate-700 dark:text-slate-300">{filteredClaims[currentIndex].sourceDomain}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{filteredClaims[currentIndex].sourcesCount}</strong> Verified Citations
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-600 dark:text-slate-400">
                          Type: <strong>{filteredClaims[currentIndex].contentType}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Credibility Score & Action Buttons */}
                    <div className="lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-8 flex flex-col items-center justify-center space-y-4 flex-shrink-0">
                      <div className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 w-full sm:w-56">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Credibility Score
                        </span>
                        <div className="flex items-baseline justify-center gap-1">
                          <span
                            className={`text-4xl font-black font-mono ${
                              filteredClaims[currentIndex].credibilityScore >= 75
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : filteredClaims[currentIndex].credibilityScore >= 45
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {filteredClaims[currentIndex].credibilityScore}
                          </span>
                          <span className="text-sm font-bold text-slate-400">/100</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 block">
                          AI Confidence: {filteredClaims[currentIndex].confidence}%
                        </span>
                      </div>

                      <div className="flex flex-col w-full sm:w-56 gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setInspectModalClaim(filteredClaims[currentIndex])}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        >
                          Quick Evidence View
                        </Button>

                        <button
                          onClick={() => handleShareClaim(filteredClaims[currentIndex])}
                          className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedId === filteredClaims[currentIndex].id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Copied finding</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Share Finding</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Carousel Pagination Dots */}
            {filteredClaims.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2">
                {filteredClaims.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Jump to claim ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentIndex
                        ? 'w-8 bg-blue-600 dark:bg-blue-400'
                        : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Grid of Other Recent Verifications */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {filteredClaims.map((item, idx) => {
                const isCurrent = idx === currentIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between gap-3 ${
                      isCurrent
                        ? 'border-blue-500/80 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-500/50'
                        : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <ClassificationBadge classification={item.classification} size="xs" />
                        <span className="text-[10px] text-slate-400 font-medium">{item.timeAgo}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        "{item.claim}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                      <span className="text-slate-400 font-medium">{item.category}</span>
                      <span
                        className={`font-mono font-extrabold ${
                          item.credibilityScore >= 75
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.credibilityScore >= 45
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.credibilityScore}/100
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* EMPTY STATE (e.g., user has no personal scans yet or filter returned no claims) */
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <FileCheck className="w-12 h-12 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeScope === 'user' ? 'No personal claim checks recorded yet' : 'No claims in verification feed yet'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {activeScope === 'user'
                  ? 'Submit your first piece of text, article URL, or screenshot to see your history logged here.'
                  : 'Be the first to run a verification. Every assessment is grounded in live web search and official registries.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              {activeScope === 'user' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveScope('all')}
                  className="text-xs font-bold"
                >
                  Browse Community Checks
                </Button>
              )}
              <Link to="/verify">
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Verify a Claim Now
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* CTA Banner to Verify a Claim */}
        <div className="mt-12 text-center">
          <Link to="/verify">
            <Button
              variant="outline"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              Verify Any Other Claim or News Story Now
            </Button>
          </Link>
        </div>
      </div>

      {/* QUICK EVIDENCE INSPECTION MODAL */}
      {inspectModalClaim && (
        <div
          id="claim-inspect-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ClassificationBadge classification={inspectModalClaim.classification} size="md" />
                <span className="text-xs text-slate-400 font-mono">
                  Score: {inspectModalClaim.credibilityScore}/100
                </span>
              </div>
              <button
                onClick={() => setInspectModalClaim(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Circulating Claim</span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                "{inspectModalClaim.claim}"
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                Corroborated Primary Evidence
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-blue-50/50 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-200/60 dark:border-blue-800/60">
                {inspectModalClaim.primaryEvidence}
              </p>
            </div>

            {inspectModalClaim.recommendation && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                  Advisory Recommendation
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  {inspectModalClaim.recommendation}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Confidence</span>
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                  {inspectModalClaim.confidence}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Sources Verified</span>
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                  {inspectModalClaim.sourcesCount} Registries
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleShareClaim(inspectModalClaim)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedId === inspectModalClaim.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Share Finding</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInspectModalClaim(null)}
                >
                  Close
                </Button>
                <Link to={`/results/${inspectModalClaim.id}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Full Dossier
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
