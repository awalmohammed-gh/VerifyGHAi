import { ClassificationType, SubmissionType, VerificationStatus } from '../verification.types.js';
import { UserRole, UserStatus } from '../user.types.js';

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    admins?: number;
    newLast30Days?: number;
  };
  verifications: {
    total: number;
    completed: number;
    processing: number;
    failed: number;
    pendingReview: number;
    reviewed?: number;
  };
  classifications: {
    verified: number;
    trusted: number;
    suspicious: number;
    fake: number;
    unverified: number;
  };
  qualityMetrics?: {
    averageCredibilityScore: number;
    averageConfidence: number;
    lowConfidenceCount: number;
    humanOverrideCount: number;
    totalSources: number;
    totalFactChecks: number;
  };
  systemHealth?: {
    databaseConnected: boolean;
    aiServiceOnline: boolean;
    searchApiOnline: boolean;
    uptimeSeconds: number;
    nodeVersion: string;
    environment: string;
  };
  recentVerifications?: any[];
  pendingReviews?: any[];
  recentAlerts?: any[];
  recentAuditLogs?: any[];
}

export interface AdminUserFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  role?: UserRole;
  sort?: string;
}

export interface AdminVerificationFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: VerificationStatus;
  classification?: ClassificationType;
  type?: SubmissionType;
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  from?: string;
  to?: string;
}
