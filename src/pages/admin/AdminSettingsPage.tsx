import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Shield,
  Database,
  Save,
  Cpu,
  BellRing,
  Lock,
  Globe,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';

export const AdminSettingsPage: React.FC = () => {
  const { toast } = useToast();

  // General Settings
  const [platformName, setPlatformName] = useState('TruthLens Ghana');
  const [supportEmail, setSupportEmail] = useState('contact@truthlens.gov.gh');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Scoring Thresholds
  const [fakeThreshold, setFakeThreshold] = useState('35');
  const [suspiciousThreshold, setSuspiciousThreshold] = useState('65');
  const [trustedThreshold, setTrustedThreshold] = useState('85');
  const [autoFlagThreshold, setAutoFlagThreshold] = useState('40');

  // AI Pipeline
  const [modelMode, setModelMode] = useState('GEMINI_FLASH');
  const [temperature, setTemperature] = useState('0.2');
  const [ocrEngineEnabled, setOcrEngineEnabled] = useState(true);
  const [confidenceMultiplier, setConfidenceMultiplier] = useState('1.0');

  // Security & Notifications
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [requireAdmin2FA, setRequireAdmin2FA] = useState(true);
  const [criticalEmailAlerts, setCriticalEmailAlerts] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://alerts.truthlens.gov.gh/hooks/disinfo');

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(
        'System Configuration Saved',
        'Scoring engine parameters, AI dispatcher rules, and security controls updated.'
      );
    }, 400);
  };

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">System & Engine Configuration</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Calibrate credibility scoring cutoffs, Gemini AI inference dispatch, security safeguards, and webhooks.
            </p>
          </div>

          <Button
            size="md"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Grid of Settings Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Scoring Thresholds */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-5 text-xs transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Credibility Scoring Engine Boundaries (0–100)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="FAKE Max Score Bound"
              type="number"
              value={fakeThreshold}
              onChange={(e) => setFakeThreshold(e.target.value)}
              helperText="Scores 0 to this boundary classified as FAKE"
            />
            <Input
              label="SUSPICIOUS Max Score Bound"
              type="number"
              value={suspiciousThreshold}
              onChange={(e) => setSuspiciousThreshold(e.target.value)}
              helperText="Boundary for SUSPICIOUS vs TRUSTED"
            />
            <Input
              label="VERIFIED Minimum Score"
              type="number"
              value={trustedThreshold}
              onChange={(e) => setTrustedThreshold(e.target.value)}
              helperText="Boundary for highest confidence VERIFIED"
            />
            <Input
              label="Auto-Flag for Review Threshold"
              type="number"
              value={autoFlagThreshold}
              onChange={(e) => setAutoFlagThreshold(e.target.value)}
              helperText="Submissions scoring below this automatically enter Review Queue"
            />
          </div>
        </div>

        {/* Module 2: AI Dispatch & Vision Engine */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-5 text-xs transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              AI Inference Engine & Vision Pipeline
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Default Verification Model"
              value={modelMode}
              onChange={(e) => setModelMode(e.target.value)}
              options={[
                { value: 'GEMINI_FLASH', label: 'Fast Verification Engine (Ultra Low Latency)' },
                { value: 'GEMINI_PRO', label: 'Deep Investigation Engine (Extended Synthesis)' },
                { value: 'HYBRID', label: 'Adaptive Hybrid (Fast + Deep Investigation on low confidence)' },
              ]}
            />

            <Input
              label="Sampling Temperature"
              type="number"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              helperText="Lower values (0.1–0.3) maximize factual consistency"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block">Multimodal Screenshot / OCR Pipeline</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Extract claims from Ghanaian WhatsApp flyers and memes</span>
            </div>
            <input
              type="checkbox"
              checked={ocrEngineEnabled}
              onChange={(e) => setOcrEngineEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Module 3: Security & Session Controls */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-5 text-xs transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Security Safeguards & Access Policy
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Admin Inactivity Session Timeout (Minutes)"
              type="number"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              helperText="Forces re-authentication after idle duration"
            />

            <div className="flex flex-col justify-center space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">Maintenance Mode</span>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="maintMode"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="maintMode" className="text-slate-600 dark:text-slate-400 cursor-pointer">
                  Restrict citizen ingestion during maintenance
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block">Mandatory 2FA for System Administrators</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Enforce TOTP authenticator app verification</span>
            </div>
            <input
              type="checkbox"
              checked={requireAdmin2FA}
              onChange={(e) => setRequireAdmin2FA(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Module 4: Notification Hooks & General */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-5 text-xs transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <BellRing className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Disinformation Dispatch Webhooks & Alerts
            </h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Platform Support / Liaison Email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />

            <Input
              label="Emergency Webhook Endpoint URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              helperText="Receives real-time JSON payloads for CRITICAL severity flags"
            />

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Immediate Email Alert for Viral Hoaxes</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Send high-priority notifications to fact-checker team</span>
              </div>
              <input
                type="checkbox"
                checked={criticalEmailAlerts}
                onChange={(e) => setCriticalEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
