import mongoose, { Schema, Document, Model } from 'mongoose';
import { SafeUser, UserRole, UserStatus } from '../types/user.types.js';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  profileImage?: string;
  organization?: string;
  roleTitle?: string;
  bio?: string;
  phone?: string;
  refresh_tokens?: string[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): SafeUser;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      required: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    organization: {
      type: String,
      default: '',
      trim: true,
    },
    roleTitle: {
      type: String,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    phone: {
      type: String,
      default: '',
    },
    refresh_tokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id?.toString() || ret.id;
        delete ret.password;
        delete ret.password_hash;
        delete ret.__v;
        delete ret.refresh_tokens;
        return ret;
      },
    },
  }
);

UserSchema.methods.toSafeObject = function (): SafeUser {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role as UserRole,
    status: this.status as UserStatus,
    profileImage: this.profileImage,
    organization: this.organization,
    roleTitle: this.roleTitle,
    bio: this.bio,
    phone: this.phone,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const UserModel: Model<IUserDocument> =
  (mongoose.models.User as Model<IUserDocument>) ||
  mongoose.model<IUserDocument>('User', UserSchema);
