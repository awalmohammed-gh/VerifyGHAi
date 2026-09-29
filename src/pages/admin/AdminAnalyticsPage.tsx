import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  BarChart2,
  TrendingUp,
  Globe,
  PieChart as PieChartIcon,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Calendar,
  Layers,
  FileText,
  Radio,
  RefreshCw,
  Zap,
  CheckCircle,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/common/Button';
import { StatCardSkeleton, ChartSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminAnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('30d');
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const eventSourceRef = useRef<EventSource | null>(null);

  // Manual or Initial REST Fetch
  const loadAnalytics = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);

      const data = await adminService.getAnalytics(timeRange);
      setAnalytics(data);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('[AdminAnalyticsPage] Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Real-time SSE Stream Setup
  useEffect(() => {
    loadAnalytics();

    // Close any previous EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const streamUrl = `/api/admin/analytics/stream?timeframe=${timeRange}`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsStreaming(true);
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.analytics) {
            setAnalytics(payload.analytics);
            setLastSyncTime(new Date());
          }
        } catch (e) {
          console.warn('[AdminAnalyticsPage] SSE parse error:', e);
        }
      };

      es.onerror = () => {
        setIsStreaming(false);
        // Fallback gracefully without throwing alerts
        if (es.readyState === EventSource.CLOSED) {
          eventSourceRef.current = null;
        }
      };
    } catch (streamErr) {
      console.warn('[AdminAnalyticsPage] EventSource connection error:', streamErr);
      setIsStreaming(false);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsStreaming(false);
      }
    };
  }, [timeRange]);

  // Classification Donut Data
  const classificationDonut = useMemo(() => {
    const dist = analytics?.classificationDistribution || {};
    return [
      { name: 'VERIFIED', value: dist.VERIFIED || 0, color: '#10b981' },
      { name: 'TRUSTED', value: dist.TRUSTED || 0, color: '#3b82f6' },
      { name: 'SUSPICIOUS', value: dist.SUSPICIOUS || 0, color: '#f59e0b' },
      { name: 'FAKE', value: dist.FAKE || 0, color: '#ef4444' },
      { name: 'UNVERIFIED', value: dist.UNVERIFIED || 0, color: '#94a3b8' },
    ].filter((item) => item.value > 0 || (analytics?.verifications?.total ?? 0) === 0);
  }, [analytics]);

  // Submission Type Breakdown
  const submissionTypeData = useMemo(() => {
    const dist = analytics?.submissionTypeDistribution || {};
    return [
      { type: 'Direct URL', count: dist.URL || 0, fill: '#3b82f6' },
      { type: 'Text / Excerpt', count: dist.TEXT || 0, fill: '#8b5cf6' },
      { type: 'Headline Claim', count: dist.CLAIM || 0, fill: '#ec4899' },
      { type: 'Document File', count: dist.FILE || 0, fill: '#06b6d4' },
    ];
  }, [analytics]);

  // Ingestion Timeline
  const timelineData = useMemo(() => {
    const rawTimeline = analytics?.verifications?.timeline || [];
    if (rawTimeline.length > 0) {
      return rawTimeline.map((item: { date: string; count: number }) => {
        let label = item.date;
        if (item.date.includes('-')) {
          const d = new Date(item.date);
          label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return {
          date: label,
          total: item.count,
        };
      });
    }
    return [];
  }, [analytics]);

  const quality = analytics?.qualityMetrics || {
    averageCredibilityScore: 74,
    averageConfidence: 0.85,
    lowConfidencePercentage: 8,
    reviewRate: 12,
    humanOverrideRate: 4,
  };

  const users = analytics?.users || {
    total: 0,
    growthRate: 0,
    activeUsers: 0,
    suspendedUsers: 0,
  };

  const verifications = analytics?.verifications || {
    total: 0,
    growthRate: 0,
    completed: 0,
    processing: 0,
    failed: 0,
    pendingReview: 0,
    successRate: 100,
  };

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Platform Intelligence & Analytics
              </h1>
              {isStreaming ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live SSE Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Polled
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Live claims ingestion statistics, automated classification outcomes, and pipeline quality metrics.
            </p>
          </div>

          {/* Time Range Selector & Sync Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadAnalytics(true)}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
              className="text-xs"
            >
              Sync
            </Button>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
              {(
                [
                  { id: '24h', label: '24H' },
                  { id: '7d', label: '7D' },
                  { id: '30d', label: '30D' },
                  { id: '90d', label: '90D' },
                  { id: '1y', label: '1Y' },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setTimeRange(r.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    timeRange === r.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5" />
          <span>Last database synchronization: {lastSyncTime.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            {/* Total Ingestion */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Total Ingestion
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {verifications.total} <span className="text-xs font-normal text-slate-400">claims</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                {verifications.growthRate >= 0 ? `+${verifications.growthRate}%` : `${verifications.growthRate}%`} vs prior
              </span>
            </div>

            {/* Average Credibility */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Avg Credibility Score
              </span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {quality.averageCredibilityScore}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Confidence: {Math.round(quality.averageConfidence * 100)}%
              </span>
            </div>

            {/* Success / Pipeline Rate */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Processing Success Rate
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {verifications.successRate}%
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {verifications.completed} completed, {verifications.pendingReview} pending review
              </span>
            </div>

            {/* Total Registered Citizens */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 transition-colors">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Registered Users
              </span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {users.total} <span className="text-xs font-normal text-slate-400">accounts</span>
              </div>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                {users.activeUsers} active, {users.suspendedUsers} suspended
              </span>
            </div>
          </>
        )}
      </div>

      {/* Primary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Volume Ingestion Timeline */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4 transition-colors">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Claims Verification Ingestion Trend
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated verification workload over the selected {timeRange.toUpperCase()} timeframe
            </p>
          </div>
          {isLoading ? (
            <ChartSkeleton height="h-72" />
          ) : timelineData.length === 0 ? (
            <div className="h-72 flex items-center justify-center">
              <EmptyState
                icon={<BarChart2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />}
                title="No Ingestion Points"
                description="No claim activity logged for this time range."
              />
            </div>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="liveTotalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Ingested Claims"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#liveTotalGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Classification Outcome Distribution */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4 flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Classification Outcome Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live ratio of Verified, Trusted, Suspicious, and Fake assessments
            </p>
          </div>

          {isLoading ? (
            <div className="h-52 flex items-center justify-center">
              <ChartSkeleton height="h-44" />
            </div>
          ) : (
            <div className="w-full h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classificationDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {classificationDonut.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {classificationDonut.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submission Input Channels Breakdown */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4 transition-colors">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Submission Input Channels
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of incoming claims by medium (URL, Raw Text, Claim, Document)
            </p>
          </div>
          {isLoading ? (
            <ChartSkeleton height="h-64" />
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={submissionTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.3} />
                  <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="count" name="Submissions" radius={[6, 6, 0, 0]}>
                    {submissionTypeData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pipeline Quality & Review Metrics */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4 flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Quality & Human Review Metrics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pipeline validation metrics and fact-checker oversight
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">AI Confidence Score</span>
                <span className="text-[11px] text-slate-400">Model certainty threshold adherence</span>
              </div>
              <span className="font-black text-blue-600 dark:text-blue-400 font-mono text-sm">
                {Math.round(quality.averageConfidence * 100)}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Human Escalation Rate</span>
                <span className="text-[11px] text-slate-400">Claims routed to human fact-checkers</span>
              </div>
              <span className="font-black text-amber-600 dark:text-amber-400 font-mono text-sm">
                {quality.reviewRate}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Human Override Rate</span>
                <span className="text-[11px] text-slate-400">Fact-checker corrections on AI predictions</span>
              </div>
              <span className="font-black text-purple-600 dark:text-purple-400 font-mono text-sm">
                {quality.humanOverrideRate}%
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 text-xs flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>Dual-pass AI cross-verification active with continuous audit logs.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
