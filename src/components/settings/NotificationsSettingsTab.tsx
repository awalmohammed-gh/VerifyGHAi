import React, { useState } from 'react';
import {
  Bell,
  Mail,
  ShieldAlert,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Save,
  Radio,
  Sliders,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';

export const NotificationsSettingsTab: React.FC = () => {
  const { toast } = useToast();

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  // Additional verification & alert parameters
  const [healthHoaxAlerts, setHealthHoaxAlerts] = useState(true);
  const [autoOcrExtraction, setAutoOcrExtraction] = useState(true);
  const [strictScoringAlerts, setStrictScoringAlerts] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    setIsSaving(false);
    toast.success('Preferences Saved', 'Your notification and alert channels have been updated.');
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* General Notification Channels */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Communication & Alert Channels</h3>
          </div>
          <p className="text-xs text-slate-500">
            Choose which notifications you receive and how we deliver verification reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Alerts */}
          <label className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-xs group-hover:text-blue-600 transition-colors">
                  Email Alerts
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Receive weekly regional misinformation roundups and detailed PDF verification summaries.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 mt-1 cursor-pointer"
            />
          </label>

          {/* Push Notifications */}
          <label className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-xs group-hover:text-indigo-600 transition-colors">
                  Push Notifications
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Get instant real-time browser alerts when background forensic verification completes.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 mt-1 cursor-pointer"
            />
          </label>

          {/* Product Updates */}
          <label className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-xs group-hover:text-purple-600 transition-colors">
                  Product Updates & Features
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Monthly briefings regarding new AI forensic detection models and database additions.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={productUpdates}
              onChange={(e) => setProductUpdates(e.target.checked)}
              className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 mt-1 cursor-pointer"
            />
          </label>

          {/* Security Alerts */}
          <label className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-xs group-hover:text-amber-700 transition-colors">
                  Security & Access Alerts
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Immediate alerts regarding new sign-in locations, password changes, or API updates.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={securityAlerts}
              onChange={(e) => setSecurityAlerts(e.target.checked)}
              className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 mt-1 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Advanced Automated Rules */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Forensic & Ingestion Preferences</h3>
          </div>
          <p className="text-xs text-slate-500">
            Tailor sensitivity thresholds and automated pre-processing filters.
          </p>
        </div>

        <div className="space-y-4">
          <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 block text-xs mb-0.5">
                Emergency Viral Public Health Alerts
              </span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Prioritize urgent public health warnings and verified medical disclaimers in your feed.
              </p>
            </div>
            <input
              type="checkbox"
              checked={healthHoaxAlerts}
              onChange={(e) => setHealthHoaxAlerts(e.target.checked)}
              className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 block text-xs mb-0.5">
                Automatic Screenshot OCR Extraction
              </span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Automatically extract viral text from uploaded image flyers before initiating verification.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoOcrExtraction}
              onChange={(e) => setAutoOcrExtraction(e.target.checked)}
              className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 block text-xs mb-0.5">
                Strict Sensitivity Mode
              </span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Apply stricter thresholds to sensational headlines and unverified claims.
              </p>
            </div>
            <input
              type="checkbox"
              checked={strictScoringAlerts}
              onChange={(e) => setStrictScoringAlerts(e.target.checked)}
              className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <Button
            type="button"
            size="md"
            onClick={handleSaveNotifications}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Notification Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};
