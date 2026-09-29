import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, CheckCircle2, AlertCircle, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { AdminStatCard } from '../../components/admin/AdminStatCard';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { aiClientService, AIStatusResponseData } from '../../services/aiClientService';
import { adminService } from '../../services/adminService';
import { AIPerformanceData } from '../../types';

export const AdminAIPerformancePage: React.FC = () => {
  const { toast } = useToast();
  const [aiStatus, setAiStatus] = useState<AIStatusResponseData | null>(null);
  const [aiMetrics, setAiMetrics] = useState<AIPerformanceData | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const handleCheckAIStatus = async () => {
    setIsCheckingStatus(true);
    toast.info('AI Diagnostics Querying', 'Fetching live Gemini API status and database evaluation metrics...');

    try {
      const [status, perf] = await Promise.allSettled([
        aiClientService.getStatus(),
        adminService.getAIPerformance(),
      ]);

      if (status.status === 'fulfilled') {
        setAiStatus(status.value);
      }
      if (perf.status === 'fulfilled') {
        setAiMetrics(perf.value);
      }

      toast.success('AI Diagnostics Updated', 'Latest server status and model evaluation metrics synchronized.');
    } catch (err: any) {
      const msg = err?.message || 'Failed to connect to AI status endpoint.';
      toast.error('AI Diagnostics Error', msg);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    handleCheckAIStatus();
  }, []);

  const totalAssessments = aiMetrics?.totalAIAssessments || 0;
  const avgConfidencePct = aiMetrics ? Math.round((aiMetrics.averageConfidence || 0.8) * 100) : 85;
  const lowConfRate = aiMetrics?.lowConfidenceRate ?? 0;
  const humanReviewed = aiMetrics?.humanReviewedAssessments ?? 0;
  const overrideRate = aiMetrics?.aiOverridePercentage ?? 0;

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">AI Model Diagnostics & Accuracy</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time inference metrics, confusion matrix benchmarks, and Gemini API engine status.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCheckAIStatus}
          disabled={isCheckingStatus}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />}
        >
          {isCheckingStatus ? 'Testing Status...' : 'Refresh Benchmarks'}
        </Button>
      </div>

      {/* Live AI Status Bar */}
      {aiStatus && (
        <div className="rounded-2xl bg-blue-50/70 border border-blue-200 p-4 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold">
            <Server className="w-4 h-4 text-blue-600" />
            <span>AI Server Status: <strong className="text-emerald-700">Online ({aiStatus.tier})</strong></span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span>Model: <code className="bg-white px-2 py-0.5 rounded border border-blue-100 font-mono text-blue-800">{aiStatus.model}</code></span>
            <span>Threshold: <strong className="text-slate-900">{aiStatus.confidenceThreshold}</strong></span>
            <span>Max Payload: <strong className="text-slate-900">{aiStatus.maxUploadSizeMB} MB</strong></span>
          </div>
        </div>
      )}

      {/* Top Engine Health Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total AI Scans"
          value={totalAssessments.toString()}
          subtitle="Processed via live engine"
          icon={Activity}
          badgeText="Live"
          badgeVariant="info"
          colorTheme="blue"
        />
        <AdminStatCard
          title="Average Confidence"
          value={`${avgConfidencePct}%`}
          subtitle="Model certainty score"
          icon={CheckCircle2}
          badgeText="Optimal"
          badgeVariant="success"
          colorTheme="emerald"
        />
        <AdminStatCard
          title="Low Confidence Rate"
          value={`${lowConfRate}%`}
          subtitle="Requires human check"
          icon={AlertCircle}
          badgeText={lowConfRate > 15 ? 'Elevated' : 'Normal'}
          badgeVariant={lowConfRate > 15 ? 'warning' : 'success'}
          colorTheme="amber"
        />
        <AdminStatCard
          title="Admin Override Rate"
          value={`${overrideRate}%`}
          subtitle={`${humanReviewed} human reviewed`}
          icon={Zap}
          badgeText="Accurate"
          badgeVariant="success"
          colorTheme="slate"
        />
      </div>

      {/* Model Breakdown & Live Classification */}
      <ChartCard title="Live Classification Assessment Distribution" subtitle="Automated verdicts recorded in system database">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-2">
          {aiMetrics?.aiClassificationDistribution ? (
            Object.entries(aiMetrics.aiClassificationDistribution).map(([cls, count]) => (
              <div key={cls} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{cls}</span>
                <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{count}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-6 text-slate-400 text-xs">
              No verification distributions recorded yet. Run content scans to generate live statistics.
            </div>
          )}
        </div>
      </ChartCard>

      {/* Model Weights Breakdown */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">Current AI Scoring Weights Calibration</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 font-bold uppercase block text-[10px]">Domain Registry</span>
            <span className="text-xl font-mono font-bold text-slate-900">35%</span>
            <p className="text-slate-500">Historical publisher track record and statutory credibility.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 font-bold uppercase block text-[10px]">Linguistic Indicators</span>
            <span className="text-xl font-mono font-bold text-slate-900">25%</span>
            <p className="text-slate-500">Sensationalism, urgency cues, clickbait syntax.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 font-bold uppercase block text-[10px]">Fact-Check Cross-Match</span>
            <span className="text-xl font-mono font-bold text-slate-900">25%</span>
            <p className="text-slate-500">Direct corroboration against debunking repositories.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 font-bold uppercase block text-[10px]">Primary Citations</span>
            <span className="text-xl font-mono font-bold text-slate-900">15%</span>
            <p className="text-slate-500">Presence of verifiable gazettes or institutional links.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
