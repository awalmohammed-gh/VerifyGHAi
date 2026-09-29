import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldAlert,
  AlertCircle,
  OctagonX,
} from 'lucide-react';
import { Classification, SourceStatus } from '../../types';

export type ExtendedCredibilityRating =
  | Classification
  | SourceStatus
  | 'VERIFIED'
  | 'TRUSTED'
  | 'LIKELY_FALSE'
  | 'DEBUNKED'
  | 'SUSPICIOUS'
  | 'FAKE'
  | 'MISLEADING'
  | 'PARTIALLY_TRUE'
  | 'UNRELIABLE'
  | 'UNKNOWN'
  | 'UNVERIFIED'
  | string;

export interface ClassificationBadgeProps {
  classification?: ExtendedCredibilityRating;
  sourceStatus?: SourceStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  customLabel?: string;
  subtext?: string;
  variant?: 'pill' | 'subtle' | 'outline' | 'filled';
  className?: string;
}

interface BadgeConfig {
  label: string;
  shortLabel: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
  accentDot: string;
  description: string;
}

const BADGE_CONFIGS: Record<string, BadgeConfig> = {
  VERIFIED: {
    label: 'VERIFIED',
    shortLabel: 'Verified',
    bg: 'bg-emerald-50 dark:bg-emerald-950/70',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700/80',
    icon: CheckCircle2,
    accentDot: 'bg-emerald-500',
    description: 'Corroborated by official registries, primary documents, or authenticated data.',
  },
  TRUSTED: {
    label: 'TRUSTED',
    shortLabel: 'Trusted',
    bg: 'bg-blue-50 dark:bg-blue-950/70',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700/80',
    icon: ShieldCheck,
    accentDot: 'bg-blue-500',
    description: 'Published by reputable, transparent newsrooms or certified institutions.',
  },
  LIKELY_FALSE: {
    label: 'LIKELY FALSE',
    shortLabel: 'Likely False',
    bg: 'bg-rose-50 dark:bg-rose-950/70',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-700/80',
    icon: AlertTriangle,
    accentDot: 'bg-rose-500',
    description: 'Significant contradictions or fabrication indicators detected.',
  },
  DEBUNKED: {
    label: 'DEBUNKED',
    shortLabel: 'Debunked',
    bg: 'bg-red-50 dark:bg-red-950/80',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-400 dark:border-red-700',
    icon: XCircle,
    accentDot: 'bg-red-500',
    description: 'Explicitly refuted by official statements, primary data, or fact-checkers.',
  },
  SUSPICIOUS: {
    label: 'SUSPICIOUS',
    shortLabel: 'Suspicious',
    bg: 'bg-amber-50 dark:bg-amber-950/70',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700/80',
    icon: AlertTriangle,
    accentDot: 'bg-amber-500',
    description: 'Displays sensationalist tone, missing citations, or questionable origins.',
  },
  FAKE: {
    label: 'FAKE / FABRICATED',
    shortLabel: 'Fake',
    bg: 'bg-red-50 dark:bg-red-950/80',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-400 dark:border-red-700',
    icon: ShieldAlert,
    accentDot: 'bg-red-500',
    description: 'Demonstrably false, synthetic, or manufactured disinformation.',
  },
  MISLEADING: {
    label: 'MISLEADING',
    shortLabel: 'Misleading',
    bg: 'bg-orange-50 dark:bg-orange-950/70',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-700/80',
    icon: AlertCircle,
    accentDot: 'bg-orange-500',
    description: 'Contains selective truths distorted or stripped of essential context.',
  },
  PARTIALLY_TRUE: {
    label: 'PARTIALLY TRUE',
    shortLabel: 'Partially True',
    bg: 'bg-yellow-50 dark:bg-yellow-950/60',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700/80',
    icon: HelpCircle,
    accentDot: 'bg-yellow-500',
    description: 'Core claim has truthful elements combined with unverified assertions.',
  },
  UNRELIABLE: {
    label: 'UNRELIABLE',
    shortLabel: 'Unreliable',
    bg: 'bg-rose-50 dark:bg-rose-950/70',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-700/80',
    icon: OctagonX,
    accentDot: 'bg-rose-500',
    description: 'Source has high historic rate of misinformation and no editorial standards.',
  },
  UNKNOWN: {
    label: 'UNVERIFIED',
    shortLabel: 'Unverified',
    bg: 'bg-slate-100 dark:bg-slate-800/80',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    icon: HelpCircle,
    accentDot: 'bg-slate-400',
    description: 'Insufficient independent corroborating evidence found in public databases.',
  },
  UNVERIFIED: {
    label: 'UNVERIFIED',
    shortLabel: 'Unverified',
    bg: 'bg-slate-100 dark:bg-slate-800/80',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    icon: HelpCircle,
    accentDot: 'bg-slate-400',
    description: 'Claim requires further primary source investigation.',
  },
};

export const ClassificationBadge: React.FC<ClassificationBadgeProps> = ({
  classification,
  sourceStatus,
  size = 'md',
  showIcon = true,
  customLabel,
  subtext,
  variant = 'pill',
  className = '',
}) => {
  const rawKey = (classification || sourceStatus || 'SUSPICIOUS').toString().toUpperCase().replace(/\s+/g, '_');
  const item = BADGE_CONFIGS[rawKey] || BADGE_CONFIGS.UNKNOWN;
  const Icon = item.icon;
  const displayLabel = customLabel || item.label;

  const sizeClasses = {
    xs: 'text-[9px] font-extrabold px-1.5 py-0.5 gap-1 tracking-wider',
    sm: 'text-[10px] font-bold px-2 py-0.5 gap-1.2 tracking-wider',
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

  if (subtext) {
    return (
      <div
        className={`inline-flex items-center gap-2 p-2 rounded-2xl border ${item.bg} ${item.border} ${className}`}
      >
        <div className={`p-1.5 rounded-xl bg-white dark:bg-slate-900 border ${item.border} ${item.text}`}>
          <Icon className={iconSizes[size]} />
        </div>
        <div className="text-left">
          <span className={`block font-black text-xs uppercase tracking-wider ${item.text}`}>
            {displayLabel}
          </span>
          <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {subtext}
          </span>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs uppercase whitespace-nowrap transition-all duration-150 ${sizeClasses[size]} ${item.bg} ${item.border} ${item.text} ${className}`}
      title={item.description}
    >
      {showIcon && <Icon className={`${iconSizes[size]} flex-shrink-0`} />}
      <span>{displayLabel}</span>
    </span>
  );
};

export { CredibilityBadge } from '../common/CredibilityBadge';
export default ClassificationBadge;
