import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Bot,
  ShieldCheck,
  Zap,
  Scale,
  Sparkles,
  Globe,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { AiConfidenceThresholdSlider } from './AiConfidenceThresholdSlider';
import { useAiConfidenceThreshold } from '../../services/aiSettingsService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';

export const AiEngineSettingsTab: React.FC = () => {
  const { threshold, percentage, mode } = useAiConfidenceThreshold();
  const { toast } = useToast();

  const [deepGrounding, setDeepGrounding] = useState(true);
  const [crossReferenceMin, setCrossReferenceMin] = useState(3);
  const [strictDisinformation, setStrictDisinformation] = useState(true);
  const [multilingualDialectSupport, setMultilingualDialectSupport] = useState(true);

  const handleSavePreferences = () => {
    toast.success('AI Engine Preferences Saved', 'Verification pipeline calibrated with active threshold settings.');
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-2 transition-colors">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            AI Engine & Verification Sensitivity
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure model confidence thresholds, toggle between strict and lenient verification modes, and calibrate real-time fact-checking rigor.
        </p>
      </div>

      {/* Main Dynamic Slider Component */}
      <AiConfidenceThresholdSlider />

      {/* Additional Engine Capabilities */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6 transition-colors">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Investigation & Grounding Parameters
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Secondary parameters applied across all automated verification checks.
          </p>
        </div>

        <div className="space-y-4">
          {/* Deep Web Grounding */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Real-Time Web & Registry Grounding
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Queries live Ghanaian statutory registries (Electoral Commission, BoG, MoF, Ghana Health Service) alongside Google Search grounding.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
              <input
                type="checkbox"
                checked={deepGrounding}
                onChange={(e) => setDeepGrounding(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Strict Disinformation Escalation */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Strict Disinformation Flagging
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automatically attaches cautionary banners to claims containing unverified statistical or medical declarations.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
              <input
                type="checkbox"
                checked={strictDisinformation}
                onChange={(e) => setStrictDisinformation(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Local Language & Dialect Support */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Ghanaian Multilingual & Dialect Analysis
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enables contextual understanding for Ghanaian Pidgin, Akan/Twi, Ga, and Ewe slang in circulating social media messages.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
              <input
                type="checkbox"
                checked={multilingualDialectSupport}
                onChange={(e) => setMultilingualDialectSupport(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            type="button"
            variant="primary"
            onClick={handleSavePreferences}
            className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save AI Engine Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};
