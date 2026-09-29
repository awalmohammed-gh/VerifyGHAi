import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { UserNotification } from '../types';
import { notificationsService } from '../services/notificationsService';
import { useAuth } from './AuthContext';

export interface NotificationContextType {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Partial<UserNotification>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      setNotifications([]);
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const data = await notificationsService.getNotifications(currentUser?.id);
      setNotifications(data || []);
    } catch (err) {
      console.warn('[NotificationContext] Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [currentUser, isAuthenticated]);

  // Initial load and polling
  useEffect(() => {
    setIsLoading(true);
    fetchNotifications();

    // Subtle background polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark single notification as read with instant optimistic UI update
  const markAsRead = useCallback(
    async (id: string) => {
      // 1. Optimistic state update
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );

      // 2. Dispatch network update
      try {
        await notificationsService.markAsRead(id);
      } catch (err) {
        console.warn('[NotificationContext] markAsRead sync error:', err);
      }
    },
    []
  );

  // Mark all notifications as read with instant optimistic UI update
  const markAllAsRead = useCallback(async () => {
    // 1. Optimistic state update: Zero out unread flags immediately
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));

    // 2. Send request to PATCH /api/notifications/mark-all-read
    try {
      await notificationsService.markAllAsRead(currentUser?.id);
    } catch (err) {
      console.warn('[NotificationContext] markAllAsRead sync error:', err);
    }
  }, [currentUser?.id]);

  // Dynamically push a new notification (e.g. from local scan completion)
  const addNotification = useCallback((notif: Partial<UserNotification>) => {
    const newNotif: UserNotification = {
      id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: notif.userId || 'guest_user',
      type: notif.type || 'SYSTEM_ALERT',
      title: notif.title || 'New Notification',
      message: notif.message || '',
      timestamp: notif.timestamp || new Date().toISOString(),
      isRead: false,
      relatedResultId: notif.relatedResultId,
      classification: notif.classification,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
