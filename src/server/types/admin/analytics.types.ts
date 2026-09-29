import { ClassificationType, SubmissionType } from '../verification.types.js';

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface PlatformAnalytics {
  timeframe: string;
  users: {
    total: number;
    growthRate: number;
    activeUsers: number;
    suspendedUsers: number;
    newUsersTimeline: TimeSeriesPoint[];
  };
  verifications: {
    total: number;
    growthRate: number;
    completed: number;
    processing: number;
    failed: number;
    pendingReview: number;
    successRate: number;
    timeline: TimeSeriesPoint[];
  };
  classificationDistribution: Record<ClassificationType, number>;
  submissionTypeDistribution: Record<SubmissionType, number>;
  qualityMetrics: {
    averageCredibilityScore: number;
    averageConfidence: number;
    lowConfidencePercentage: number;
    reviewRate: number;
    humanOverrideRate: number;
  };
}

export interface AIPerformanceAnalytics {
  timeframe: string;
  totalAIAssessments: number;
  lowConfidenceAssessments: number;
  lowConfidenceRate: number;
  humanReviewedAssessments: number;
  aiOverrideCount: number;
  aiOverridePercentage: number;
  averageConfidence: number;
  averageCredibilityScore: number;
  aiClassificationDistribution: Record<ClassificationType, number>;
  humanFinalClassificationDistribution: Record<ClassificationType, number>;
  overrideBreakdown: Array<{
    aiClassification: ClassificationType;
    humanFinalClassification: ClassificationType;
    count: number;
  }>;
}
