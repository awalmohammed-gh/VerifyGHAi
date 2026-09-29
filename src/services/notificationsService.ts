import { apiClient } from './api';
import { UserNotification, NotificationType, Classification } from '../types';

export function mapBackendNotification(n: any): UserNotification {
  const isRead = n.isRead !== undefined ? Boolean(n.isRead) : Boolean(n.read);
  return {
    id: n.id || n._id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: n.userId || '',
    type: (n.type || 'SYSTEM_ALERT') as NotificationType,
    title: n.title || 'System Notification',
    message: n.message || '',
    timestamp: n.createdAt ? new Date(n.createdAt).toISOString() : (n.timestamp || new Date().toISOString()),
    isRead,
    relatedResultId: n.relatedResultId || n.relatedVerificationId || n.verificationId,
    classification: n.classification as Classification | undefined,
  };
}

export const notificationsService = {
  /**
   * Fetch all notifications for the authenticated user: GET /api/notifications
   */
  getNotifications: async (_userId?: string): Promise<UserNotification[]> => {
    try {
      const response = await apiClient.get('/notifications');
      const resData = response.data?.data || response.data;
      const list = resData.notifications || (Array.isArray(resData) ? resData : []);
      return list.map(mapBackendNotification);
    } catch (error) {
      console.warn('[notificationsService] getNotifications error:', error);
      return [];
    }
  },

  /**
   * Mark a single notification as read: PATCH /api/notifications/:id/read
   */
  markAsRead: async (id: string): Promise<UserNotification | null> => {
    try {
      const response = await apiClient.patch(`/notifications/${id}/read`);
      const resData = response.data?.data || response.data;
      const notif = resData.notification || resData;
      return mapBackendNotification(notif);
    } catch (error) {
      console.warn(`[notificationsService] markAsRead error (${id}):`, error);
      return null;
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (userId?: string): Promise<number> => {
    try {
      const all = await notificationsService.getNotifications(userId);
      return all.filter((n) => !n.isRead).length;
    } catch {
      return 0;
    }
  },

  /**
   * Mark all notifications as read: PATCH /api/notifications/mark-all-read
   */
  markAllAsRead: async (_userId?: string): Promise<void> => {
    try {
      await apiClient.patch('/notifications/mark-all-read');
    } catch {
      try {
        await apiClient.patch('/notifications/read-all');
      } catch (error) {
        console.warn('[notificationsService] markAllAsRead error:', error);
      }
    }
  },
};
