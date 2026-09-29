export interface TimeSeriesPoint {
  date: string;
  total: number;
  verified: number;
  trusted: number;
  suspicious: number;
  fake: number;
}

export interface ContentTypeDistribution {
  name: string;
  value: number;
  percentage: number;
}

export interface ClassificationDistribution {
  name: string;
  value: number;
  color: string;
}

export interface UserAnalytics {
  totalSubmissions: number;
  verifiedCount: number;
  trustedCount: number;
  suspiciousCount: number;
  fakeCount: number;
  averageCredibilityScore: number;
  categoryBreakdown: Record<string, number>;
  recentActivityTrend: { month: string; count: number }[];
}

export interface AnalyticsData {
  totalSubmissions: number;
  totalUsers: number;
  growthRate: number;
  averageCredibilityScore: number;
  averageProcessingTimeMs: number;
  submissionTrends: TimeSeriesPoint[];
  classificationDistribution: ClassificationDistribution[];
  contentTypeDistribution: ContentTypeDistribution[];
  topCheckedSources: { name: string; domain: string; count: number; avgScore: number }[];
  mostSuspiciousSources: { name: string; domain: string; count: number; fakeRatio: number }[];
}

export interface ConfusionMatrix {
  trueVerified: number;
  falseVerified: number;
  trueTrusted: number;
  falseTrusted: number;
  trueSuspicious: number;
  falseSuspicious: number;
  trueFake: number;
  falseFake: number;
}

export interface AIPerformanceData {
  timeframe?: string;
  totalAIAssessments?: number;
  lowConfidenceAssessments?: number;
  lowConfidenceRate?: number;
  humanReviewedAssessments?: number;
  aiOverrideCount?: number;
  aiOverridePercentage?: number;
  averageConfidence?: number;
  averageCredibilityScore?: number;
  aiClassificationDistribution?: Record<string, number>;
  humanFinalClassificationDistribution?: Record<string, number>;
  overrideBreakdown?: Array<{
    aiClassification: string;
    humanFinalClassification: string;
    count: number;
  }>;
  modelVersion?: string;
  evaluationDate?: string;
  isDemoSampleData?: boolean;
  datasetSize?: number;
  overallAccuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  confusionMatrix?: ConfusionMatrix;
  classMetrics?: {
    classification: string;
    precision: number;
    recall: number;
    f1: number;
    sampleCount: number;
  }[];
  indicatorAccuracy?: {
    indicator: string;
    accuracy: number;
    confidence: number;
  }[];
}
