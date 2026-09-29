import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Scale,
  FileCheck,
  Camera,
  Tag,
  Eye,
  Info,
} from 'lucide-react';
import { ContentCharacteristics, KeyIndicatorItem } from '../../types';
import { Badge } from '../common/Badge';

export interface ContentCharacteristicsCardProps {
  characteristics?: ContentCharacteristics;
  classification?: string;
  className?: string;
}

export const ContentCharacteristicsCard: React.FC<ContentCharacteristicsCardProps> = ({
  characteristics,
  classification = 'VERIFIED',
  className = '',
}) => {
  if (!characteristics) {
    return null;
  }

  const {
    emotionalTone = 'Neutral / Objective',
    languagePatterns = [],
    sourceCredibilityScore = 'High',
    visualMediaIntegrity = 'No Media Provided',
    keyIndicators = [],
  } = characteristics;

  // Emotional Tone helper
  const getEmotionalToneConfig = (tone: string) => {
    const lower = tone.toLowerCase();
    if (lower.includes('sensationalist') || lower.includes('alarm') || lower.includes('high')) {
      return {
        variant: 'danger' as const,
        icon: <Flame className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />,
        bgCard: 'bg-red-50/50 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/40',
        label: tone,
      };
    }
    if (lower.includes('opinionated') || lower.includes('slanted') || lower.includes('biased')) {
      return {
        variant: 'warning' as const,
        icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
        bgCard: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40',
        label: tone,
      };
    }
    return {
      variant: 'success' as const,
      icon: <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
      bgCard: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40',
      label: tone || 'Neutral / Objective',
    };
  };

  // Source Credibility helper
  const getSourceCredibilityConfig = (score: string) => {
    const lower = score.toLowerCase();
    if (lower.includes('high')) {
      return {
        variant: 'success' as const,
        icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
        bgCard: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40',
      };
    }
    if (lower.includes('med')) {
      return {
        variant: 'warning' as const,
        icon: <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
        bgCard: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40',
      };
    }
    if (lower.includes('low')) {
      return {
        variant: 'danger' as const,
        icon: <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />,
        bgCard: 'bg-red-50/50 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/40',
      };
    }
    return {
      variant: 'neutral' as const,
      icon: <AlertCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />,
      bgCard: 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60',
    };
  };

  // Visual Media helper
  const getMediaIntegrityConfig = (integrity: string) => {
    const lower = integrity.toLowerCase();
    if (lower.includes('manipulated') || lower.includes('fake') || lower.includes('deepfake')) {
      return {
        variant: 'danger' as const,
        icon: <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />,
        bgCard: 'bg-red-50/50 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/40',
      };
    }
    if (lower.includes('context') || lower.includes('misleading')) {
      return {
        variant: 'warning' as const,
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
        bgCard: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40',
      };
    }
    if (lower.includes('authentic') || lower.includes('original')) {
      return {
        variant: 'success' as const,
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
        bgCard: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40',
      };
    }
    return {
      variant: 'neutral' as const,
      icon: <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />,
      bgCard: 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60',
    };
  };

  // Key Indicator Flag styling
  const renderIndicatorFlagBadge = (type: KeyIndicatorItem['type']) => {
    switch (type) {
      case 'Red Flag':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800 flex-shrink-0">
            <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
            Red Flag
          </span>
        );
      case 'Green Flag':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex-shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Green Flag
          </span>
        );
      case 'Warning':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex-shrink-0">
            <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Warning
          </span>
        );
    }
  };

  const toneConfig = getEmotionalToneConfig(emotionalTone);
  const credConfig = getSourceCredibilityConfig(sourceCredibilityScore);
  const mediaConfig = getMediaIntegrityConfig(visualMediaIntegrity);

  return (
    <div
      id="content-characteristics-card"
      className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-5 transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Content Characteristics & Indicators
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Linguistic profiling, tone assessment, and forensic signal patterns
            </p>
          </div>
        </div>
        <Badge variant="neutral" size="sm" icon={<Eye className="w-3 h-3 text-slate-500" />}>
          Signal Analysis
        </Badge>
      </div>

      {/* Overview Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Emotional Tone */}
        <div
          id="badge-emotional-tone"
          className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${toneConfig.bgCard}`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Emotional Tone
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant={toneConfig.variant} size="sm" icon={toneConfig.icon}>
              {toneConfig.label}
            </Badge>
          </div>
        </div>

        {/* Source Credibility Score */}
        <div
          id="badge-source-credibility"
          className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${credConfig.bgCard}`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Source Credibility
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant={credConfig.variant} size="sm" icon={credConfig.icon}>
              {sourceCredibilityScore}
            </Badge>
          </div>
        </div>

        {/* Visual Media Integrity */}
        <div
          id="badge-media-integrity"
          className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${mediaConfig.bgCard}`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Visual Media Integrity
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant={mediaConfig.variant} size="sm" icon={mediaConfig.icon}>
              {visualMediaIntegrity}
            </Badge>
          </div>
        </div>
      </div>

      {/* Language Patterns Section */}
      {languagePatterns.length > 0 && (
        <div id="language-patterns-section" className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Detected Language Patterns:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {languagePatterns.map((pattern, idx) => (
              <span
                key={`lang_pat_${idx}`}
                id={`pattern-chip-${idx}`}
                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Indicators List */}
      {keyIndicators.length > 0 && (
        <div id="key-indicators-section" className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Key Forensic Indicators:</span>
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {keyIndicators.length} {keyIndicators.length === 1 ? 'signal' : 'signals'} evaluated
            </span>
          </div>

          <div className="space-y-2">
            {keyIndicators.map((item, idx) => (
              <div
                key={`key_ind_${idx}`}
                id={`indicator-item-${idx}`}
                className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center gap-2.5 justify-between"
              >
                <div className="flex items-start sm:items-center gap-2.5">
                  {renderIndicatorFlagBadge(item.type)}
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                    {item.indicator}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
