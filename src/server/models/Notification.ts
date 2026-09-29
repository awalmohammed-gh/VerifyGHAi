import mongoose, { Schema, Document, Model } from 'mongoose';
import { NotificationType } from '../types/verification.types.js';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  relatedVerificationId?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'VERIFICATION_COMPLETED',
        'VERIFICATION_FAILED',
        'SYSTEM_UPDATE',
        'LOW_CONFIDENCE',
        'WARNING',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedVerificationId: {
      type: Schema.Types.Mixed,
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

export const NotificationModel: Model<INotificationDocument> =
  (mongoose.models.Notification as Model<INotificationDocument>) ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);
