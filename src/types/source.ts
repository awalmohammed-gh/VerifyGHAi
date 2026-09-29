import { SourceStatus } from './verification';

export interface SourceHistoryItem {
  id: string;
  date: string;
  event: string;
  type: 'VERIFICATION' | 'MISINFORMATION_RECORD' | 'STATUS_CHANGE' | 'REVIEW';
  details: string;
}

export interface Source {
  id: string;
  name: string;
  domain: string;
  status: SourceStatus;
  credibilityScore: number;
  isVerified?: boolean;
  isOfficial?: boolean;
  misinformationRecords?: number;
  totalChecks: number;
  country?: string;
  category: string;
  lastUpdated?: string;
  lastEvaluated?: string;
  isArchived?: boolean;
  description: string;
  notes?: string;
  history?: SourceHistoryItem[];
}
