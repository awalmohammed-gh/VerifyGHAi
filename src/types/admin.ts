import { Classification, ContentType, Severity, SourceStatus, Submission, VerificationResult } from './verification';
import { Role, UserStatus } from './auth';

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'NEW' | 'READ' | 'RESOLVED';
export type Verdict = 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIED';
export type ReviewDecision =
  | 'CONFIRMED'
  | 'CHANGED'
  | 'MARKED_VERIFIED'
  | 'MARKED_TRUSTED'
  | 'MARKED_SUSPICIOUS'
  | 'MARKED_FAKE'
  | 'MARKED_MISLEADING'
  | 'NEEDS_FURTHER_REVIEW';

export interface FactCheck {
  id: string;
  claim: string;
  verdict: Verdict;
  source: string;
  evidenceUrl?: string;
  explanation?: string;
  notes: string;
  date: string;
  verifiedBy: string;
  tags: string[];
  lastUpdated?: string;
  relatedSubmissionIds?: string[];
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  date: string;
  createdAt?: string;
  type: 'SPIKE' | 'SUSPICIOUS_SOURCE' | 'PROCESSING_FAILURE' | 'REVIEW_REQUIRED' | 'SYSTEM_WARNING' | 'BACKLOG';
  status?: AlertStatus;
  isActive?: boolean;
  isDismissed: boolean;
  relatedEntityId?: string;
  targetAudience?: string;
  createdBy?: string;
}

export type AlertItem = Alert;

export interface AuditLog {
  id: string;
  action: string;
  adminName: string;
  adminEmail: string;
  performedByName?: string;
  performedByRole?: string;
  targetType: 'USER' | 'SUBMISSION' | 'SOURCE' | 'FACT_CHECK' | 'SETTINGS' | 'SYSTEM' | 'REVIEW' | 'FLAG' | string;
  targetId: string;
  targetName: string;
  date: string;
  createdAt?: string;
  details: string;
  ipAddress?: string;
  sessionId?: string;
  metadata?: any;
}

export interface AdminReview {
  id: string;
  submissionId: string;
  submissionSnippet?: string;
  submission?: Submission;
  userName?: string;
  userEmail?: string;
  autoClassification: Classification;
  autoScore: number;
  confidence?: number;
  priority: Priority;
  flagReason: string;
  dateSubmitted?: string;
  reviewedBy?: string;
  reviewDate?: string;
  decision?: ReviewDecision;
  finalClassification?: Classification;
  adminNotes?: string;
  status: 'PENDING' | 'RESOLVED';
  assignedTo?: string;
  originalClassification?: Classification;
}

export type ReviewQueueItem = AdminReview;

export interface FlaggedContentItem {
  id: string;
  submissionId: string;
  contentPreview: string;
  sourceName: string;
  sourceDomain: string;
  classification: Classification;
  score: number;
  confidence: number;
  reason: string;
  priority: Priority;
  date: string;
  status: 'NEW' | 'INVESTIGATING' | 'REVIEWED' | 'DISMISSED' | 'ESCALATED';
  escalatedTo?: string;
  notes?: string;
  submission?: Submission;
}

export interface SystemStats {
  totalUsers: number;
  totalSubmissions: number;
  verifiedCount: number;
  trustedCount: number;
  suspiciousCount: number;
  fakeCount: number;
  pendingReviewsCount: number;
  flaggedCount: number;
  fakeRatio: number;
  activeSources: number;
  averageProcessingTimeMs?: number;
  accuracyRate?: number;
}

export interface ScoringWeights {
  contentAnalysis: number; // e.g. 50%
  sourceCredibility: number; // e.g. 30%
  evidenceAssessment: number; // e.g. 20%
}

export interface ClassificationThresholds {
  verifiedMin: number; // 80 - 100
  trustedMin: number; // 65 - 79
  suspiciousMin: number; // 40 - 64
  fakeMax: number; // 0 - 39
}

export interface ReviewSettings {
  lowConfidenceThreshold: number; // default e.g. 70%
  autoFlagSuspicious: boolean;
  autoFlagFake: boolean;
  highPrioritySourcesReview: boolean;
}

export interface NotificationSettings {
  flaggedSubmissionAlerts: boolean;
  reviewBacklogAlerts: boolean;
  systemErrorAlerts: boolean;
  suspiciousSourceAlerts: boolean;
  sourceUpdateAlerts: boolean;
}

export interface SystemSettings {
  systemName: string;
  tagline: string;
  thresholds: ClassificationThresholds;
  weights: ScoringWeights;
  defaultClassification: Classification;
  reviewSettings: ReviewSettings;
  notificationSettings: NotificationSettings;
  enableAutomaticFlagging: boolean;
  requireAdminReviewForSuspicious: boolean;
  emailNotifications: boolean;
  retentionDays: number;
}

export interface AIPerformanceMetric {
  precision: number;
  recall: number;
  f1: number;
  sampleSize: number;
}
