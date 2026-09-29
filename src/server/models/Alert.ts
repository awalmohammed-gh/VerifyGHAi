import mongoose, { Schema, Document, Model } from 'mongoose';
import { AlertSeverity, AlertStatus, AlertType } from '../types/admin/alert.types.js';

export interface IAlertDocument extends Document {
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  relatedVerificationId?: mongoose.Types.ObjectId | string;
  relatedUserId?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId | string;
  resolverName?: string;
  resolutionNotes?: string;
}

const AlertSchema = new Schema<IAlertDocument>(
  {
    type: {
      type: String,
      enum: [
        'VERIFICATION_FAILURE',
        'LOW_CONFIDENCE',
        'HIGH_RISK',
        'SYSTEM_ERROR',
        'SUSPICIOUS_ACTIVITY',
        'REVIEW_REQUIRED',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
      index: true,
    },
    relatedVerificationId: {
      type: Schema.Types.Mixed,
      required: false,
    },
    relatedUserId: {
      type: Schema.Types.Mixed,
      required: false,
    },
    resolvedAt: {
      type: Date,
      required: false,
    },
    resolvedBy: {
      type: Schema.Types.Mixed,
      required: false,
    },
    resolverName: {
      type: String,
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

AlertSchema.index({ status: 1, severity: 1, createdAt: -1 });

export const AlertModel: Model<IAlertDocument> =
  (mongoose.models.Alert as Model<IAlertDocument>) ||
  mongoose.model<IAlertDocument>('Alert', AlertSchema);
