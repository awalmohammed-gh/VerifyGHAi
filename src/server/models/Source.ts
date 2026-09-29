import mongoose, { Schema, Document, Model } from 'mongoose';
import { SourceStatus } from '../types/source.types.js';

export interface ISourceDocument extends Document {
  name: string;
  domain: string;
  description: string;
  credibilityScore: number;
  status: SourceStatus;
  verificationStatus?: string;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SourceSchema = new Schema<ISourceDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    credibilityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },
    status: {
      type: String,
      enum: ['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'UNRELIABLE', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    verificationStatus: {
      type: String,
      default: 'UNVERIFIED',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
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

export const SourceModel: Model<ISourceDocument> =
  (mongoose.models.Source as Model<ISourceDocument>) ||
  mongoose.model<ISourceDocument>('Source', SourceSchema);
