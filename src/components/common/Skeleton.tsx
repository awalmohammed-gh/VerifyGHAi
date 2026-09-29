import React from 'react';
import { Loader2, ShieldCheck, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

export const Skeleton: React.FC<{
  className?: string;
}> = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800/80 ${className}`} />
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
};

export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <Skeleton className={`h-4 ${i === 0 ? 'w-36' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number; cols?: number; className?: string }> = ({
  rows = 5,
  columns,
  cols = 5,
  className = '',
}) => {
  const colCount = columns ?? cols;
  return (
    <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={colCount} />
      ))}
    </tbody>
  );
};

export const TableBodySkeleton = TableSkeleton;

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-72' }) => {
  return (
    <div className={`w-full ${height} rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 p-6 flex flex-col justify-between animate-pulse`}>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-end justify-between gap-3 h-40 pt-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-200 dark:bg-slate-700/60 rounded-t-lg"
            style={{ height: `${25 + ((i * 37) % 65)}%` }}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 🌟 User Dashboard Skeleton Loading View
 * Matches UserDashboard structure perfectly with 4 stat cards, chart cards, activity feeds,
 * plus a centered, high-contrast loading state right in the middle.
 */
export const UserDashboardSkeleton: React.FC = () => {
  return (
    <div className="relative w-full space-y-6 text-left select-none pb-12">
      {/* Floating Centered Loading State Overlay in the Middle */}
      <div className="sticky top-24 z-20 flex justify-center pointer-events-none mb-2">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-blue-200 dark:border-blue-800 shadow-xl text-blue-700 dark:text-blue-300 animate-bounce">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold tracking-tight">
            Synchronizing live verification metrics & activity...
          </span>
        </div>
      </div>

      {/* Header Banner Skeleton */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Mid-tier Analytic Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Distribution breakdown */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-full" />
        </div>

        {/* Right 1 Col: Quick Action CTA Box */}
        <div className="p-6 rounded-3xl bg-slate-900 dark:bg-slate-800/80 border border-slate-800 text-white space-y-4 flex flex-col justify-between">
          <div className="space-y-2.5">
            <Skeleton className="h-5 w-32 bg-slate-700" />
            <Skeleton className="h-3 w-full bg-slate-700/60" />
            <Skeleton className="h-3 w-4/5 bg-slate-700/60" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl bg-blue-600/50" />
        </div>
      </div>

      {/* Recent Activity Table / List Card Skeleton */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-44 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>

        {/* List items */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 🌟 Verification Result Skeleton Loading View
 * Matches ResultSummary structure with Verdict Banner, Key Insights, Claims & Sources.
 */
export const VerificationResultSkeleton: React.FC<{
  title?: string;
  subtitle?: string;
}> = ({
  title = 'Retrieving Forensic Verification Report...',
  subtitle = 'Analyzing claim accuracy, corroborating multi-source evidence, and computing credibility scores.',
}) => {
  return (
    <div className="relative w-full space-y-6 text-left select-none pb-12">
      {/* Centered Middle Loading Indicator Pill */}
      <div className="sticky top-24 z-20 flex justify-center pointer-events-none mb-2">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-blue-200 dark:border-blue-800 shadow-xl text-blue-700 dark:text-blue-300 animate-bounce">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold tracking-tight">{title}</span>
        </div>
      </div>

      {/* Top Action Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>

      {/* Giant Verdict Hero Card Skeleton */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {/* Score Gauge Skeleton */}
            <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-64" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-4 w-32 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Claim Summary Box Skeleton */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      </div>

      {/* Middle Grid: Evidence Analysis & Source Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Indicators Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Source Analysis Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Forensic Fact-Check Claims Breakdown */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 🌟 History Page Skeleton Loading View
 */
export const HistoryPageSkeleton: React.FC = () => {
  return (
    <div className="relative w-full space-y-6 text-left select-none pb-12">
      {/* Centered Middle Loading Indicator Pill */}
      <div className="sticky top-24 z-20 flex justify-center pointer-events-none mb-2">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-blue-200 dark:border-blue-800 shadow-xl text-blue-700 dark:text-blue-300 animate-bounce">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold tracking-tight">
            Loading verification history and smart folders...
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>

        {/* Folders */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-xl flex-shrink-0" />
          ))}
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Skeleton className="h-10 rounded-xl sm:col-span-2" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton Card */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 🌟 Saved Reports Page Skeleton Loading View
 */
export const ReportsPageSkeleton: React.FC = () => {
  return (
    <div className="relative w-full space-y-6 text-left select-none pb-12">
      {/* Centered Middle Loading Indicator Pill */}
      <div className="sticky top-24 z-20 flex justify-center pointer-events-none mb-2">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-blue-200 dark:border-blue-800 shadow-xl text-blue-700 dark:text-blue-300 animate-bounce">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold tracking-tight">
            Loading saved fact-checking dossier archive...
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { AuthFormSkeleton } from '../auth/AuthFormSkeleton';


