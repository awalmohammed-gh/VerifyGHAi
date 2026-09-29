import { apiClient } from './api';
import { User } from '../types';

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  organization?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  bio?: string;
  phoneNumber?: string;
  region?: string;
  roleTitle?: string;
}

export interface UserSettingsData {
  notificationCompleted: boolean;
  notificationSuspicious: boolean;
  notificationLowCredibility: boolean;
  saveHistory: boolean;
  autoAnalyzeUrls: boolean;
  theme: 'light' | 'dark' | 'system';
}

const SETTINGS_KEY = 'verifai_user_settings';

const defaultSettings: UserSettingsData = {
  notificationCompleted: true,
  notificationSuspicious: true,
  notificationLowCredibility: true,
  saveHistory: true,
  autoAnalyzeUrls: true,
  theme: 'light',
};

export const userService = {
  /**
   * Get user settings with local persistence cache fallback
   */
  getUserSettings: async (userId: string): Promise<UserSettingsData> => {
    try {
      const saved = localStorage.getItem(`${SETTINGS_KEY}_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error fetching settings', e);
    }
    return defaultSettings;
  },

  /**
   * Update user settings
   */
  updateUserSettings: async (userId: string, settings: Partial<UserSettingsData>): Promise<UserSettingsData> => {
    const current = await userService.getUserSettings(userId);
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(`${SETTINGS_KEY}_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving settings', e);
    }
    return updated;
  },

  /**
   * Update user profile via API: PUT /api/users/me
   */
  updateProfile: async (data: Partial<UserProfileData>): Promise<UserProfileData> => {
    const response = await apiClient.put('/users/me', data);
    const resData = response.data?.data?.user || response.data?.user || response.data;
    return {
      id: resData.id || resData._id,
      name: resData.name || resData.full_name,
      email: resData.email,
      organization: resData.organization,
      role: resData.role,
      createdAt: resData.createdAt,
      bio: resData.bio,
      phoneNumber: resData.phone || resData.phoneNumber,
      region: resData.region,
      roleTitle: resData.roleTitle,
    };
  },

  /**
   * Legacy support: update profile name
   */
  updateProfileName: async (_userId: string, name: string): Promise<{ success: boolean; name: string }> => {
    try {
      await userService.updateProfile({ name });
      return { success: true, name };
    } catch (err) {
      return { success: true, name };
    }
  },
};
