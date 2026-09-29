import { ClassificationType, IAutomatedResult, IClaim, IEvidence, IIndicator, SubmissionType } from '../verification.types.js';
import { ISource } from '../source.types.js';

export type ReviewStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';

export interface IHumanReview {
  id?: string;
  reviewerId: string;
  reviewerName?: string;
  finalClassification: ClassificationType;
  finalCredibilityScore: number;
  reviewReason: string;
  reviewNotes?: string;
  reviewedAt: Date | string;
  reviewStatus: ReviewStatus;
}

export interface IReviewQueueItem {
  id: string;
  verificationId: string;
  userId: string;
  submissionType: SubmissionType;
  originalContent?: string;
  sourceUrl?: string;
  imageUrl?: string;
  automatedResult?: IAutomatedResult;
  claims: IClaim[];
  evidence: IEvidence[];
  sources: ISource[];
  indicators: IIndicator[];
  status: ReviewStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggerReason: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  assignedAt?: Date | string;
  humanReview?: IHumanReview;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateReviewDto {
  finalClassification: ClassificationType;
  finalCredibilityScore: number;
  reviewReason: string;
  reviewNotes?: string;
  reviewStatus?: ReviewStatus;
}

export interface UpdateReviewDto {
  finalClassification?: ClassificationType;
  finalCredibilityScore?: number;
  reviewReason?: string;
  reviewNotes?: string;
  reviewStatus?: ReviewStatus;
  assignedReviewerId?: string;
}
