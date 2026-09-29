import mongoose, { Schema, Document, Model } from 'mongoose';
import { ClassificationType } from '../types/verification.types.js';
import { FactCheckStatus } from '../types/admin/fact-check.types.js';

export interface IFactCheckDocument extends Document {
  title: string;
  claim: string;
  classification: ClassificationType;
  summary: string;
  evidence: any[];
  sources: any[];
  publishedDate: Date;
  createdBy: mongoose.Types.ObjectId | string;
  creatorName?: string;
  updatedBy: mongoose.Types.ObjectId | string;
  status: FactCheckStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FactCheckSchema = new Schema<IFactCheckDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    claim: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    classification: {
      type: String,
      enum: ['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED'],
      required: true,
      index: true,
    },
    summary: {
      type: String,
      required: true,
    },
    evidence: {
      type: [Schema.Types.Mixed as any],
      default: [],
    },
    sources: {
      type: [Schema.Types.Mixed as any],
      default: [],
    },
    publishedDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.Mixed,
      required: true,
    },
    creatorName: {
      type: String,
      default: 'VerifAI GH Fact-Checker',
    },
    updatedBy: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id?.toString() || ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

FactCheckSchema.index({ title: 'text', claim: 'text', summary: 'text' });
FactCheckSchema.index({ status: 1, classification: 1, createdAt: -1 });

export const FactCheckModel: Model<IFactCheckDocument> =
  (mongoose.models.FactCheck as Model<IFactCheckDocument>) ||
  mongoose.model<IFactCheckDocument>('FactCheck', FactCheckSchema);
