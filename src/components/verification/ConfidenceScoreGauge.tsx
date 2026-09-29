import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Classification } from '../../types';

export type CredibilityThresholdTier = 'HIGH_CREDIBILITY' | 'CAUTION' | 'MISINFORMATION';

export interface CredibilityThresholdConfig {
  tier: CredibilityThresholdTier;
  label: string;
  shortLabel: string;
  description: string;
  stroke: string;
  track: string;
  strokeDark: string;
  trackDark: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  badgeClasses: string;
  glowClasses: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Dynamically resolves the credibility threshold styling config based on score and classification.
 * Thresholds:
 * - Green (High Credibility): Score >= 70 or Classification VERIFIED / TRUSTED
 * - Yellow (Caution): Score >= 40 and < 70 or Classification SUSPICIOUS
 * - Red (Misinformation): Score < 40 or Classification FAKE / UNRELIABLE
 */
export function getCredibilityThreshold(
  score: number = 0,
  classification?: Classification | string
): CredibilityThresholdConfig {
  const normalizedClass = (classification || '').toUpperCase();

  // Explicit classification override or score-based threshold
  if (normalizedClass === 'FAKE' || normalizedClass === 'UNRELIABLE' || score < 40) {
    return {
      tier: 'MISINFORMATION',
      label: 'Misinformation',
      shortLabel: 'Misinformation',
      description: 'High likelihood of fabricated, misleading, or refuted claims.',
      stroke: '#ef4444', // red-500
      track: '#fee2e2',  // red-100
      strokeDark: '#f87171', // red-400
      trackDark: '#450a0a',  // red-950
      textClass: 'text-red-700 dark:text-red-400',
      bgClass: 'bg-red-50 dark:bg-red-950/60',
      borderClass: 'border-red-200 dark:border-red-800',
      badgeClasses: 'bg-red-50 text-red-700 border-red-200/90 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/80',
      glowClasses: 'shadow-red-500/10 ring-red-500/20',
      icon: AlertOctagon,
    };
  }

  if (
    normalizedClass === 'SUSPICIOUS' ||
    (score >= 40 && score < 70 && normalizedClass !== 'VERIFIED' && normalizedClass !== 'TRUSTED')
  ) {
    return {
      tier: 'CAUTION',
      label: 'Caution',
      shortLabel: 'Caution',
      description: 'Unverified elements, missing primary citations, or disputed context.',
      stroke: '#f59e0b', // amber-500
      track: '#fef3c7',  // amber-100
      strokeDark: '#fbbf24', // amber-400
      trackDark: '#451a03',  // amber-950
      textClass: 'text-amber-800 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/60',
      borderClass: 'border-amber-300 dark:border-amber-800',
      badgeClasses: 'bg-amber-50 text-amber-800 border-amber-300/90 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80',
      glowClasses: 'shadow-amber-500/10 ring-amber-500/20',
      icon: AlertTriangle,
    };
  }

  // Green / High Credibility (score >= 70 or VERIFIED / TRUSTED)
  return {
    tier: 'HIGH_CREDIBILITY',
    label: 'High Credibility',
    shortLabel: 'High Credibility',
    description: 'Corroborated by verified sources, high provenance, and official records.',
    stroke: '#10b981', // emerald-500
    track: '#d1fae5',  // emerald-100
    strokeDark: '#34d399', // emerald-400
    trackDark: '#022c22',  // emerald-950
    textClass: 'text-emerald-700 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    badgeClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80',
    glowClasses: 'shadow-emerald-500/10 ring-emerald-500/20',
    icon: ShieldCheck,
  };
}

export interface ConfidenceThresholdBadgeProps {
  score?: number;
  confidence?: number;
  classification?: Classification | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showScore?: boolean;
  showConfidence?: boolean;
  className?: string;
  customLabel?: string;
}

/**
 * Visual Badge that dynamically reflects credibility tier:
 * - Green for 'High Credibility'
 * - Yellow for 'Caution'
 * - Red for 'Misinformation'
 */
export const ConfidenceThresholdBadge: React.FC<ConfidenceThresholdBadgeProps> = ({
  score = 0,
  confidence,
  classification,
  size = 'md',
  showIcon = true,
  showScore = false,
  showConfidence = false,
  className = '',
  customLabel,
}) => {
  const threshold = getCredibilityThreshold(score, classification);
  const Icon = threshold.icon;

  const sizeClasses = {
    xs: 'text-[9px] font-extrabold px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] font-bold px-2 py-0.5 gap-1',
    md: 'text-xs font-bold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-extrabold px-3.5 py-1.5 gap-2',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const label = customLabel || threshold.label;

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs uppercase tracking-wider whitespace-nowrap transition-all duration-150 ${sizeClasses[size]} ${threshold.badgeClasses} ${className}`}
      title={`${threshold.label}: ${threshold.description} (Score: ${score}/100${confidence !== undefined ? `, Confidence: ${confidence}%` : ''})`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} flex-shrink-0`} />}
      <span>{label}</span>
      {showScore && (
        <span className="font-mono font-black ml-0.5 opacity-90">
          {score}/100
        </span>
      )}
      {showConfidence && confidence !== undefined && (
        <span className="text-[9px] font-mono opacity-80 border-l border-current/30 pl-1 ml-0.5">
          {confidence}% conf
        </span>
      )}
    </span>
  );
};

