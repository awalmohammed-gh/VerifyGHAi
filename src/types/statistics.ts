import { Classification, ContentType } from './verification';

export interface UserPersonalStats {
  totalVerifications: number;
  verifiedCount: number;
  trustedCount: number;
  suspiciousCount: number;
  fakeCount: number;
  averageScore: number;
  mostCheckedType: string;
  checksThisWeek: number;
  checksThisMonth: number;
  recentWarningsCount: number;
  activityHistory: {
    period: '7D' | '30D' | '90D';
    data: { date: string; checks: number; suspicious: number }[];
  }[];
  classificationDistribution: {
    name: Classification;
    value: number;
    color: string;
  }[];
}

export interface UserActivityRecord {
  id: string;
  type: ContentType | string;
  title: string;
  classification: Classification | 'UNVERIFIED';
  credibilityScore: number;
  createdAt: string | Date;
}

export interface TrustScoreTrendPoint {
  key: string;
  date: string;
  fullDate: string;
  timestamp: number;
  trustScore: number;
  rollingScore: number;
  submissions: number;
  verified: number;
  trusted: number;
  suspicious: number;
  fake: number;
  benchmark: number;
  tier: 'EXEMPLARY' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface TrustScoreSummary {
  currentScore: number;
  initialScore: number;
  trendDelta: number;
  trendPercentage: number;
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
  peakScore: number;
  lowestScore: number;
  stabilityScore: number;
  totalEvaluated: number;
  rating: 'High Reliability' | 'Moderate Trust' | 'Caution Advised' | 'Low Reliability' | string;
}

export interface UserApiStatistics {
  totalVerifications: number;
  verified: number;
  trusted: number;
  suspicious: number;
  fake: number;
  unverified: number;
  averageCredibilityScore: number;
  recentActivity: UserActivityRecord[];
  categoryBreakdown?: Record<string, number>;
  recentActivityTrend?: Array<{ month: string; count: number }>;
  trustScoreTrend?: TrustScoreTrendPoint[];
  trustScoreSummary?: TrustScoreSummary;
}

