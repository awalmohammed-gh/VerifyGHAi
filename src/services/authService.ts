import { User } from '../types';
import { apiClient } from './api';

const AUTH_STORAGE_KEY = 'verifai_current_user';
const AUTH_TOKEN_KEY = 'verifai_auth_token';

// Helper to transform server user model to client User model
function mapServerUserToClient(serverUser: any): User {
  if (!serverUser) {
    return {
      id: '',
      name: 'User',
      email: '',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: serverUser.id || serverUser._id || '',
    name: serverUser.name || serverUser.full_name || 'User',
    email: serverUser.email,
    role: serverUser.role || 'USER',
    status: serverUser.status || 'ACTIVE',
    createdAt: serverUser.createdAt || serverUser.created_at || new Date().toISOString(),
    bio: serverUser.bio,
    organization: serverUser.organization,
    roleTitle: serverUser.roleTitle || serverUser.role_title,
    phone: serverUser.phone,
    avatarUrl: serverUser.profileImage || serverUser.avatarUrl || serverUser.avatar_url,
    totalChecks: serverUser.totalChecks || serverUser.total_checks || 0,
    stats: serverUser.stats || { verified: 0, trusted: 0, suspicious: 0, fake: 0 },
  };
}

export const authService = {
  /**
   * User login endpoint: POST /api/auth/login
   * Authenticates against the real backend database.
   */
  login: async (email: string, password = ''): Promise<User> => {
    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const responseBody = response.data;
      const data = responseBody.data || responseBody;
      const user = data.user;
      const accessToken = data.accessToken;

      if (accessToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      }

      const clientUser = mapServerUserToClient(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(clientUser));
      return clientUser;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.errors?.[0] ||
        (err.message && !err.response
          ? 'Connection to authentication server failed. Please check network connectivity.'
          : 'Invalid email or password. If you do not have an account, please create one.');
      throw new Error(msg);
    }
  },

  /**
   * User registration endpoint: POST /api/auth/register
   * Creates a real database record.
   */
  register: async (params: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    organization?: string;
    phone?: string;
  }): Promise<User> => {
    try {
      const response = await apiClient.post('/auth/register', {
        name: params.name.trim(),
        email: params.email.trim().toLowerCase(),
        password: params.password,
        role: params.role || 'USER',
        organization: params.organization,
        phone: params.phone,
      });

      const responseBody = response.data;
      const data = responseBody.data || responseBody;
      const user = data.user;
      const accessToken = data.accessToken;

      if (accessToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      }

      const clientUser = mapServerUserToClient(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(clientUser));
      return clientUser;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.errors?.[0] ||
        'Registration failed. Please check your details or try a different email.';
      throw new Error(msg);
    }
  },

  /**
   * Admin registration endpoint: POST /api/auth/admin/register
   * Requires master setup key and saves administrator directly to database.
   */
  registerAdmin: async (params: {
    name: string;
    email: string;
    password: string;
    adminSecretKey: string;
    organization?: string;
    roleTitle?: string;
    phone?: string;
  }): Promise<User> => {
    try {
      const response = await apiClient.post('/auth/admin/register', {
        name: params.name.trim(),
        email: params.email.trim().toLowerCase(),
        password: params.password,
        adminSecretKey: params.adminSecretKey.trim(),
        organization: params.organization || 'VerifAI GH Administration',
        roleTitle: params.roleTitle || 'System Administrator',
        phone: params.phone,
      });

      const responseBody = response.data;
      const data = responseBody.data || responseBody;
      const user = data.user;
      const accessToken = data.accessToken;

      if (accessToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      }

      const clientUser = mapServerUserToClient(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(clientUser));
      return clientUser;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.errors?.[0] ||
        'Admin registration failed. Please verify your master setup key.';
      throw new Error(msg);
    }
  },


  /**
   * Get current authenticated user profile: GET /api/user/me
   */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch {
            return null;
          }
        }
        return null;
      }

      const response = await apiClient.get('/user/me');
      const responseBody = response.data;
      const data = responseBody.data || responseBody;
      const user = data.user || data;

      const clientUser = mapServerUserToClient(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(clientUser));
      return clientUser;
    } catch (err) {
      // Fallback to local session storage cache if token temporarily expired or during offline
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
      return null;
    }
  },

  /**
   * User logout: POST /api/auth/logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  /**
   * Request password reset link: POST /api/auth/forgot-password
   */
  forgotPassword: async (email: string): Promise<boolean> => {
    try {
      await apiClient.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      return true;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to process password reset request.';
      throw new Error(msg);
    }
  },

  /**
   * Reset password with reset token: POST /api/auth/reset-password
   */
  resetPassword: async (token: string, newPassword: string): Promise<boolean> => {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: newPassword,
      });
      return true;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Password reset failed. The link may have expired.';
      throw new Error(msg);
    }
  },

  /**
   * Update profile fields: PUT /api/user/me
   */
  updateProfile: async (
    userId: string,
    updates: Partial<Omit<User, 'id' | 'role' | 'createdAt'>>
  ): Promise<User> => {
    try {
      const response = await apiClient.put('/user/me', {
        name: updates.name,
        email: updates.email,
        bio: updates.bio,
        phone: updates.phone,
        organization: updates.organization,
        roleTitle: updates.roleTitle,
        avatarUrl: updates.avatarUrl,
      });

      const responseBody = response.data;
      const data = responseBody.data || responseBody;
      const user = data.user || data;

      const clientUser = mapServerUserToClient(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(clientUser));
      return clientUser;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to update profile settings.';
      throw new Error(msg);
    }
  },

  /**
   * Change user password: POST /api/auth/change-password
   */
  changePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return true;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to change password. Please verify your current password.';
      throw new Error(msg);
    }
  },

  /**
   * Delete user account: DELETE /api/user/me
   */
  deleteAccount: async (userId: string, password?: string): Promise<boolean> => {
    try {
      await apiClient.delete('/user/me', {
        data: { password },
      });
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return true;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Account deletion failed. Please verify your password.';
      throw new Error(msg);
    }
  },
};
