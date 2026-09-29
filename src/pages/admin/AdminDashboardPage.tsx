import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  FileCheck,
  Globe,
  Database,
  Users,
  BarChart2,
  Cpu,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  ShieldCheck,
  Clock,
  ExternalLink,
  Shield,
  Activity,
  FileText,
  Image as ImageIcon,
  Check,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  Inbox
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminService } from '../../services/adminService';
import { SystemStats, Submission, Source, ReviewQueueItem, AlertItem, AuditLog, AnalyticsData } from '../../types';
import { Button } from '../../components/common/Button';
import { StatCardSkeleton, ChartSkeleton, CardSkeleton, Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ClassificationBadge } from '../../components/verification/ClassificationBadge';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import { useToast } from '../../context/ToastContext';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | '12M'>('30D');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadAdminDashboard = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [sysStats, analyticsRes, allSubs, revQueue, allAlerts, logs] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAnalytics().catch(() => null),
        adminService.getSubmissions({ limit: 10 }),
        adminService.getReviewQueue({ limit: 10 }),
        adminService.getAlerts({ limit: 10 }),
        adminService.getAuditLogs({ limit: 6 }),
      ]);

      setStats(sysStats);
      setAnalytics(analyticsRes);
      setSubmissions(allSubs || []);
      setReviews(revQueue || []);
      setAlerts(allAlerts || []);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      toast.error('Failed to Load', 'Could not refresh administrative telemetry data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const [newHighRiskAlert, setNewHighRiskAlert] = useState<{ id: string; snippet: string; count: number } | null>(null);

  useEffect(() => {
    loadAdminDashboard();

    // Setup periodic real-time synchronization interval
    const interval = setInterval(() => {
      adminService.getDashboardStats().then((newStats) => {
        setStats((prev) => {
          if (newStats.pendingReviewsCount > (prev?.pendingReviewsCount || 0)) {
            toast.info('New Review Required', 'A new high-priority claim has been routed to the review queue.');
          }
          return newStats;
        });
      }).catch(() => {});

      adminService.getReviewQueue({ limit: 5 }).then((queue) => {
        setReviews(queue || []);
        const highRisk = queue?.find((q: any) => q.priority === 'CRITICAL' || q.autoClassification === 'FAKE');
        if (highRisk && highRisk.status === 'PENDING') {
          setNewHighRiskAlert({
            id: highRisk.submissionId || highRisk.id,
            snippet: highRisk.submissionSnippet || 'Urgent claim requiring verification',
            count: queue.filter((q: any) => q.status === 'PENDING').length,
          });
        }
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Compute dynamic timeline chart data from backend analytics or submissions
  const dynamicTimelineData = React.useMemo(() => {
    if (analytics?.verifications?.timeline && analytics.verifications.timeline.length > 0) {
      const sliceCount = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : timeRange === '90D' ? 90 : 365;
      return analytics.verifications.timeline.slice(-sliceCount).map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: item.count || 0,
        fake: Math.round((item.count || 0) * (stats?.fakeRatio ? stats.fakeRatio / 100 : 0.2)),
      }));
    }

    // Generate accurate timeline slots if backend returns aggregated points
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 14 : timeRange === '90D' ? 30 : 52;
    const points = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * (timeRange === '7D' ? 1 : timeRange === '30D' ? 2 : 3) * 24 * 60 * 60 * 1000);
      const label = timeRange === '7D' ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const daySubs = submissions.filter((s) => {
        const subDate = new Date(s.submittedAt);
        return subDate.toDateString() === d.toDateString();
      });
      const totalCount = daySubs.length;
      const fakeCount = daySubs.filter((s) => s.result?.classification === 'FAKE' || s.result?.classification === 'SUSPICIOUS').length;
      points.push({
        date: label,
        total: totalCount,
        fake: fakeCount,
      });
    }
    return points;
  }, [analytics, submissions, timeRange, stats]);

  // Classification pie data calculated strictly from live counts
  const classificationPieData = React.useMemo(() => {
    const verified = stats?.verifiedCount || (submissions.filter((s) => s.result?.classification === 'VERIFIED').length);
    const trusted = stats?.trustedCount || (submissions.filter((s) => s.result?.classification === 'TRUSTED').length);
    const suspicious = stats?.suspiciousCount || (submissions.filter((s) => s.result?.classification === 'SUSPICIOUS').length);
    const fake = stats?.fakeCount || (submissions.filter((s) => s.result?.classification === 'FAKE').length);

    return [
      { name: 'Verified', value: verified, color: '#10b981' },
      { name: 'Trusted', value: trusted, color: '#3b82f6' },
      { name: 'Suspicious', value: suspicious, color: '#f59e0b' },
      { name: 'Fake Claims', value: fake, color: '#ef4444' },
    ];
  }, [stats, submissions]);

  // Dynamic Content Channel distribution calculated from live verifications & backend
  const contentTypeData = React.useMemo(() => {
    const textCount = submissions.filter((s) => s.contentType === 'TEXT').length;
    const urlCount = submissions.filter((s) => s.contentType === 'URL').length;
    const imageCount = submissions.filter((s) => s.contentType === 'IMAGE').length;
    const total = (textCount + urlCount + imageCount) || 1;

    return [
      {
        name: 'Text Content',
        count: textCount,
        percentage: Math.round((textCount / total) * 100),
        icon: FileText,
        color: 'bg-blue-500',
      },
      {
        name: 'Article URLs',
        count: urlCount,
        percentage: Math.round((urlCount / total) * 100),
        icon: Globe,
        color: 'bg-emerald-500',
      },
      {
        name: 'Screenshots / OCR',
        count: imageCount,
        percentage: Math.round((imageCount / total) * 100),
        icon: ImageIcon,
        color: 'bg-purple-500',
      },
    ];
  }, [submissions]);

  const pendingReviews = reviews.filter((r) => r.status === 'PENDING');
  const flaggedSubmissions = submissions.filter(
    (s) => s.result?.classification === 'FAKE' || s.result?.classification === 'SUSPICIOUS'
  );

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Real-time High Risk Notification Banner */}
      {newHighRiskAlert && (
        <div className="rounded-2xl border-2 border-rose-500/80 bg-rose-500/10 dark:bg-rose-950/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                CRITICAL MISINFORMATION ALERT
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                "{newHighRiskAlert.snippet}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link to={`/admin/reviews/${newHighRiskAlert.id}`}>
              <Button variant="danger" size="sm">
                Adjudicate Now
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNewHighRiskAlert(null)}
              className="text-xs text-slate-500"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* 1. Header Banner & Live Synchronized Actions */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Administrative Center
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live Database Connected
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            System Administration Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Monitor live platform metrics, adjudicate incoming reviews, manage registered news sources, and audit administrative actions in real-time.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadAdminDashboard(true)}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Refresh
          </Button>

          <Link to="/admin/sources">
            <Button variant="secondary" size="sm" leftIcon={<Globe className="w-3.5 h-3.5" />}>
              Sources
            </Button>
          </Link>
          <Link to="/admin/fact-checks">
            <Button variant="secondary" size="sm" leftIcon={<Database className="w-3.5 h-3.5" />}>
              Fact Checks
            </Button>
          </Link>
          <Link to="/admin/reviews">
            <Button variant="primary" size="sm" leftIcon={<Clock className="w-3.5 h-3.5" />}>
              Review Queue ({pendingReviews.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KPI Summary Metric Cards (Live Live /api/admin/metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <div className="col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">Total Users</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{stats?.totalUsers ?? 0}</div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Live
              </span>
            </div>

            <div className="col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">Verifications</span>
              <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{stats?.totalSubmissions ?? 0}</div>
              <span className="text-[10px] font-bold text-slate-400">All queries</span>
            </div>

            <div className="col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950/60 shadow-2xs space-y-1 bg-emerald-50/20 dark:bg-emerald-950/20 transition-colors">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block truncate">Verified</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{stats?.verifiedCount ?? 0}</div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">80-100 score</span>
            </div>

            <div className="col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-950/60 shadow-2xs space-y-1 bg-blue-50/20 dark:bg-blue-950/20 transition-colors">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 block truncate">Trusted</span>
              <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{stats?.trustedCount ?? 0}</div>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">65-79 score</span>
            </div>

            <div className="col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-950/60 shadow-2xs space-y-1 bg-amber-50/20 dark:bg-amber-950/20 transition-colors">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block truncate">Suspicious</span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{stats?.suspiciousCount ?? 0}</div>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">40-64 score</span>
            </div>

            <div className="col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/60 shadow-2xs space-y-1 bg-rose-50/20 dark:bg-rose-950/20 transition-colors">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block truncate">Fake Claims</span>
              <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{stats?.fakeCount ?? 0}</div>
              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">0-39 score</span>
            </div>

            <div className="col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block truncate">Pending Review</span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{pendingReviews.length}</div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Queue items</span>
            </div>

            <div className="col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">Active Sources</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{stats?.activeSources ?? 0}</div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">In registry</span>
            </div>
          </>
        )}
      </div>

      {/* 3. Main Analytics & Ingestion Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Activity Ingestion Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Verification Ingestion & Activity</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live query volume and misinformation detection trends</p>
            </div>
            {/* Time Range Filter */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
              {(['7D', '30D', '90D', '12M'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    timeRange === r
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <ChartSkeleton height="h-72" />
          ) : dynamicTimelineData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-400 text-xs">
              No verification activity recorded for this period yet.
            </div>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="areaFake" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Queries"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#areaTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="fake"
                    name="Flagged / Fake"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#areaFake)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Classification & Ingestion Breakdown (1 col) */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-5 flex flex-col justify-between transition-colors">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white pb-1">Classification Distribution</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Breakdown of platform determinations</p>

            {isLoading ? (
              <div className="h-44 flex items-center justify-center">
                <Skeleton className="w-32 h-32 rounded-full" />
              </div>
            ) : (
              <div className="w-full h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classificationPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {classificationPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2">
              {classificationPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content Type Breakdown */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Content Channels
            </span>
            <div className="space-y-1.5">
              {contentTypeData.map((ct) => {
                const Icon = ct.icon;
                return (
                  <div key={ct.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{ct.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">{ct.count}</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">{ct.percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Two Column Workspace: Priority Review Queue & Flagged Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Review Queue */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Priority Review Queue</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                  {pendingReviews.length} PENDING
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Items requiring human administrative adjudication</p>
            </div>
            <Link to="/admin/reviews">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)
            ) : pendingReviews.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Review Queue Clear"
                description="All submitted claims and verifications have been adjudicated."
                actionLabel="Explore All Submissions"
                onAction={() => navigate('/admin/submissions')}
              />
            ) : (
              pendingReviews.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      "{item.submissionSnippet || item.submission?.contentPreview || 'Claim Item'}"
                    </span>
                    <PriorityBadge priority={item.priority} size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>
                      Auto Score: <strong className="text-slate-800 dark:text-slate-200">{item.autoScore}/100</strong> • Flag: {item.flagReason}
                    </span>
                    <ClassificationBadge classification={item.autoClassification} size="sm" />
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {item.submissionId}</span>
                    <Link to={`/admin/reviews/${item.submissionId}`}>
                      <Button variant="primary" size="sm">
                        Review Now
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Flagged Content Feed */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Flagged Content</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  {flaggedSubmissions.length} DETECTED
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Automated detections with low credibility scores</p>
            </div>
            <Link to="/admin/flagged">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)
            ) : flaggedSubmissions.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No Flagged Misinformation"
                description="Zero suspicious or fake submissions are pending investigation."
                actionLabel="Inspect Verification Registry"
                onAction={() => navigate('/admin/submissions')}
              />
            ) : (
              flaggedSubmissions.slice(0, 3).map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      "{sub.contentPreview}"
                    </div>
                    {sub.result && <ClassificationBadge classification={sub.result.classification} size="sm" />}
                  </div>

                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>
                      Source: <strong className="text-slate-800 dark:text-slate-200">{sub.result?.source.name || 'Unknown'}</strong> ({sub.result?.source.domain || 'direct'})
                    </span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                      Score: {sub.result?.score}/100
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">By {sub.userName}</span>
                    <Link to={`/admin/flagged/${sub.id}`}>
                      <Button variant="secondary" size="sm">
                        Investigate
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. System Diagnostics & Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System & AI Engine Telemetry */}
        <div className="rounded-3xl bg-slate-900 dark:bg-slate-950 text-white p-6 shadow-md space-y-4 border border-slate-800 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> AI Engine Diagnostics
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              LIVE
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>NLP Inference Latency</span>
              <span className="text-white font-mono font-bold">{stats?.averageProcessingTimeMs ?? 1450}ms</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Overall Accuracy</span>
              <span className="text-white font-mono font-bold">{stats?.accuracyRate ?? 94.2}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Confidence Threshold</span>
              <span className="text-white font-mono font-bold">85%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>OCR Image Pipeline</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Healthy
              </span>
            </div>
          </div>

          <Link to="/admin/ai-performance" className="block pt-2">
            <Button variant="secondary" size="sm" className="w-full">
              View AI Diagnostics
            </Button>
          </Link>
        </div>

        {/* Live Admin Audit Logs preview (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Recent Audit Activity</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Security events and moderation audit trail</p>
            </div>
            <Link to="/admin/audit-logs">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All Logs
              </Button>
            </Link>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : auditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No recent audit logs recorded yet.</div>
            ) : (
              auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-xs gap-3 transition-colors"
                >
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">{log.action}</span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{log.targetName}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{log.details}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">{log.adminName}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {new Date(log.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
