import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  ClassificationType,
  ConfidenceLabel,
  EvidenceType,
  IClaim,
  IEvidence,
  IHumanReviewData,
  IIndicator,
  IVerificationSource,
  SubmissionType,
  VerificationStatus,
} from '../types/verification.types.js';
import { ISource } from '../types/source.types.js';

export interface IVerificationDocument extends Document {
  customId?: string;
  userId: mongoose.Types.ObjectId | string;
  submissionType: SubmissionType;
  submittedContent?: string;
  submittedUrl?: string;
  screenshotUrl?: string;
  originalContent: string;
  sourceUrl?: string;
  imageUrl?: string;
  status: VerificationStatus;
  
  // AI initial assessment fields
  aiClassification?: 'FAKE' | 'TRUSTED' | 'RISK' | 'UNVERIFIED' | 'VERIFIED' | 'SUSPICIOUS';
  aiRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' | 'CRITICAL';
  aiCredibilityScore?: number;
  aiConfidenceScore?: number;
  aiExplanation?: string;
  sourceTrace?: any;

  // Admin Override fields
  adminClassification?: 'FAKE' | 'TRUSTED' | 'RISK' | 'UNVERIFIED' | 'VERIFIED' | 'SUSPICIOUS';
  adminRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' | 'CRITICAL';
  adminCredibilityScore?: number;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;

  automatedResult?: {
    classification: ClassificationType;
    credibilityScore: number;
    confidence: number;
    confidenceLabel: ConfidenceLabel;
    explanation: string;
    recommendation: string;
    warning?: string | null;
    verificationSources?: IVerificationSource[];
  };
  humanReview?: IHumanReviewData;
  reviewStatus?: 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';
  assignedReviewerId?: mongoose.Types.ObjectId | string;
  assignedReviewerName?: string;
  assignedAt?: Date;
  triggerReason?: string;
  claims: IClaim[];
  evidence: IEvidence[];
  sources: ISource[];
  verificationSources?: IVerificationSource[];
  indicators: IIndicator[];
  explanation?: string;
  recommendation?: string;
  warning?: string | null;
  processingError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    classification: {
      type: String,
      enum: ['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED'],
      default: 'UNVERIFIED',
    },
    confidence: { type: Number, default: 0.5 },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const EvidenceSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    url: { type: String, default: '' },
    type: {
      type: String,
      enum: ['SUPPORTING', 'CONTRADICTING', 'CONTEXT'],
      default: 'CONTEXT',
    },
    supportsClaim: { type: Boolean, default: false },
    credibility: { type: Number, default: 50 },
    publishedAt: { type: String, default: '' },
    sourceId: { type: String, default: '' },
    sourceName: { type: String, default: '' },
  },
  { _id: false }
);

const IndicatorSchema = new Schema(
  {
    type: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
  },
  { _id: false }
);

const VerificationSourceSchema = new Schema(
  {
    id: { type: String },
    sourceName: { type: String, default: '' },
    domain: { type: String, required: true },
    articleTitle: { type: String, default: '' },
    title: { type: String, default: '' },
    url: { type: String, required: true },
    publicationDate: { type: String, default: '' },
    publishedDate: { type: String, default: '' },
    credibilityStatus: {
      type: String,
      enum: ['TRUSTED', 'UNKNOWN', 'SUSPICIOUS'],
      default: 'TRUSTED',
    },
    reliability: { type: String, default: 'High' },
    relationship: {
      type: String,
      enum: ['SUPPORTING', 'CONTRADICTING', 'MENTIONING'],
      default: 'SUPPORTING',
    },
    snippet: { type: String, default: '' },
    relevanceScore: { type: Number, default: 85 },
    matchedClaim: { type: String, default: '' },
    query: { type: String, default: '' },
  },
  { _id: false }
);

const AutomatedResultSchema = new Schema(
  {
    classification: {
      type: String,
      enum: ['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED'],
      required: true,
      default: 'UNVERIFIED',
    },
    credibilityScore: { type: Number, required: true, min: 0, max: 100, default: 50 },
    confidence: { type: Number, required: true, min: 0, max: 1, default: 0.5 },
    confidenceLabel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    explanation: { type: String, default: '' },
    recommendation: { type: String, default: '' },
    warning: { type: String, default: null },
    verificationSources: { type: [VerificationSourceSchema], default: [] },
  },
  { _id: false }
);

