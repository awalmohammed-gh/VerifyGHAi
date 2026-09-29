import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  OctagonX,
  Gauge,
} from 'lucide-react';
import { Classification, SourceStatus } from '../../types';

export type CredibilityStatus =
  | 'VERIFIED'
  | 'LIKELY_FALSE'
  | 'DEBUNKED'
  | 'TRUSTED'
  | 'SUSPICIOUS'
  | 'FAKE'
  | 'MISLEADING'
  | 'PARTIALLY_TRUE'
  | 'UNRELIABLE'
  | 'UNVERIFIED'
  | Classification
  | SourceStatus
  | string;

export interface CredibilityBadgeProps {
  /** Verification status or classification string (e.g., 'VERIFIED', 'LIKELY_FALSE', 'DEBUNKED') */
  status?: CredibilityStatus;
  /** Alias for status for compatibility */
  classification?: CredibilityStatus;
  /** Source status alias */
  sourceStatus?: SourceStatus;
  /** Numerical confidence score (0 - 100) used for styling and confidence level display */
  confidenceScore?: number;
  /** Numerical credibility score (0 - 100) */
  credibilityScore?: number;
  /** Alias for confidenceScore */
  confidence?: number;
  /** Alias for credibilityScore */
  score?: number;
  /** Visual badge size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Visual presentation style */
  variant?: 'pill' | 'subtle' | 'outline' | 'filled' | 'card';
  /** Whether to render the status icon */
  showIcon?: boolean;
  /** Whether to explicitly render the confidence score badge / percentage alongside */
  showConfidence?: boolean;
  /** Whether to display the credibility score (e.g. 94/100) */
  showScore?: boolean;
  /** Custom label override (replaces default status text) */
  customLabel?: string;
  /** Custom label alias */
  label?: string;
  /** Explanatory subtext below the badge (renders in card or detailed mode) */
  subtext?: string;
  /** Custom className to extend or override styling */
  className?: string;
  /** Optional click handler */
  onClick?: (e: React.MouseEvent) => void;
}

interface StatusVisualConfig {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  filledBg: string;
  text: string;
  fillText: string;
  border: string;
  accentDot: string;
  description: string;
  confidenceBadgeBg: string;
  confidenceBadgeText: string;
}

