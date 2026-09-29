import { VerificationResult, Classification, ContentType } from './verification';

export interface SavedReport {
  id: string;
  userId: string;
  resultId: string;
  title: string;
  contentPreview: string;
  contentType: ContentType;
  classification: Classification;
  score: number;
  sourceDomain?: string;
  savedAt: string;
  notes?: string;
  result: VerificationResult;
}
