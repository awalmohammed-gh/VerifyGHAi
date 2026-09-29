import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReportDocument extends Document {
  userId: mongoose.Types.ObjectId | string;
  verificationId: mongoose.Types.ObjectId | string;
  title: string;
  summary: string;
  keyFindings: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReportDocument>(
  {
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    verificationId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
    },
    keyFindings: {
      type: [String],
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

export const ReportModel: Model<IReportDocument> =
  (mongoose.models.Report as Model<IReportDocument>) ||
  mongoose.model<IReportDocument>('Report', ReportSchema);
