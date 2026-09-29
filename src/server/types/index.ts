export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  name?: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  organization?: string;
  role_title?: string;
  roleTitle?: string;
  phone?: string;
  avatar_url?: string;
  profileImage?: string;
  refresh_tokens: string[];
  created_at: string;
  updated_at: string;
}

export interface SanitizedUser {
  id: string;
  email: string;
  full_name: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  organization?: string;
  role_title?: string;
  roleTitle?: string;
  phone?: string;
  avatar_url?: string;
  profileImage?: string;
  created_at: string;
  updated_at: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
