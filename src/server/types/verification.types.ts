import { ISource, SourceStatus } from './source.types.js';

export type SubmissionType = 'TEXT' | 'ARTICLE_URL' | 'SCREENSHOT' | 'DOCUMENT';

export type VerificationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PENDING_REVIEW'
  | 'REVIEWED';

export type ClassificationType =
  | 'VERIFIED'
  | 'TRUSTED'
  | 'SUSPICIOUS'
  | 'FAKE'
  | 'UNVERIFIED';

export type ConfidenceLabel = 'LOW' | 'MEDIUM' | 'HIGH';

export type EvidenceType = 'SUPPORTING' | 'CONTRADICTING' | 'CONTEXT';

export interface IClaim {
  id: string;
  text: string;
  classification: ClassificationType;
  confidence: number;
  explanation: string;
}

export interface IEvidence {
  title: string;
  description: string;
  url?: string;
  type: EvidenceType;
  supportsClaim?: boolean;
  credibility: number;
  publishedAt?: string;
  sourceId?: string;
  sourceName?: string;
}

export interface IIndicator {
  type: string;
  label: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface IKeyIndicatorItem {
  type: 'Red Flag' | 'Green Flag' | 'Warning' | string;
  indicator: string;
}

export interface IVerificationSource {
  id?: string;
  sourceName?: string;
  domain: string;
  articleTitle?: string;
  title?: string;
  url: string;
  publicationDate?: string;
  publishedDate?: string;
  credibilityStatus?: 'TRUSTED' | 'UNKNOWN' | 'SUSPICIOUS' | string;
  reliability?: 'High' | 'Official Registry' | 'Medium' | 'Low' | 'Unverified' | string;
  relationship?: 'SUPPORTING' | 'CONTRADICTING' | 'MENTIONING' | string;
  snippet?: string;
  relevanceScore?: number;
  matchedClaim?: string;
  query?: string;
}

export interface IContentCharacteristics {
  emotionalTone: 'Sensationalist / High Alarm' | 'Neutral / Objective' | 'Opinionated' | string;
  languagePatterns: string[];
  sourceCredibilityScore: 'High' | 'Medium' | 'Low' | 'Unverified' | string;
  visualMediaIntegrity: 'Authentic' | 'Digitally Manipulated' | 'Out of Context' | 'No Media Provided' | string;
  keyIndicators: IKeyIndicatorItem[];
}

export interface ISourceTraceNode {
  name: string;
  domain?: string;
  url?: string;
  publishedDate?: string;
  headline?: string;
  summary?: string;
  credibilityScore?: number;
  status?: string;
  isAvailable?: boolean;
}

export interface ISourceTrace {
  submittedSource: ISourceTraceNode;
  earliestSource: ISourceTraceNode;
  otherSources: ISourceTraceNode[];
  supportingEvidence: ISourceTraceNode[];
  contradictingEvidence: ISourceTraceNode[];
  traceConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  propagationFlow?: string[];
  notes?: string;
}

export interface IAutomatedResult {
  classification: ClassificationType;
  credibilityScore: number;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  explanation: string;
  recommendation: string;
  warning: string | null;
  summary?: string;
  contentCharacteristics?: IContentCharacteristics;
  verificationSources?: IVerificationSource[];
  keyIndicators?: string[];
  extractedClaims?: string[];
  recommendedAction?: string;
  explanationPoints?: string[];
  evaluatedAt?: Date;
  category?: string;
  sourceTrace?: ISourceTrace;
}

export interface IHumanReviewData {
  reviewerId: string;
  reviewerName?: string;
  finalClassification: ClassificationType;
  finalCredibilityScore: number;
  reviewReason: string;
  reviewNotes?: string;
  reviewedAt: Date | string;
  reviewStatus: 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';
}

export interface IVerification {
  _id?: string;
  id: string;
  customId?: string;
  userId: string;
  submissionType: SubmissionType;
  originalContent?: string;
  submittedContent?: string;
  submittedUrl?: string;
  sourceUrl?: string;
  imageUrl?: string;
  screenshotUrl?: string;
  status: VerificationStatus;
  
  // AI Assessment Root Fields
  aiClassification?: 'FAKE' | 'TRUSTED' | 'RISK' | 'UNVERIFIED' | 'VERIFIED' | 'SUSPICIOUS';
  aiRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' | 'CRITICAL';
  aiCredibilityScore?: number;
  aiConfidenceScore?: number;
  aiExplanation?: string;
  sourceTrace?: ISourceTrace;

  // Admin Override Root Fields
  adminClassification?: 'FAKE' | 'TRUSTED' | 'RISK' | 'UNVERIFIED' | 'VERIFIED' | 'SUSPICIOUS';
  adminRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' | 'CRITICAL';
  adminCredibilityScore?: number;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date | string;

  automatedResult?: IAutomatedResult;
  humanReview?: IHumanReviewData;
  reviewStatus?: 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  assignedAt?: Date | string;
  triggerReason?: string;
  claims: IClaim[];
  evidence: IEvidence[];
  sources: ISource[];
  verificationSources?: IVerificationSource[];
  indicators?: IIndicator[];
  explanation?: string;
  recommendation?: string;
  warning?: string | null;
  processingError?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateVerificationDto {
  submissionType: SubmissionType;
  content?: string;
  sourceUrl?: string;
  imageUrl?: string;
}

export interface VerificationFilterOptions {
  userId: string;
  page?: number;
  limit?: number;
  classification?: ClassificationType;
  type?: SubmissionType;
  search?: string;
  from?: string;
  to?: string;
}

export interface IReport {
  _id?: string;
  id: string;
  userId: string;
  verificationId: string;
  title: string;
  summary?: string;
  keyFindings?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type NotificationType =
  | 'VERIFICATION_COMPLETED'
  | 'VERIFICATION_FAILED'
  | 'LOW_CONFIDENCE'
  | 'WARNING'
  | 'SYSTEM';

export interface INotification {
  _id?: string;
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  relatedVerificationId?: string;
  createdAt: Date | string;
}

export interface UserStatistics {
  totalVerifications: number;
  verified: number;
  trusted: number;
  suspicious: number;
  fake: number;
  unverified: number;
  averageCredibilityScore: number;
  recentActivity: Array<{
    id: string;
    type: SubmissionType;
    title: string;
    classification: ClassificationType;
    credibilityScore: number;
    createdAt: Date | string;
  }>;
}

export type CommentTagType =
  | 'ADDITIONAL_CONTEXT'
  | 'COUNTER_EVIDENCE'
  | 'LOCAL_REPORT'
  | 'OFFICIAL_SOURCE'
  | 'GENERAL_DISCUSSION';

export interface IVerificationCommentReply {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  content: string;
  createdAt: Date | string;
}

export interface IVerificationComment {
  id: string;
  _id?: string;
  verificationId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: 'ADMIN' | 'FACT_CHECKER' | 'JOURNALIST' | 'USER' | 'COMMUNITY' | string;
  avatarUrl?: string;
  content: string;
  tag?: CommentTagType;
  sourceUrl?: string;
  sourceDomain?: string;
  likes: string[];
  likesCount: number;
  replies?: IVerificationCommentReply[];
  createdAt: Date | string;
  updatedAt?: Date | string;
}
