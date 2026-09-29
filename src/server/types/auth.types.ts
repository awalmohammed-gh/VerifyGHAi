import { Request } from 'express';
import { SafeUser, UserRole } from './user.types.js';

export interface AuthRequest extends Request {
  user?: any;
}

export interface AuthResponseData {
  user: SafeUser;
  accessToken?: string;
  expiresIn?: number;
}
