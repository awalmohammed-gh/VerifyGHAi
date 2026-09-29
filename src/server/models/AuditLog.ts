import mongoose, { Schema, Document, Model } from 'mongoose';
import { AuditAction, AuditResourceType, IAuditLog } from '../types/admin/audit.types.js';

export interface IAuditLogDocument extends Document {
  adminId: mongoose.Types.ObjectId | string;
  adminEmail?: string;
  adminName?: string;
  action: AuditAction | string;
  resourceType: AuditResourceType | string;
  resourceId: string;
  targetResource?: string;
  previousState?: any;
  newState?: any;
  reason?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    adminId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      default: '',
    },
    adminName: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    targetResource: {
      type: String,
      default: '',
    },
    previousState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    newState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable append-only audit trail
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id?.toString() || ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ adminId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });

export const AuditLogModel: Model<IAuditLogDocument> =
  (mongoose.models.AuditLog as Model<IAuditLogDocument>) ||
  mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
