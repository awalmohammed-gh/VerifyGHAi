export type Classification = 'VERIFIED' | 'TRUSTED' | 'SUSPICIOUS' | 'FAKE';

export type ContentType = 'TEXT' | 'ARTICLE_URL' | 'SCREENSHOT';

export type SourceStatus = 'VERIFIED' | 'TRUSTED' | 'UNKNOWN' | 'SUSPICIOUS' | 'UNRELIABLE';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export type EmotionalTone =
  | 'Sensationalist / High Alarm'
  | 'Neutral / Objective'
  | 'Opinionated'
  | string;

export type SourceCredibilityScoreLabel =
  | 'High'
  | 'Medium'
  | 'Low'
  | 'Unverified'
  | string;

export type VisualMediaIntegrity =
  | 'Authentic'
  | 'Digitally Manipulated'
  | 'Out of Context'
  | 'No Media Provided'
  | string;

export type KeyIndicatorType = 'Red Flag' | 'Green Flag' | 'Warning';

export interface KeyIndicatorItem {
  type: KeyIndicatorType;
  indicator: string;
}

export interface ContentCharacteristics {
  emotionalTone: EmotionalTone;
  languagePatterns: string[];
  sourceCredibilityScore: SourceCredibilityScoreLabel;
  visualMediaIntegrity: VisualMediaIntegrity;
  keyIndicators: KeyIndicatorItem[];
}

export interface Indicator {
  id: string;
  name: string;
  level: Severity;
  score: number; // 0 - 100
  description: string;
}

export interface Claim {
  id: string;
  text: string;
  status: 'VERIFIED' | 'UNSUPPORTED' | 'REQUIRES_VERIFICATION' | 'CONTRADICTED';
  details?: string;
  evidenceRef?: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  source: string;
  url?: string;
  relevance: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
}

export interface EvidenceAssessment {
  availability: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  description: string;
  supportingEvidence: EvidenceItem[];
  counterEvidence: EvidenceItem[];
}

export interface SourceCredibility {
  name: string;
  domain: string;
  status: SourceStatus;
  credibilityScore: number; // 0 - 100
  isVerified: boolean;
  previousMisinformationCount: number;
  description?: string;
  country?: string;
}

export interface VerificationSource {
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

export interface SourceTraceNode {
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

export interface SourceTrace {
  submittedSource: SourceTraceNode;
  earliestSource: SourceTraceNode;
  otherSources: SourceTraceNode[];
  supportingEvidence: SourceTraceNode[];
  contradictingEvidence: SourceTraceNode[];
  traceConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  propagationFlow?: string[];
  notes?: string;
}

export interface VerificationResult {
  id: string;
  submissionId: string;
  score: number; // 0 - 100
  credibilityScore?: number;
  aiCredibilityScore?: number;
  classification: Classification;
  confidence: number; // 0 - 100%
  confidenceScore?: number;
  aiConfidenceScore?: number;
  summary: string;
  contentType: ContentType;
  submissionType?: ContentType;
  inputContent: string;
  submittedContent?: string;
  inputUrl?: string;
  inputImageName?: string;
  createdAt: string;
  status?: 'COMPLETED' | 'PROCESSING' | 'PENDING_REVIEW' | 'REVIEWED' | 'FAILED' | string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  aiRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  aiExplanation?: string;
  source: SourceCredibility;
  indicators: Indicator[];
  contentCharacteristics?: ContentCharacteristics;
  verificationSources?: VerificationSource[];
  referencedTrustedSources?: string[];
  claims: Claim[];
  evidence: EvidenceAssessment;
  explanations: string[];
  recommendation: string;
  category?: string;
  sourceTrace?: SourceTrace;
  humanReview?: {
    reviewerId: string;
    reviewerName?: string;
    finalClassification: Classification | string;
    finalCredibilityScore: number;
    reviewReason: string;
    reviewNotes?: string;
    reviewedAt: string;
    reviewStatus?: string;
  };
  aiClassification?: string;
}

export interface VerificationCommentReply {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  content: string;
  createdAt: string;
}

export type CommentTag =
  | 'ADDITIONAL_CONTEXT'
  | 'COUNTER_EVIDENCE'
  | 'LOCAL_REPORT'
  | 'OFFICIAL_SOURCE'
  | 'GENERAL_DISCUSSION';

export interface VerificationComment {
  id: string;
  verificationId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: 'ADMIN' | 'FACT_CHECKER' | 'JOURNALIST' | 'USER' | 'COMMUNITY' | string;
  avatarUrl?: string;
  content: string;
  tag?: CommentTag;
  sourceUrl?: string;
  sourceDomain?: string;
  likes: string[];
  likesCount: number;
  replies?: VerificationCommentReply[];
  createdAt: string;
  updatedAt?: string;
}

export interface Submission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  contentType: ContentType;
  contentPreview: string;
  fullContent: string;
  url?: string;
  imageUrl?: string;
  createdAt: string;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING_REVIEW' | 'REVIEWED' | 'FLAGGED' | 'FAILED';
  result?: VerificationResult;
  sourceTrace?: SourceTrace;
  humanReview?: any;
}
