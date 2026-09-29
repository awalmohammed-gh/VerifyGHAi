export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface IUser {
  _id?: string;
  id: string;
  name: string;
  full_name?: string;
  email: string;
  password?: string;
  password_hash?: string;
  role: UserRole;
  status: UserStatus;
  profileImage?: string;
  avatar_url?: string;
  organization?: string;
  roleTitle?: string;
  role_title?: string;
  bio?: string;
  phone?: string;
  refresh_tokens?: string[];
  createdAt?: Date | string;
  created_at?: Date | string;
  updatedAt?: Date | string;
  updated_at?: Date | string;
}

export interface SafeUser {
  id: string;
  name: string;
  full_name?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profileImage?: string;
  avatar_url?: string;
  organization?: string;
  roleTitle?: string;
  role_title?: string;
  bio?: string;
  phone?: string;
  createdAt?: Date | string;
  created_at?: Date | string;
  updatedAt?: Date | string;
  updated_at?: Date | string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  organization?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface UpdateProfileDto {
  name?: string;
  profileImage?: string;
  bio?: string;
  organization?: string;
  roleTitle?: string;
  phone?: string;
}
