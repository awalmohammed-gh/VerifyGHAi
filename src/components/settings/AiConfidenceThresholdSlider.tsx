import React from 'react';
import {
  SlidersHorizontal,
  ShieldCheck,
  Zap,
  Scale,
  Sparkles,
  RotateCcw,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { useAiConfidenceThreshold, VerificationMode } from '../../services/aiSettingsService';
import { useToast } from '../../context/ToastContext';

export interface AiConfidenceThresholdSliderProps {
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
  showPresets?: boolean;
  onThresholdChanged?: (newThreshold: number) => void;
}

export const AiConfidenceThresholdSlider: React.FC<AiConfidenceThresholdSliderProps> = ({
  className = '',
  variant = 'full',
  showPresets = true,
  onThresholdChanged,
}) => {
  const { threshold, percentage, mode, setThreshold, setMode, resetDefault } = useAiConfidenceThreshold();
  const { toast } = useToast();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = parseFloat(e.target.value);
    const newDecimal = rawVal / 100;
    setThreshold(newDecimal);
    onThresholdChanged?.(newDecimal);
  };

  const handleSelectMode = (targetMode: 'STRICT' | 'BALANCED' | 'LENIENT') => {
    setMode(targetMode);
    const label = targetMode === 'STRICT' ? 'Strict Mode (90%)' : targetMode === 'LENIENT' ? 'Lenient Mode (60%)' : 'Balanced Mode (75%)';
    toast.success('Verification Mode Changed', `AI threshold adjusted to ${label}.`);
    onThresholdChanged?.(targetMode === 'STRICT' ? 0.9 : targetMode === 'LENIENT' ? 0.6 : 0.75);
  };

  const handleReset = () => {
    resetDefault();
    toast.info('Default Restored', 'AI Confidence Threshold reset to standard 75% Balanced mode.');
    onThresholdChanged?.(0.75);
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'STRICT':
        return {
          title: 'Strict Verification Mode (High Rigor)',
          description:
            'Demands unequivocal evidence corroboration (≥90% certainty) across regional government registries and international wires before verifying claims. Marginal claims are held for human expert review.',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
          icon: ShieldCheck,
        };
      case 'LENIENT':
        return {
          title: 'Lenient / High-Recall Mode (Fast Screening)',
          description:
            'Optimized for fast-moving breaking news and emerging local rumors. Flags only high-confidence fabrications, allowing provisional claims to pass with informational context.',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
          icon: Zap,
        };
      case 'BALANCED':
      default:
        return {
          title: 'Balanced Mode (Recommended)',
          description:
            'Default benchmark (75% certainty) tuned specifically for Ghanaian and West African digital media ecosystems, balancing deep investigation and swift response times.',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
          icon: Scale,
        };
    }
  };

  const modeInfo = getModeDescription();
  const ModeIcon = modeInfo.icon;

  // Minimal / Inline Variant for Compact Drawers
  if (variant === 'minimal') {
    return (
      <div className={`space-y-2 text-left ${className}`}>
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            AI Confidence Threshold
          </span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {percentage}% ({mode})
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="95"
          step="1"
          value={percentage}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>Lenient (50%)</span>
          <span>Balanced (75%)</span>
          <span>Strict (95%)</span>
        </div>
      </div>
    );
  }

  // Compact Variant (e.g. For VerifyContentPage quick settings bar)
  if (variant === 'compact') {
    return (
      <div
        id="ai-confidence-threshold-compact-box"
        className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3 text-left ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Verification Sensitivity
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Mode: <strong className="text-slate-800 dark:text-slate-200">{mode}</strong> ({percentage}%)
              </span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleSelectMode('LENIENT')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mode === 'LENIENT'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Lenient
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode('BALANCED')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mode === 'BALANCED'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Balanced
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode('STRICT')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mode === 'STRICT'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Strict
            </button>
          </div>
        </div>

        <input
          id="confidence-threshold-slider-compact"
          type="range"
          min="50"
          max="95"
          step="1"
          value={percentage}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    );
  }

  // Full Rich Settings Card Variant (For SettingsPage)
  return (
    <div
      id="ai-confidence-threshold-settings-card"
      className={`rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6 text-left transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Confidence Threshold & Sensitivity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dynamically calibrate the model certainty required to mark claims as verified, trusted, or disputed.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Reset to 75% standard default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset (75%)</span>
          </button>
        </div>
      </div>

      {/* Mode Preset Selector */}
      {showPresets && (
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
            Verification Mode Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Lenient Mode */}
            <button
              type="button"
              onClick={() => handleSelectMode('LENIENT')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                mode === 'LENIENT'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 bg-white dark:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                  60% (0.60)
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Lenient / Fast</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  High-recall triage for breaking news. Flags only unambiguous fakes.
                </p>
              </div>
            </button>

            {/* Balanced Mode */}
            <button
              type="button"
              onClick={() => handleSelectMode('BALANCED')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                mode === 'BALANCED'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 bg-white dark:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                  75% (Default)
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Balanced (Standard)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  Recommended for general Ghanaian news, press releases, and articles.
                </p>
              </div>
            </button>

            {/* Strict Mode */}
            <button
              type="button"
              onClick={() => handleSelectMode('STRICT')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                mode === 'STRICT'
                  ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60 bg-white dark:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-100/60 dark:bg-purple-900/60 px-2 py-0.5 rounded-md">
                  90% (0.90)
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Strict / Investigative</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  Maximum scrutiny for statutory, legal, or electoral matters.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Dynamic Slider */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="ai-confidence-threshold-input"
            className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            Custom Threshold Slider
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Confidence Floor:
            </span>
            <span className="px-3 py-1 rounded-xl font-mono text-sm font-black bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-2xs">
              {percentage}% ({(threshold).toFixed(2)})
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="relative py-2">
          <input
            id="ai-confidence-threshold-input"
            type="range"
            min="50"
            max="95"
            step="1"
            value={percentage}
            onChange={handleSliderChange}
            className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />

          {/* Threshold Spectrum Indicators */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-1">
            <span className="text-emerald-600 dark:text-emerald-400">50% (Lenient)</span>
            <span className="text-blue-600 dark:text-blue-400">75% (Balanced Standard)</span>
            <span className="text-purple-600 dark:text-purple-400">95% (Maximum Rigor)</span>
          </div>
        </div>
      </div>

      {/* Active Behavioral Explainer Card */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${modeInfo.badgeColor} space-y-2 transition-all`}
      >
        <div className="flex items-center gap-2">
          <ModeIcon className="w-4 h-4 flex-shrink-0" />
          <h4 className="text-xs font-bold">{modeInfo.title}</h4>
        </div>
        <p className="text-xs leading-relaxed opacity-90">
          {modeInfo.description}
        </p>
        <div className="pt-2 text-[11px] font-mono opacity-75 border-t border-current/10">
          Rule: Assessments with model confidence below <strong>{percentage}%</strong> will trigger human escalation flags and precautionary caveats.
        </div>
      </div>
    </div>
  );
};
