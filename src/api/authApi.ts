import { apiClient } from '../services/api';
import { User, AuthResponse, LoginCredentials, RegisterData } from '../types';

export const authApi = {
  /**
   * Standard user login
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    const data = response.data;
    if (data.token) {
      localStorage.setItem('verifai_token', data.token);
    }
    return data;
  },

  /**
   * User registration
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    const data = response.data;
    if (data.token) {
      localStorage.setItem('verifai_token', data.token);
    }
    return data;
  },

  /**
   * Administrative login
   */
  adminLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/admin/login', credentials);
    const data = response.data;
    if (data.token) {
      localStorage.setItem('verifai_token', data.token);
    }
    return data;
  },

  /**
   * Fetch currently authenticated profile
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return (response.data?.data?.user || response.data?.data || response.data) as User;
  },

  /**
   * Logout user and invalidate local token
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('verifai_token');
    }
  },

  /**
   * Refresh token
   */
  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post<{ token: string }>('/auth/refresh');
    if (response.data?.token) {
      localStorage.setItem('verifai_token', response.data.token);
    }
    return response.data;
  },
};
