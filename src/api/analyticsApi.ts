import { apiClient } from '../services/api';
import { AnalyticsData, AIPerformanceData } from '../types';

export const analyticsApi = {
  /**
   * Fetch platform analytics and volume trends
   */
  getPlatformAnalytics: async (timeframe: string = '30d'): Promise<AnalyticsData> => {
    const response = await apiClient.get('/admin/analytics', { params: { timeframe } });
    return response.data?.data?.analytics || response.data?.data || response.data?.analytics || response.data;
  },

  /**
   * Fetch AI performance metrics
   */
  getAIPerformance: async (): Promise<AIPerformanceData> => {
    const response = await apiClient.get('/admin/analytics/ai');
    return response.data?.data?.aiPerformance || response.data?.aiPerformance || response.data;
  },

  /**
   * Setup Server-Sent Events (SSE) stream for real-time telemetry updates
   */
  subscribeToAnalyticsStream: (
    onMessage: (data: any) => void,
    onError?: (error: any) => void
  ): (() => void) => {
    const token = localStorage.getItem('verifai_token');
    const url = `/api/admin/analytics/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch (e) {
        console.warn('Failed to parse SSE payload:', e);
      }
    };

    if (onError) {
      eventSource.onerror = onError;
    }

    return () => {
      eventSource.close();
    };
  },
};