export interface ConfidenceScoreGaugeProps {
  score: number; // 0 - 100
  confidence?: number; // 0 - 100
  classification?: Classification | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'radial' | 'compact' | 'badge' | 'pill' | 'bar';
  showBadge?: boolean;
  showConfidence?: boolean;
  showScoreLabel?: boolean;
  className?: string;
  customLabel?: string;
}

export const ConfidenceScoreGauge: React.FC<ConfidenceScoreGaugeProps> = ({
  score = 0,
  confidence,
  classification,
  size = 'md',
  variant = 'radial',
  showBadge = true,
  showConfidence = false,
  showScoreLabel = true,
  className = '',
  customLabel,
}) => {
  const threshold = getCredibilityThreshold(score, classification);
  const Icon = threshold.icon;

  // Normalized score between 0 and 100
  const cleanScore = Math.max(0, Math.min(100, Math.round(score)));

  // Radial dimensions
  const radiusMap = {
    xs: 12,
    sm: 18,
    md: 28,
    lg: 44,
    xl: 56,
  };

  const strokeWidthMap = {
    xs: 2.5,
    sm: 3.5,
    md: 5,
    lg: 7,
    xl: 8.5,
  };

  const radius = radiusMap[size] || radiusMap.md;
  const strokeWidth = strokeWidthMap[size] || strokeWidthMap.md;
  const dimension = (radius + strokeWidth) * 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanScore / 100) * circumference;

  // Render Compact variant (ideal for search result items and table rows)
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg width={dimension} height={dimension} className="transform -rotate-90">
            <circle
              cx={dimension / 2}
              cy={dimension / 2}
              r={radius}
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={dimension / 2}
              cy={dimension / 2}
              r={radius}
              stroke={threshold.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span
            className={`absolute inset-0 flex items-center justify-center font-mono font-black ${threshold.textClass} ${
              size === 'xs' ? 'text-[9px]' : size === 'sm' ? 'text-[11px]' : 'text-xs'
            }`}
          >
            {cleanScore}
          </span>
        </div>

        {showBadge && (
          <ConfidenceThresholdBadge
            score={cleanScore}
            confidence={confidence}
            classification={classification}
            size={size === 'xs' || size === 'sm' ? 'xs' : 'sm'}
            showConfidence={showConfidence}
            customLabel={customLabel}
          />
        )}
      </div>
    );
  }

  // Render Pill variant
  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border ${threshold.bgClass} ${threshold.borderClass} ${className}`}
      >
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg width={24} height={24} className="transform -rotate-90">
            <circle
              cx={12}
              cy={12}
              r={9}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-700"
              strokeWidth={3}
              fill="transparent"
            />
            <circle
              cx={12}
              cy={12}
              r={9}
              stroke={threshold.stroke}
              strokeWidth={3}
              strokeDasharray={2 * Math.PI * 9}
              strokeDashoffset={2 * Math.PI * 9 - (cleanScore / 100) * 2 * Math.PI * 9}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span className={`text-xs font-black font-mono ${threshold.textClass}`}>
              {cleanScore}/100
            </span>
            <span className={`text-[10px] font-extrabold uppercase ${threshold.textClass}`}>
              • {threshold.label}
            </span>
          </div>
          {confidence !== undefined && (
            <span className="text-[10px] text-slate-400 font-mono">
              {confidence}% confidence
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render Bar variant
  if (variant === 'bar') {
    return (
      <div className={`space-y-1.5 w-full ${className}`}>
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <Icon className={`w-3.5 h-3.5 ${threshold.textClass}`} />
            <span className={`font-bold ${threshold.textClass}`}>{threshold.label}</span>
          </div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {cleanScore}/100
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${cleanScore}%`,
              backgroundColor: threshold.stroke,
            }}
          />
        </div>
        {confidence !== undefined && (
          <div className="flex justify-end text-[10px] text-slate-400 font-mono">
            Model Confidence: {confidence}%
          </div>
        )}
      </div>
    );
  }

  // Standard Radial Gauge
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <svg
          width={dimension}
          height={dimension}
          className="transform -rotate-90 transition-all duration-700 ease-out"
        >
          {/* Background circle track */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={threshold.track}
            strokeWidth={strokeWidth}
            fill="transparent"
            className="dark:opacity-30"
          />
          {/* Progress circle dynamically styled by threshold */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={threshold.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Inner number readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline justify-center">
            <span
              className={`font-black tracking-tight font-mono ${
                size === 'xl'
                  ? 'text-4xl'
                  : size === 'lg'
                  ? 'text-3xl'
                  : size === 'md'
                  ? 'text-xl'
                  : 'text-sm'
              } ${threshold.textClass}`}
            >
              {cleanScore}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">/100</span>
          </div>
          {showScoreLabel && (size === 'lg' || size === 'xl') && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
              Credibility
            </span>
          )}
        </div>
      </div>

      {showBadge && (
        <div className="flex flex-col items-center gap-1.5">
          <ConfidenceThresholdBadge
            score={cleanScore}
            confidence={confidence}
            classification={classification}
            size={size === 'lg' || size === 'xl' ? 'lg' : size === 'md' ? 'md' : 'sm'}
            customLabel={customLabel}
          />
          {confidence !== undefined && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Confidence:{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{confidence}%</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
