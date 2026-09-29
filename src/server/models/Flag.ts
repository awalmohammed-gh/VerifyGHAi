import mongoose, { Schema, Document, Model } from 'mongoose';
import { FlagReason, FlagStatus } from '../types/admin/flag.types.js';

export interface IFlagDocument extends Document {
  verificationId: mongoose.Types.ObjectId | string;
  reportedBy: mongoose.Types.ObjectId | string;
  reporterName?: string;
  reason: FlagReason;
  description: string;
  status: FlagStatus;
  resolvedBy?: mongoose.Types.ObjectId | string;
  resolverName?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FlagSchema = new Schema<IFlagDocument>(
  {
    verificationId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    reportedBy: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    reporterName: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      enum: [
        'INCORRECT_RESULT',
        'MISLEADING_INFORMATION',
        'INSUFFICIENT_EVIDENCE',
        'WRONG_SOURCE',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    resolvedBy: {
      type: Schema.Types.Mixed,
      required: false,
    },
    resolverName: {
      type: String,
      required: false,
    },
    resolvedAt: {
      type: Date,
      required: false,
    },
    resolutionNotes: {
      type: String,
      required: false,
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

FlagSchema.index({ status: 1, createdAt: -1 });

export const FlagModel: Model<IFlagDocument> =
  (mongoose.models.Flag as Model<IFlagDocument>) ||
  mongoose.model<IFlagDocument>('Flag', FlagSchema);
