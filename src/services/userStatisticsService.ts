import { apiClient } from './api';
import { UserApiStatistics, SavedReport } from '../types';

export interface UserReportItem {
  id: string;
  userId?: string;
  verificationId?: string;
  title: string;
  summary?: string;
  keyFindings?: string[];
  classification?: string;
  score?: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface UserDashboardData {
  statistics: UserApiStatistics;
  reports: UserReportItem[];
}

export const userStatisticsService = {
  /**
   * Fetches user-specific verification statistics directly from `/api/statistics` or `/api/user/statistics`
   */
  getUserStatistics: async (timeframe: string = '30d'): Promise<UserApiStatistics> => {
    try {
      // Try /api/statistics first, fallback to /api/user/statistics
      const response = await apiClient.get('/statistics', {
        params: { timeframe },
      });
      const data = response.data;
      if (data?.data?.statistics) {
        return data.data.statistics;
      }
      if (data?.data) {
        return data.data;
      }
      if (data?.statistics) {
        return data.statistics;
      }
      return data;
    } catch (error) {
      try {
        const fallback = await apiClient.get('/user/statistics', {
          params: { timeframe },
        });
        const d = fallback.data;
        return d?.data?.statistics || d?.data || d?.statistics || d;
      } catch (fallbackError) {
        console.warn('[userStatisticsService] /api/statistics API call:', error);
        throw error;
      }
    }
  },

  /**
   * Alias for getUserStatistics querying /api/statistics directly
   */
  getStatistics: async (timeframe: string = '30d'): Promise<UserApiStatistics> => {
    return userStatisticsService.getUserStatistics(timeframe);
  },

  /**
   * Fetches user's saved/generated verification reports from `/api/reports`
   */
  getUserReports: async (): Promise<UserReportItem[]> => {
    try {
      const response = await apiClient.get('/reports');
      const data = response.data;
      if (data?.data?.reports) {
        return data.data.reports;
      }
      if (data?.reports) {
        return data.reports;
      }
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('[userStatisticsService] /api/reports API call:', error);
      return [];
    }
  },

  /**
   * Fetches both statistics and report activity
   */
  getUserDashboardData: async (): Promise<UserDashboardData> => {
    const [statsResult, reportsResult] = await Promise.allSettled([
      userStatisticsService.getUserStatistics(),
      userStatisticsService.getUserReports(),
    ]);

    const statistics: UserApiStatistics =
      statsResult.status === 'fulfilled'
        ? statsResult.value
        : {
            totalVerifications: 0,
            verified: 0,
            trusted: 0,
            suspicious: 0,
            fake: 0,
            unverified: 0,
            averageCredibilityScore: 0,
            recentActivity: [],
          };

    const reports: UserReportItem[] =
      reportsResult.status === 'fulfilled' ? reportsResult.value : [];

    return { statistics, reports };
  },
};

