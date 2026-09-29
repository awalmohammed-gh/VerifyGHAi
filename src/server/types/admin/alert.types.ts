export type AlertType =
  | 'VERIFICATION_FAILURE'
  | 'LOW_CONFIDENCE'
  | 'HIGH_RISK'
  | 'SYSTEM_ERROR'
  | 'SUSPICIOUS_ACTIVITY'
  | 'REVIEW_REQUIRED';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface IAlert {
  _id?: string;
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  relatedVerificationId?: string;
  relatedUserId?: string;
  createdAt: Date | string;
  resolvedAt?: Date | string;
  resolvedBy?: string;
  resolverName?: string;
  resolutionNotes?: string;
}

export interface AlertFilterOptions {
  page?: number;
  limit?: number;
  type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  search?: string;
}
