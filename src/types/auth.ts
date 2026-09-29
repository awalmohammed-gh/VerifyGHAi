export type Role = 'USER' | 'ADMIN';
export type UserRole = Role;

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  avatarUrl?: string;
  bio?: string;
  roleTitle?: string;
  phone?: string;
  organization?: string;
  totalChecks?: number;
  stats?: {
    verified: number;
    trusted: number;
    suspicious: number;
    fake: number;
  };
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  user: User;
  data?: {
    user: User;
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password?: string;
  role?: Role;
  setupKey?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  organization?: string;
  role?: Role;
  setupKey?: string;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
