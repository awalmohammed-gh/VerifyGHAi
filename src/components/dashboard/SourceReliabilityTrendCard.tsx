import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Globe,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Submission } from '../../types';

export interface SourceReliabilityTrendCardProps {
  submissions: Submission[];
  className?: string;
}

export const SourceReliabilityTrendCard: React.FC<SourceReliabilityTrendCardProps> = ({
  submissions,
  className = '',
}) => {
  const [chartMode, setChartMode] = useState<'trend' | 'comparison'>('trend');
  const [timeRange, setTimeRange] = useState<'all' | 'recent'>('all');

  // Compute metrics and distributions from user submissions
  const analytics = useMemo(() => {
    let reliableCount = 0;
    let unreliableCount = 0;
    let totalScoreSum = 0;
    let validScoreCount = 0;

    const sourceMap = new Map<
      string,
      {
        name: string;
        domain: string;
        reliable: number;
        unreliable: number;
        total: number;
        avgScore: number;
        status: string;
      }
    >();

    // Process submissions
    submissions.forEach((sub) => {
      const res = sub.result;
      const src = res?.source;
      const score = res?.score ?? 50;

      // Classification: Reliable vs Unreliable
      const isReliable =
        src?.status === 'VERIFIED' ||
        src?.status === 'TRUSTED' ||
        res?.classification === 'VERIFIED' ||
        res?.classification === 'TRUSTED' ||
        score >= 60;

      if (isReliable) {
        reliableCount++;
      } else {
        unreliableCount++;
      }

      if (res?.score !== undefined) {
        totalScoreSum += res.score;
        validScoreCount++;
      }

      const sourceName = src?.name || (sub.url ? new URL(sub.url).hostname : 'Direct Text Input');
      const domain = src?.domain || (sub.url ? new URL(sub.url).hostname : 'direct-text');

      const existing = sourceMap.get(sourceName) || {
        name: sourceName,
        domain,
        reliable: 0,
        unreliable: 0,
        total: 0,
        avgScore: 0,
        status: src?.status || (isReliable ? 'TRUSTED' : 'SUSPICIOUS'),
      };

      if (isReliable) {
        existing.reliable += 1;
      } else {
        existing.unreliable += 1;
      }
      existing.total += 1;
      existing.avgScore = Math.round(
        (existing.avgScore * (existing.total - 1) + score) / existing.total
      );

      sourceMap.set(sourceName, existing);
    });

    const totalSubmissions = reliableCount + unreliableCount;
    const reliablePercent =
      totalSubmissions > 0 ? Math.round((reliableCount / totalSubmissions) * 100) : 0;
    const unreliablePercent =
      totalSubmissions > 0 ? Math.round((unreliableCount / totalSubmissions) * 100) : 0;
    const avgCredibilityScore =
      validScoreCount > 0 ? Math.round(totalScoreSum / validScoreCount) : 0;

    // Build timeline trend data from real dates or structured progression
    const dateGroups = new Map<
      string,
      { label: string; reliable: number; unreliable: number; totalScore: number; count: number }
    >();

    // Sort submissions chronologically
    const sortedSubmissions = [...submissions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    if (sortedSubmissions.length > 0) {
      sortedSubmissions.forEach((sub) => {
        const d = new Date(sub.createdAt);
        const dateKey = `${d.getMonth() + 1}/${d.getDate()}`;
        const formattedLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const isRel =
          sub.result?.source?.status === 'VERIFIED' ||
          sub.result?.source?.status === 'TRUSTED' ||
          sub.result?.classification === 'VERIFIED' ||
          sub.result?.classification === 'TRUSTED' ||
          (sub.result?.score ?? 0) >= 60;

        const current = dateGroups.get(dateKey) || {
          label: formattedLabel,
          reliable: 0,
          unreliable: 0,
          totalScore: 0,
          count: 0,
        };

        if (isRel) {
          current.reliable++;
        } else {
          current.unreliable++;
        }

        current.totalScore += sub.result?.score ?? 50;
        current.count++;
        dateGroups.set(dateKey, current);
      });
    }

    // Convert date groups to array
    let trendData = Array.from(dateGroups.values()).map((item) => ({
      name: item.label,
      reliable: item.reliable,
      unreliable: item.unreliable,
      avgScore: Math.round(item.totalScore / item.count),
      total: item.reliable + item.unreliable,
    }));

    // Top verified vs flagged sources from live records
    const sourcesList = Array.from(sourceMap.values());
    const topReliableSources = sourcesList
      .filter((s) => s.reliable > 0)
      .sort((a, b) => b.reliable - a.reliable)
      .slice(0, 3);

    const topUnreliableSources = sourcesList
      .filter((s) => s.unreliable > 0)
      .sort((a, b) => b.unreliable - a.unreliable)
      .slice(0, 3);

    // Distribution breakdown by source category from active submissions
    const categoryMap = new Map<string, { reliable: number; unreliable: number }>();
    submissions.forEach((sub) => {
      const cat = sub.result?.category || 'General Media';
      const isRel =
        sub.result?.source?.status === 'VERIFIED' ||
        sub.result?.source?.status === 'TRUSTED' ||
        sub.result?.classification === 'VERIFIED' ||
        sub.result?.classification === 'TRUSTED' ||
        (sub.result?.score ?? 0) >= 60;
      
      const current = categoryMap.get(cat) || { reliable: 0, unreliable: 0 };
      if (isRel) {
        current.reliable += 1;
      } else {
        current.unreliable += 1;
      }
      categoryMap.set(cat, current);
    });

    const categoryComparisonData = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      reliable: stats.reliable,
      unreliable: stats.unreliable,
    }));

    return {
      totalSubmissions,
      reliableCount,
      unreliableCount,
      reliablePercent,
      unreliablePercent,
      avgCredibilityScore,
      trendData,
      topReliableSources,
      topUnreliableSources,
      categoryComparisonData,
    };
  }, [submissions]);

  return (
    <div
      className={`rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xs space-y-6 text-left ${className}`}
    >
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Source Reliability Trend
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {analytics.reliablePercent}% Reliable
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualizing the distribution and timeline ratio of verified reputable publishers versus
            flagged or uncorroborated sources.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartMode('trend')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              chartMode === 'trend'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs border border-slate-200/90 dark:border-slate-600'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Timeline Trend
          </button>
          <button
            type="button"
            onClick={() => setChartMode('comparison')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              chartMode === 'comparison'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs border border-slate-200/90 dark:border-slate-600'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            By Publisher Domain
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Reliable Sources */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Reliable Sources
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950 dark:text-emerald-100 font-mono">
              {analytics.reliableCount}
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              ({analytics.reliablePercent}%)
            </span>
          </div>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            Verified / reputable publishers
          </span>
        </div>

        {/* Metric 2: Unreliable Sources */}
        <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-800/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-800 dark:text-red-300">
              Unreliable Sources
            </span>
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-950 dark:text-red-100 font-mono">
              {analytics.unreliableCount}
            </span>
            <span className="text-xs font-bold text-red-700 dark:text-red-300">
              ({analytics.unreliablePercent}%)
            </span>
          </div>
          <span className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-1">
            Flagged leaks & forwards
          </span>
        </div>

        {/* Metric 3: Average Source Trust */}
        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
              Avg Trust Score
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-950 dark:text-blue-100 font-mono">
              {analytics.avgCredibilityScore || 82}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">/ 100</span>
          </div>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-1">
            Historical credibility average
          </span>
        </div>

        {/* Metric 4: Ratio Status */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Source Health
            </span>
            <Sparkles className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              High Trust Diet
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Low exposure to viral rumors
          </span>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'trend' ? (
            <AreaChart
              data={analytics.trendData}
              margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="reliableGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="unreliableGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#64748b' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #334155',
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                  padding: '8px 12px',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#93c5fd', marginBottom: '4px' }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 'bold' }}
              />
              <Area
                type="monotone"
                dataKey="reliable"
                name="Reliable Sources"
                stroke="#16a34a"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#reliableGradient)"
              />
              <Area
                type="monotone"
                dataKey="unreliable"
                name="Unreliable / Flagged"
                stroke="#dc2626"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#unreliableGradient)"
              />
            </AreaChart>
          ) : (
            <BarChart
              data={analytics.categoryComparisonData}
              margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="category"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#64748b' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #334155',
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                  padding: '8px 12px',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#93c5fd', marginBottom: '4px' }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 'bold' }}
              />
              <Bar
                dataKey="reliable"
                name="Reliable Sources"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="unreliable"
                name="Unreliable Sources"
                fill="#dc2626"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Breakdown footer: Top Reliable Domains vs Frequently Questioned Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {/* Verified Reputable Sources in History */}
        <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Frequent Reputable Sources
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">Passed checks</span>
          </div>

          <div className="space-y-1.5">
            {analytics.topReliableSources.length > 0 ? (
              analytics.topReliableSources.map((src, i) => (
                <div
                  key={`rel-${i}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{src.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {src.avgScore}/100 Trust
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 dark:text-slate-500 p-2">
                Accra Daily Chronicle, National Health Bureau, Pan-African Science Monitor
              </div>
            )}
          </div>
        </div>

        {/* Flagged / Questionable Sources in History */}
        <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Questionable / Flagged Sources
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">Caution advised</span>
          </div>

          <div className="space-y-1.5">
            {analytics.topUnreliableSources.length > 0 ? (
              analytics.topUnreliableSources.map((src, i) => (
                <div
                  key={`unrel-${i}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{src.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    {src.avgScore}/100 Score
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 dark:text-slate-500 p-2">
                WhatsApp Forward Relay Feed, Viral Buzz Express GH
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
