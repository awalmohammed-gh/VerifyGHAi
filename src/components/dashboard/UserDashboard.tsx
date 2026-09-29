import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Plus,
  RefreshCw,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  BarChart3,
  Globe,
  Image as ImageIcon,
  MessageSquare,
  ChevronRight,
  Info,
  Layers,
  FileBarChart,
  Command,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userStatisticsService, UserReportItem } from '../../services/userStatisticsService';
import { recentSearchesService, RecentSearchQuery } from '../../services/recentSearchesService';
import { UserApiStatistics, UserActivityRecord } from '../../types';
import { StatCard } from './StatCard';
import { QuickActionsBar } from './QuickActionsBar';
import { RecentSearchesDropdown } from './RecentSearchesDropdown';
import { VerificationTrendsChart } from './VerificationTrendsChart';
import { TrustScoreTrendCard } from './TrustScoreTrendCard';
import { RecentScansList } from './RecentScansList';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { CredibilityBadge } from '../common/CredibilityBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { UserDashboardSkeleton } from '../common/Skeleton';

export interface UserDashboardProps {
  className?: string;
  onVerifyClick?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ className = '', onVerifyClick }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [statistics, setStatistics] = useState<UserApiStatistics | null>(null);
  const [reports, setReports] = useState<UserReportItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchQuery[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'REPORTS' | 'VERIFICATIONS' | 'FLAGGED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await userStatisticsService.getUserDashboardData();
      setStatistics(data.statistics);
      setReports(data.reports || []);
      const searches = recentSearchesService.getRecentSearches(currentUser?.id, 6);
      setRecentSearches(searches);
    } catch (err: any) {
      console.error('[UserDashboard] Error loading statistics:', err);
      setError(err?.response?.data?.message || 'Failed to sync latest user statistics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle classification colors and badge mapping
  const getClassificationBadge = (classification: string) => {
    switch (classification?.toUpperCase()) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> VERIFIED
          </span>
        );
      case 'TRUSTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3 h-3" /> TRUSTED
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> SUSPICIOUS
          </span>
        );
      case 'FAKE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> FAKE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Info className="w-3 h-3" /> UNVERIFIED
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'ARTICLE_URL':
      case 'URL':
        return <Globe className="w-4 h-4 text-emerald-600" />;
      case 'SCREENSHOT':
      case 'IMAGE':
        return <ImageIcon className="w-4 h-4 text-purple-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatRelativeTime = (dateInput: string | Date | undefined) => {
    if (!dateInput) return 'Recently';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <UserDashboardSkeleton />;
  }

  const totalVerifications = statistics?.totalVerifications || 0;
  const verifiedCount = statistics?.verified || 0;
  const trustedCount = statistics?.trusted || 0;
  const suspiciousCount = statistics?.suspicious || 0;
  const fakeCount = statistics?.fake || 0;
  const unverifiedCount = statistics?.unverified || 0;
  const avgScore = statistics?.averageCredibilityScore || 0;

  // Compute percentage shares
  const verifiedShare = totalVerifications > 0 ? Math.round(((verifiedCount + trustedCount) / totalVerifications) * 100) : 0;
  const flaggedShare = totalVerifications > 0 ? Math.round(((suspiciousCount + fakeCount) / totalVerifications) * 100) : 0;

  // Unified activity list combining reports and recent verifications
  const combinedActivities: Array<{
    id: string;
    itemType: 'REPORT' | 'VERIFICATION';
    title: string;
    classification: string;
    score: number;
    createdAt: string | Date;
    link: string;
    detail?: string;
  }> = [
    ...reports.map((rep) => ({
      id: rep.id,
      itemType: 'REPORT' as const,
      title: rep.title || 'Verification Dossier Report',
      classification: rep.classification || 'VERIFIED',
      score: rep.score || 85,
      createdAt: rep.createdAt,
      link: `/reports/${rep.id}`,
      detail: rep.summary || (rep.keyFindings && rep.keyFindings[0]) || 'Official compiled report dossier',
    })),
    ...(statistics?.recentActivity || []).map((act) => ({
      id: act.id,
      itemType: 'VERIFICATION' as const,
      title: act.title || 'Claim Check Submission',
      classification: act.classification || 'UNVERIFIED',
      score: act.credibilityScore || 50,
      createdAt: act.createdAt,
      link: `/dashboard/verify/result?id=${act.id}`,
      detail: `Submission type: ${act.type || 'Text'}`,
    })),
  ];

  // Sort combined activity by date descending
  combinedActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter activities
  const filteredActivities = combinedActivities.filter((act) => {
    if (activityFilter === 'REPORTS' && act.itemType !== 'REPORT') return false;
    if (activityFilter === 'VERIFICATIONS' && act.itemType !== 'VERIFICATION') return false;
    if (activityFilter === 'FLAGGED' && !['SUSPICIOUS', 'FAKE'].includes(act.classification.toUpperCase())) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        act.title.toLowerCase().includes(q) ||
        act.classification.toLowerCase().includes(q) ||
        (act.detail && act.detail.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div id="user-dashboard-root" className={`w-full space-y-6 text-left ${className}`}>
      {/* 1. Header & Live Synchronization Bar */}
      <div
        id="user-dashboard-header"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome, {currentUser?.name || 'Fact-Checker'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Workspace
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Monitor your personal verification analytics, credibility scores, and published reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            id="refresh-stats-btn"
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-200"
          >
            {isRefreshing ? 'Syncing...' : 'Sync Stats'}
          </Button>

          <Link to="/verify">
            <Button
              id="verify-new-content-btn"
              variant="primary"
              size="sm"
              onClick={onVerifyClick}
              leftIcon={<Plus className="w-4 h-4" />}
              className="text-xs font-bold shadow-xs"
            >
              Verify Content
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div
          id="user-dashboard-error-banner"
          className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            className="text-amber-800 font-bold hover:underline ml-3 flex-shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Quick Actions Launchpad */}
      <QuickActionsBar />

      {/* 3. Primary User Statistics KPI Grid */}
      <div id="user-stats-kpi-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Verifications"
          value={totalVerifications}
          subtitle="Checks performed to date"
          icon={FileCheck}
          variant="default"
          className="border-slate-200/90"
        />
        <StatCard
          title="Verified & Trusted"
          value={verifiedCount + trustedCount}
          subtitle={`${verifiedShare}% corroboration rate`}
          icon={CheckCircle2}
          variant="verified"
          className="border-emerald-200/80"
        />
        <StatCard
          title="Suspicious / Flagged"
          value={suspiciousCount}
          subtitle="Cautionary claims caught"
          icon={AlertTriangle}
          variant="suspicious"
          className="border-amber-200/80"
        />
        <StatCard
          title="Debunked / Fake"
          value={fakeCount}
          subtitle={`${flaggedShare}% misinformation caught`}
          icon={XCircle}
          variant="fake"
          className="border-rose-200/80"
        />
      </div>

      {/* 4. Secondary Analytics Row: Quality Metric & Distribution Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Average Credibility Score Card */}
        <div
          id="user-credibility-gauge-card"
          className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Average Credibility Score
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="text-4xl font-black text-slate-900 tracking-tight">{avgScore}</span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
            </div>

            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Weighted truthfulness index evaluated across evidence, source authority, and factual alignment.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Reliability Rating</span>
              <span
                className={`font-bold ${
                  avgScore >= 75
                    ? 'text-emerald-600'
                    : avgScore >= 50
                    ? 'text-blue-600'
                    : avgScore >= 30
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {avgScore >= 75
                  ? 'High Reliability'
                  : avgScore >= 50
                  ? 'Moderate Trust'
                  : avgScore >= 30
                  ? 'Caution Advised'
                  : 'Low Reliability'}
              </span>
            </div>
            {/* Progress track */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  avgScore >= 75
                    ? 'bg-emerald-500'
                    : avgScore >= 50
                    ? 'bg-blue-500'
                    : avgScore >= 30
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, avgScore))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Verification Classification Breakdown */}
        <div
          id="user-classification-breakdown-card"
          className="lg:col-span-2 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Verification Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribution of automated verdicts and evidence outcomes.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {totalVerifications} Total Checks
              </span>
            </div>

            {/* Visual multi-segmented bar */}
            <div className="w-full h-4 bg-slate-100 rounded-xl overflow-hidden flex my-4">
              {totalVerifications > 0 ? (
                <>
                  <div
                    title={`Verified: ${verifiedCount}`}
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${(verifiedCount / totalVerifications) * 100}%` }}
                  />
                  <div
                    title={`Trusted: ${trustedCount}`}
                    className="bg-blue-500 h-full transition-all"
                    style={{ width: `${(trustedCount / totalVerifications) * 100}%` }}
                  />
                  <div
                    title={`Suspicious: ${suspiciousCount}`}
                    className="bg-amber-500 h-full transition-all"
                    style={{ width: `${(suspiciousCount / totalVerifications) * 100}%` }}
                  />
                  <div
                    title={`Fake: ${fakeCount}`}
                    className="bg-rose-500 h-full transition-all"
                    style={{ width: `${(fakeCount / totalVerifications) * 100}%` }}
                  />
                  <div
                    title={`Unverified: ${unverifiedCount}`}
                    className="bg-slate-400 h-full transition-all"
                    style={{ width: `${(unverifiedCount / totalVerifications) * 100}%` }}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                  No verification history yet
                </div>
              )}
            </div>

            {/* Category pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-800 block">Verified</span>
                <span className="text-lg font-black text-emerald-900">{verifiedCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100">
                <span className="text-[11px] font-bold text-blue-800 block">Trusted</span>
                <span className="text-lg font-black text-blue-900">{trustedCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
                <span className="text-[11px] font-bold text-amber-800 block">Suspicious</span>
                <span className="text-lg font-black text-amber-900">{suspiciousCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100">
                <span className="text-[11px] font-bold text-rose-800 block">Fake / Refuted</span>
                <span className="text-lg font-black text-rose-900">{fakeCount}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Generated Dossier Reports:</span>
            <Link to="/reports" className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1">
              {reports.length} Saved Reports <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Recent Scans (Last 5 Verification Requests persisted in localStorage) */}
      <RecentScansList maxDisplay={5} />

      {/* 6. Trust Score Evolution & Trends Visualizations */}
      <TrustScoreTrendCard
        initialStatistics={statistics}
        onRefresh={() => fetchDashboardData(true)}
      />

      {/* 7. Verification Trends Visualization: Claims Processed & Confidence Metrics */}
      <VerificationTrendsChart onRefresh={() => fetchDashboardData(true)} />

      {/* 8. Recent Report & Verification Activity Section */}
      <div
        id="user-recent-activity-section"
        className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileBarChart className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Recent Reports & Activity
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed history of recent claims analyzed and generated verification dossiers.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl flex-wrap text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActivityFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activityFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({combinedActivities.length})
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter('REPORTS')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activityFilter === 'REPORTS'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reports ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter('VERIFICATIONS')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activityFilter === 'VERIFICATIONS'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verifications ({(statistics?.recentActivity || []).length})
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter('FLAGGED')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activityFilter === 'FLAGGED'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Flagged
            </button>
          </div>
        </div>

        {/* Activity Search Box & Quick Recent Searches Access */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length > 3) {
                    recentSearchesService.addSearchQuery(e.target.value.trim(), {
                      userId: currentUser?.id,
                      type: 'search',
                    });
                  }
                }}
                placeholder="Search report titles, claims, or classifications..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSearchModalOpen(true)}
              leftIcon={<Clock className="w-3.5 h-3.5 text-blue-600" />}
              className="text-xs font-bold border-slate-200 text-slate-700 hover:text-blue-600 whitespace-nowrap shadow-2xs"
            >
              <span className="hidden sm:inline">Recent Searches</span>
              <span className="sm:hidden">Searches</span>
            </Button>
          </div>

          {/* Recent Search Chips (if any available) */}
          {recentSearches.length > 0 && !searchQuery && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
                <Clock className="w-3 h-3" /> Recent:
              </span>
              {recentSearches.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.targetResultId) {
                      navigate(`/verify/result/${item.targetResultId}`);
                    } else {
                      setSearchQuery(item.query);
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100/80 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/60 hover:border-blue-200 transition-colors cursor-pointer max-w-[200px] truncate"
                  title={`Revisit: ${item.query}`}
                >
                  {item.query}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="text-[11px] font-bold text-blue-600 hover:underline pl-1 cursor-pointer"
              >
                View all...
              </button>
            </div>
          )}
        </div>

        {/* Activities List */}
        {filteredActivities.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredActivities.slice(0, 8).map((activity) => (
              <div
                key={`${activity.itemType}-${activity.id}`}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/70 p-2.5 rounded-2xl transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {activity.itemType === 'REPORT' ? (
                      <FileText className="w-4 h-4 text-indigo-600" />
                    ) : (
                      getTypeIcon('TEXT')
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {activity.title}
                      </span>
                      {activity.itemType === 'REPORT' && (
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          Report Dossier
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 font-normal">
                      {activity.detail}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatRelativeTime(activity.createdAt)}
                      </span>
                      <span>•</span>
                      <span>Score: <strong className="text-slate-700">{activity.score}%</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                  <CredibilityBadge status={activity.classification} score={activity.score} size="sm" />
                  <Link to={activity.link}>
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                      className="text-xs font-semibold text-slate-600 hover:text-blue-600"
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-slate-900">No report activity found</h4>
              <p className="text-xs text-slate-500">
                {searchQuery
                  ? 'No verifications match your query. Try clearing your search filter.'
                  : 'Start by submitting text, links, or screenshots to generate your first verification dossier.'}
              </p>
            </div>
            <Link to="/verify">
              <Button variant="primary" size="sm" className="font-bold text-xs mt-2">
                Perform Verification
              </Button>
            </Link>
          </div>
        )}

        {combinedActivities.length > 8 && (
          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              to="/history"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              View complete verification history ({combinedActivities.length} total)
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Dashboard Recent Searches & Verification Revisit Modal */}
      <RecentSearchesDropdown
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  );
};

export default UserDashboard;