const STATUS_CONFIGS: Record<string, StatusVisualConfig> = {
  VERIFIED: {
    label: 'VERIFIED',
    shortLabel: 'Verified',
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-950/70',
    filledBg: 'bg-emerald-600 dark:bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    fillText: 'text-white dark:text-slate-950',
    border: 'border-emerald-300 dark:border-emerald-700/80',
    accentDot: 'bg-emerald-500',
    description: 'Corroborated by official registries, primary documents, or authenticated institutional data.',
    confidenceBadgeBg: 'bg-emerald-100 dark:bg-emerald-900/80',
    confidenceBadgeText: 'text-emerald-800 dark:text-emerald-200',
  },
  LIKELY_FALSE: {
    label: 'LIKELY FALSE',
    shortLabel: 'Likely False',
    icon: AlertTriangle,
    bg: 'bg-rose-50 dark:bg-rose-950/70',
    filledBg: 'bg-rose-600 dark:bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    fillText: 'text-white dark:text-slate-950',
    border: 'border-rose-300 dark:border-rose-700/80',
    accentDot: 'bg-rose-500',
    description: 'Significant factual contradictions, missing authentic proof, or fabrication indicators detected.',
    confidenceBadgeBg: 'bg-rose-100 dark:bg-rose-900/80',
    confidenceBadgeText: 'text-rose-800 dark:text-rose-200',
  },
  DEBUNKED: {
    label: 'DEBUNKED',
    shortLabel: 'Debunked',
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-950/80',
    filledBg: 'bg-red-600 dark:bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    fillText: 'text-white dark:text-slate-950',
    border: 'border-red-400 dark:border-red-700',
    accentDot: 'bg-red-500',
    description: 'Explicitly refuted by official government statements, primary records, or certified fact-checkers.',
    confidenceBadgeBg: 'bg-red-100 dark:bg-red-900/80',
    confidenceBadgeText: 'text-red-800 dark:text-red-200',
  },
  TRUSTED: {
    label: 'TRUSTED',
    shortLabel: 'Trusted',
    icon: ShieldCheck,
    bg: 'bg-blue-50 dark:bg-blue-950/70',
    filledBg: 'bg-blue-600 dark:bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    fillText: 'text-white dark:text-slate-950',
    border: 'border-blue-300 dark:border-blue-700/80',
    accentDot: 'bg-blue-500',
    description: 'Published by reputable, verified institutions or accredited editorial organizations.',
    confidenceBadgeBg: 'bg-blue-100 dark:bg-blue-900/80',
    confidenceBadgeText: 'text-blue-800 dark:text-blue-200',
  },
  SUSPICIOUS: {
    label: 'SUSPICIOUS',
    shortLabel: 'Suspicious',
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/70',
    filledBg: 'bg-amber-600 dark:bg-amber-500',
    text: 'text-amber-800 dark:text-amber-300',
    fillText: 'text-white dark:text-slate-950',
    border: 'border-amber-300 dark:border-amber-700/80',
    accentDot: 'bg-amber-500',
    description: 'Displays clickbait markers, manipulative emotional tone, or unverified secondary claims.',
    confidenceBadgeBg: 'bg-amber-100 dark:bg-amber-900/80',
    confidenceBadgeText: 'text-amber-800 dark:text-amber-200',
  },
  FAKE: {
    label: 'FAKE',
    shortLabel: 'Fake',
    icon: ShieldAlert,
    bg: 'bg-red-50 dark:bg-red-950/80',
    filledBg: 'bg-red-600 dark:bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    fillText: 'text-white dark:text-slate-950',
    border: 'border-red-400 dark:border-red-700',
    accentDot: 'bg-red-500',
    description: 'Completely synthetic, fabricated, or deceptive content created with malicious intent.',
    confidenceBadgeBg: 'bg-red-100 dark:bg-red-900/80',
    confidenceBadgeText: 'text-red-800 dark:text-red-200',
  },
  MISLEADING: {
    label: 'MISLEADING',
    shortLabel: 'Misleading',
    icon: AlertCircle,
    bg: 'bg-orange-50 dark:bg-orange-950/70',
    filledBg: 'bg-orange-600 dark:bg-orange-500',
    text: 'text-orange-800 dark:text-orange-300',
    fillText: 'text-white dark:text-slate-950',
    border: 'border-orange-300 dark:border-orange-700/80',
    accentDot: 'bg-orange-500',
    description: 'Contains selective truths framed out of context to produce false conclusions.',
    confidenceBadgeBg: 'bg-orange-100 dark:bg-orange-900/80',
    confidenceBadgeText: 'text-orange-800 dark:text-orange-200',
  },
  PARTIALLY_TRUE: {
    label: 'PARTIALLY TRUE',
    shortLabel: 'Partially True',
    icon: HelpCircle,
    bg: 'bg-yellow-50 dark:bg-yellow-950/60',
    filledBg: 'bg-yellow-600 dark:bg-yellow-500',
    text: 'text-yellow-800 dark:text-yellow-300',
    fillText: 'text-white dark:text-slate-950',
    border: 'border-yellow-300 dark:border-yellow-700/80',
    accentDot: 'bg-yellow-500',
    description: 'Some elements are accurate while other details are inaccurate or uncorroborated.',
    confidenceBadgeBg: 'bg-yellow-100 dark:bg-yellow-900/80',
    confidenceBadgeText: 'text-yellow-800 dark:text-yellow-200',
  },
  UNRELIABLE: {
    label: 'UNRELIABLE',
    shortLabel: 'Unreliable',
    icon: OctagonX,
    bg: 'bg-rose-50 dark:bg-rose-950/70',
    filledBg: 'bg-rose-600 dark:bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    fillText: 'text-white dark:text-slate-950',
    border: 'border-rose-300 dark:border-rose-700/80',
    accentDot: 'bg-rose-500',
    description: 'Source or claim has a history of publishing unverified claims without retraction.',
    confidenceBadgeBg: 'bg-rose-100 dark:bg-rose-900/80',
    confidenceBadgeText: 'text-rose-800 dark:text-rose-200',
  },
  UNVERIFIED: {
    label: 'UNVERIFIED',
    shortLabel: 'Unverified',
    icon: HelpCircle,
    bg: 'bg-slate-100 dark:bg-slate-800/80',
    filledBg: 'bg-slate-600 dark:bg-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    fillText: 'text-white dark:text-slate-950',
    border: 'border-slate-300 dark:border-slate-700',
    accentDot: 'bg-slate-400',
    description: 'Insufficient independent corroborating evidence found in public databases.',
    confidenceBadgeBg: 'bg-slate-200 dark:bg-slate-700',
    confidenceBadgeText: 'text-slate-800 dark:text-slate-200',
  },
};

/**
 * Normalizes input status string or derives status from credibility score.
 */
function resolveStatusKey(
  rawStatus?: string,
  credibilityScore?: number,
  score?: number
): string {
  if (rawStatus && rawStatus.trim().length > 0) {
    const cleaned = rawStatus.toUpperCase().trim().replace(/[-\s]+/g, '_');
    if (STATUS_CONFIGS[cleaned]) return cleaned;
    if (cleaned.includes('DEBUNK')) return 'DEBUNKED';
    if (cleaned.includes('FALSE')) return 'LIKELY_FALSE';
    if (cleaned.includes('VERIF')) return 'VERIFIED';
    if (cleaned.includes('TRUST')) return 'TRUSTED';
    if (cleaned.includes('SUSPIC')) return 'SUSPICIOUS';
    if (cleaned.includes('FAKE')) return 'FAKE';
    if (cleaned.includes('MISLEAD')) return 'MISLEADING';
    return 'UNVERIFIED';
  }

  const effectiveScore = credibilityScore ?? score;
  if (effectiveScore !== undefined) {
    if (effectiveScore >= 75) return 'VERIFIED';
    if (effectiveScore >= 45) return 'SUSPICIOUS';
    if (effectiveScore >= 25) return 'LIKELY_FALSE';
    return 'DEBUNKED';
  }

  return 'UNVERIFIED';
}

