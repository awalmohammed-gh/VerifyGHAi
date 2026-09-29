import mongoose, { Schema, Document, Model } from 'mongoose';
import { CommentTagType } from '../types/verification.types.js';

export interface ICommentReplyDocument {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  content: string;
  createdAt: Date;
}

export interface ICommentDocument extends Document {
  verificationId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  avatarUrl?: string;
  content: string;
  tag: CommentTagType;
  sourceUrl?: string;
  sourceDomain?: string;
  likes: string[];
  likesCount: number;
  replies: ICommentReplyDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentReplySchema = new Schema(
  {
    id: { type: String, required: true },
    commentId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String },
    userRole: { type: String, default: 'COMMUNITY' },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CommentSchema = new Schema<ICommentDocument>(
  {
    verificationId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
    userRole: {
      type: String,
      default: 'COMMUNITY',
    },
    avatarUrl: {
      type: String,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    tag: {
      type: String,
      enum: [
        'ADDITIONAL_CONTEXT',
        'COUNTER_EVIDENCE',
        'LOCAL_REPORT',
        'OFFICIAL_SOURCE',
        'GENERAL_DISCUSSION',
      ],
      default: 'GENERAL_DISCUSSION',
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    sourceDomain: {
      type: String,
      trim: true,
    },
    likes: {
      type: [String],
      default: [],
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    replies: {
      type: [CommentReplySchema],
      default: [],
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

export const CommentModel: Model<ICommentDocument> =
  (mongoose.models.Comment as Model<ICommentDocument>) ||
  mongoose.model<ICommentDocument>('Comment', CommentSchema);
