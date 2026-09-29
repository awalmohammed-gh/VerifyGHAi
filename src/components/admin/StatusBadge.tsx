import React from 'react';
import { SourceStatus, UserStatus, Verdict, AlertStatus } from '../../types';
import { CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, HelpCircle, XCircle, Clock, Check } from 'lucide-react';

type GeneralStatus =
  | SourceStatus
  | UserStatus
  | Verdict
  | AlertStatus
  | 'COMPLETED'
  | 'PROCESSING'
  | 'PENDING_REVIEW'
  | 'REVIEWED'
  | 'FLAGGED'
  | 'FAILED'
  | 'INVESTIGATING'
  | 'DISMISSED'
  | 'ESCALATED';

interface StatusBadgeProps {
  status: GeneralStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getConfig = () => {
    switch (status) {
      // Verified / Active / True / Completed
      case 'VERIFIED':
      case 'ACTIVE':
      case 'TRUE':
      case 'COMPLETED':
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          label: status,
        };

      // Trusted / Reviewed
      case 'TRUSTED':
      case 'REVIEWED':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: ShieldCheck,
          label: status,
        };

      // Suspicious / Misleading / Medium Warning / Investigating / Pending
      case 'SUSPICIOUS':
      case 'MISLEADING':
      case 'PENDING_REVIEW':
      case 'INVESTIGATING':
      case 'NEW':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertTriangle,
          label: status.replace('_', ' '),
        };

      // Fake / Unreliable / Suspended / False / Failed / Flagged
      case 'FAKE':
      case 'UNRELIABLE':
      case 'SUSPENDED':
      case 'FALSE':
      case 'FLAGGED':
      case 'FAILED':
      case 'ESCALATED':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: ShieldAlert,
          label: status,
        };

      // Processing / Clock
      case 'PROCESSING':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: Clock,
          label: 'PROCESSING',
        };

      // Unknown / Unverified / Dismissed / Read
      case 'UNKNOWN':
      case 'UNVERIFIED':
      case 'INACTIVE':
      case 'DISMISSED':
      case 'READ':
      default:
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: HelpCircle,
          label: status,
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