export const CredibilityBadge: React.FC<CredibilityBadgeProps> = ({
  status,
  classification,
  sourceStatus,
  confidenceScore,
  credibilityScore,
  confidence,
  score,
  size = 'md',
  variant = 'pill',
  showIcon = true,
  showConfidence = false,
  showScore = false,
  customLabel,
  label,
  subtext,
  className = '',
  onClick,
}) => {
  const rawStatus = (status || classification || sourceStatus || label || '').toString();
  const effectiveConfidence = confidenceScore ?? confidence;
  const effectiveScore = credibilityScore ?? score;
  const statusKey = resolveStatusKey(rawStatus, effectiveScore, score);
  const config = STATUS_CONFIGS[statusKey] || STATUS_CONFIGS.UNVERIFIED;
  const Icon = config.icon;
  const displayLabel = customLabel || label || config.label;

  // Confidence styling modifier
  const getConfidenceLevel = (val?: number): 'high' | 'medium' | 'low' | 'unknown' => {
    if (val === undefined) return 'unknown';
    if (val >= 85) return 'high';
    if (val >= 60) return 'medium';
    return 'low';
  };

  const confidenceLevel = getConfidenceLevel(effectiveConfidence);

  // Size specific metrics
  const sizeClasses = {
    xs: 'text-[9px] font-extrabold px-1.5 py-0.5 gap-1 tracking-wider',
    sm: 'text-[10px] font-bold px-2 py-0.5 gap-1.5 tracking-wider',
    md: 'text-xs font-bold px-2.5 py-1 gap-1.5 tracking-wider',
    lg: 'text-sm font-black px-3.5 py-1.5 gap-2 tracking-wider',
    xl: 'text-base font-black px-4 py-2 gap-2.5 tracking-wide',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const confidenceChipSizes = {
    xs: 'text-[8px] px-1 py-0.2',
    sm: 'text-[9px] px-1.5 py-0.2',
    md: 'text-[10px] px-1.5 py-0.5 font-mono',
    lg: 'text-xs px-2 py-0.5 font-mono',
    xl: 'text-xs px-2.5 py-0.5 font-mono font-bold',
  };

  // Card / Detailed mode with subtext
  if (variant === 'card' || subtext) {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-3 p-3 rounded-2xl border ${config.bg} ${config.border} ${
          onClick ? 'cursor-pointer hover:shadow-xs transition-shadow' : ''
        } ${className}`}
      >
        <div
          className={`p-2 rounded-xl bg-white dark:bg-slate-900 border ${config.border} ${config.text} shadow-2xs flex-shrink-0`}
        >
          <Icon className={iconSizes[size]} />
        </div>
        <div className="text-left space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-black text-xs sm:text-sm uppercase tracking-wider ${config.text}`}>
              {displayLabel}
            </span>
            {effectiveConfidence !== undefined && (
              <span
                className={`inline-flex items-center gap-1 font-mono rounded-md font-bold ${config.confidenceBadgeBg} ${config.confidenceBadgeText} ${confidenceChipSizes.sm}`}
              >
                <Gauge className="w-2.5 h-2.5" />
                {effectiveConfidence}% Conf.
              </span>
            )}
            {effectiveScore !== undefined && showScore && (
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                Score: {effectiveScore}/100
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
            {subtext || config.description}
          </p>
        </div>
      </div>
    );
  }

  // Variant classes
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return `${config.filledBg} ${config.fillText} border-transparent shadow-xs`;
      case 'outline':
        return `bg-transparent ${config.border} ${config.text} border`;
      case 'subtle':
        return `${config.bg} ${config.text} border-transparent`;
      case 'pill':
      default:
        return `${config.bg} ${config.border} ${config.text} border shadow-2xs`;
    }
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded-full uppercase whitespace-nowrap transition-all duration-150 select-none ${
        sizeClasses[size]
      } ${getVariantStyles()} ${onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''} ${className}`}
      title={config.description}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Status Icon */}
      {showIcon && (
        <Icon
          className={`${iconSizes[size]} flex-shrink-0 ${
            variant === 'filled' ? 'text-white dark:text-slate-950' : ''
          }`}
          aria-hidden="true"
        />
      )}

      {/* Main Status Text */}
      <span className="font-extrabold">{displayLabel}</span>

      {/* Confidence Score Pill */}
      {(showConfidence || effectiveConfidence !== undefined) && effectiveConfidence !== null && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full font-mono font-bold ml-1 ${
            variant === 'filled'
              ? 'bg-black/20 text-white'
              : `${config.confidenceBadgeBg} ${config.confidenceBadgeText}`
          } ${confidenceChipSizes[size]}`}
        >
          {effectiveConfidence}%
        </span>
      )}

      {/* Credibility Score Display */}
      {showScore && effectiveScore !== undefined && effectiveScore !== null && (
        <span
          className={`font-mono font-bold ml-1 ${
            variant === 'filled' ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {effectiveScore}/100
        </span>
      )}
    </span>
  );
};

export default CredibilityBadge;
