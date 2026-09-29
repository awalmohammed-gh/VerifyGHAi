import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { verificationService } from '../../services/verificationService';
import { UserAnalytics } from '../../types';
import { StatCard } from '../../components/dashboard/StatCard';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { VerificationTrendsChart } from '../../components/dashboard/VerificationTrendsChart';
import { TrustScoreTrendCard } from '../../components/dashboard/TrustScoreTrendCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';

export const StatisticsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await verificationService.getUserAnalytics(currentUser?.id);
      setStats(data);
    } catch (err) {
      console.error('Failed to load user analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Computing verification statistics..." />;
  }

  const hasRecords = stats && stats.totalSubmissions > 0;

  const pieData = stats
    ? [
        { name: 'VERIFIED', value: stats.verifiedCount, color: '#16a34a' },
        { name: 'TRUSTED', value: stats.trustedCount, color: '#2563eb' },
        { name: 'SUSPICIOUS', value: stats.suspiciousCount, color: '#d97706' },
        { name: 'FAKE', value: stats.fakeCount, color: '#dc2626' },
      ].filter((item) => item.value > 0)
    : [];

  const categoryData = stats
    ? Object.entries(stats.categoryBreakdown).map(([category, count]) => ({
        category,
        count,
      }))
    : [];

  const trendData = stats?.recentActivityTrend?.length
    ? stats.recentActivityTrend.map((item) => ({
        month: item.month,
        submissions: item.count,
      }))
    : [];

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Verification Analytics & Reporting</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Track your verification patterns, credibility distribution, and topical categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-semibold text-slate-700"
          >
            Refresh
          </Button>
        </div>
      </div>

      {!hasRecords ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 sm:p-14 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center border border-blue-100 shadow-inner">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900">No Verification Records Found Yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              You haven't submitted any articles, claims, or images for fact-checking yet. Run your first verification to generate live analytics.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => navigate('/verify')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="text-xs font-bold"
            >
              Run First Article Verification
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Submissions"
              value={stats.totalSubmissions}
              subtitle="Analyzed to date"
              icon={FileCheck}
              variant="default"
            />
            <StatCard
              title="Average Score"
              value={`${stats.averageCredibilityScore ?? (stats as any).averageScore ?? 0}/100`}
              subtitle="Mean credibility rating"
              icon={ShieldCheck}
              variant={(stats.averageCredibilityScore ?? (stats as any).averageScore ?? 0) >= 70 ? 'verified' : 'suspicious'}
            />
            <StatCard
              title="High Risk Detected"
              value={stats.fakeCount + stats.suspiciousCount}
              subtitle="Flagged or refuted claims"
              icon={AlertTriangle}
              variant="fake"
            />
            <StatCard
              title="Verified %"
              value={`${Math.round(
                ((stats.verifiedCount + stats.trustedCount) / (stats.totalSubmissions || 1)) * 100
              )}%`}
              subtitle="Safe information ratio"
              icon={TrendingUp}
              variant="verified"
            />
          </div>

          {/* Trust Score Evolution Trends */}
          <TrustScoreTrendCard onRefresh={fetchStats} />

          {/* Verification Trends Visualization */}
          <VerificationTrendsChart onRefresh={fetchStats} />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classification Distribution */}
            <ChartCard
              title="Classification Breakdown"
              subtitle="Proportion of verified vs suspicious content"
            >
              <div className="w-full h-64 flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          fontSize: '12px',
                          borderColor: '#e2e8f0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400">No classification breakdown data available</div>
                )}
              </div>
            </ChartCard>

            {/* Categories Bar Chart */}
            <ChartCard
              title="Submissions by Topic"
              subtitle="Subject distribution of verified content"
            >
              <div className="w-full h-64">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="category"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        angle={-15}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          fontSize: '12px',
                          borderColor: '#e2e8f0',
                        }}
                      />
                      <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No topic distribution data available
                  </div>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Activity Timeline Trend */}
          <ChartCard
            title="Monthly Verification Activity"
            subtitle="Verification volume across recent months"
          >
            <div className="w-full h-64">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        fontSize: '12px',
                        borderColor: '#e2e8f0',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="submissions"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No monthly activity recorded yet
                </div>
              )}
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
};