const HumanReviewSchema = new Schema(
  {
    reviewerId: { type: Schema.Types.Mixed, required: true },
    reviewerName: { type: String, default: '' },
    finalClassification: {
      type: String,
      enum: ['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED'],
      required: true,
    },
    finalCredibilityScore: { type: Number, required: true, min: 0, max: 100 },
    reviewReason: { type: String, required: true },
    reviewNotes: { type: String, default: '' },
    reviewedAt: { type: Date, default: Date.now },
    reviewStatus: {
      type: String,
      enum: ['PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED'],
      default: 'COMPLETED',
    },
  },
  { _id: false }
);

const VerificationSchema = new Schema<IVerificationDocument>(
  {
    customId: {
      type: String,
      index: true,
    },
    userId: {
      type: Schema.Types.Mixed,
      required: [true, 'User reference ID is required'],
      index: true,
    },
    submissionType: {
      type: String,
      enum: ['TEXT', 'ARTICLE_URL', 'SCREENSHOT', 'URL', 'IMAGE_OCR', 'DOCUMENT'],
      required: true,
      index: true,
    },
    submittedContent: {
      type: String,
      default: '',
    },
    submittedUrl: {
      type: String,
      default: '',
    },
    screenshotUrl: {
      type: String,
      default: '',
    },
    originalContent: {
      type: String,
      default: '',
    },
    sourceUrl: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'PENDING_REVIEW',
        'REVIEWED',
      ],
      default: 'PENDING',
      index: true,
    },
    aiClassification: {
      type: String,
      enum: ['FAKE', 'TRUSTED', 'RISK', 'UNVERIFIED', 'VERIFIED', 'SUSPICIOUS'],
      default: 'UNVERIFIED',
    },
    aiRiskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN', 'CRITICAL'],
      default: 'LOW',
    },
    aiCredibilityScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    aiConfidenceScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    aiExplanation: {
      type: String,
      default: '',
    },
    sourceTrace: {
      type: Schema.Types.Mixed,
      default: {},
    },
    adminClassification: {
      type: String,
      enum: ['FAKE', 'TRUSTED', 'RISK', 'UNVERIFIED', 'VERIFIED', 'SUSPICIOUS'],
      required: false,
    },
    adminRiskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN', 'CRITICAL'],
      required: false,
    },
    adminCredibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      required: false,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
      required: false,
    },
    automatedResult: {
      type: AutomatedResultSchema,
    },
    humanReview: {
      type: HumanReviewSchema,
      required: false,
    },
    reviewStatus: {
      type: String,
      enum: ['PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED'],
      required: false,
      index: true,
    },
    assignedReviewerId: {
      type: Schema.Types.Mixed,
      required: false,
    },
    assignedReviewerName: {
      type: String,
      required: false,
    },
    assignedAt: {
      type: Date,
      required: false,
    },
    triggerReason: {
      type: String,
      required: false,
    },
    claims: {
      type: [ClaimSchema],
      default: [],
    },
    evidence: {
      type: [EvidenceSchema],
      default: [],
    },
    sources: {
      type: [Schema.Types.Mixed as any],
      default: [],
    },
    verificationSources: {
      type: [VerificationSourceSchema],
      default: [],
    },
    indicators: {
      type: [IndicatorSchema],
      default: [],
    },
    explanation: {
      type: String,
      default: '',
    },
    recommendation: {
      type: String,
      default: '',
    },
    warning: {
      type: String,
      default: null,
    },
    processingError: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret.customId || ret._id?.toString() || ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for optimal queries
VerificationSchema.index({ userId: 1, createdAt: -1 });
VerificationSchema.index({ userId: 1, status: 1 });
VerificationSchema.index({ 'automatedResult.classification': 1 });
VerificationSchema.index({ 'automatedResult.confidence': 1 });
VerificationSchema.index({ createdAt: -1 });
VerificationSchema.index({ status: 1, createdAt: -1 });

export const VerificationModel: Model<IVerificationDocument> =
  (mongoose.models.Verification as Model<IVerificationDocument>) ||
  mongoose.model<IVerificationDocument>('Verification', VerificationSchema);
