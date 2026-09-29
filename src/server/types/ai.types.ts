import {
  ClassificationType,
  ConfidenceLabel,
  IClaim,
  IEvidence,
  IIndicator,
  SubmissionType,
} from './verification.types.js';
import { ISource } from './source.types.js';

export interface ExtractedClaimResult {
  claims: Array<{
    id: string;
    text: string;
    context?: string;
  }>;
  coreTopic: string;
  summary: string;
  detectedLanguage?: string;
}

export interface ClaimAnalysisResult {
  classification: ClassificationType;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  credibilityScore: number;
  explanation: string;
  recommendation: string;
  warning: string | null;
  analyzedClaims: IClaim[];
  indicators: IIndicator[];
}

export interface AIServiceAssessmentInput {
  submissionType: SubmissionType;
  content: string;
  sourceUrl?: string;
  claims: Array<{ id: string; text: string }>;
  evidence: IEvidence[];
  sources: ISource[];
}

export interface AIServiceResponse {
  classification: ClassificationType;
  credibilityScore: number;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  explanation: string;
  recommendation: string;
  warning: string | null;
  claims: IClaim[];
  indicators: IIndicator[];
}
