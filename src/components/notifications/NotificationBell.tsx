import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Info,
  FileText,
  ExternalLink,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import { UserNotification, NotificationType } from '../../types';
import { formatTimeAgo } from '../../utils/timeAgo';

export interface NotificationBellProps {
  className?: string;
  align?: 'left' | 'right';
  badgePosition?: 'top-right' | 'top-left';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  align = 'right',
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  // Close when pressing the Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  // Handle Mark All As Read with instant optimistic UI update
  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  // Handle item click: mark single notification as read and route to target
  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);

    if (notif.relatedResultId) {
      navigate(`/verify/result/${notif.relatedResultId}`);
    } else if (notif.type === 'REPORT_SAVED') {
      navigate('/reports');
    } else {
      navigate('/notifications');
    }
  };

  // Helper for notification type icons and styling
  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case 'VERIFICATION_COMPLETED':
        return {
          icon: ShieldCheck,
          bgClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
          dotClass: 'bg-emerald-500',
        };
      case 'SUSPICIOUS_RESULT':
        return {
          icon: AlertTriangle,
          bgClass: 'bg-amber-50 text-amber-600 border border-amber-200/60',
          dotClass: 'bg-amber-500',
        };
      case 'LOW_CREDIBILITY_SOURCE':
        return {
          icon: XCircle,
          bgClass: 'bg-rose-50 text-rose-600 border border-rose-200/60',
          dotClass: 'bg-rose-500',
        };
      case 'REPORT_SAVED':
        return {
          icon: FileText,
          bgClass: 'bg-purple-50 text-purple-600 border border-purple-200/60',
          dotClass: 'bg-purple-500',
        };
      case 'SYSTEM_ALERT':
      default:
        return {
          icon: Info,
          bgClass: 'bg-blue-50 text-blue-600 border border-blue-200/60',
          dotClass: 'bg-blue-500',
        };
    }
  };

  const filteredNotifications =
    activeFilter === 'UNREAD'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        id="notification-bell-button"
        type="button"
        onClick={toggleDropdown}
        aria-label="Toggle notifications menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`relative p-2.5 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-500/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95'
        }`}
      >
        <Bell className="w-5 h-5 transition-transform duration-200" />

        {/* Red Unread Counter Badge */}
        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute -top-0.5 -right-0.5 min-w-[19px] h-[19px] px-1 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs border-2 border-white animate-in zoom-in-50 duration-200"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Responsive Dropdown / Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop Overlay (visible only on mobile) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 sm:hidden"
              aria-hidden="true"
            />

            {/* Dropdown Container */}
            <motion.div
              ref={dropdownRef}
              id="notification-dropdown-menu"
              role="region"
              aria-label="Notifications Dropdown"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`
                /* Mobile: Bottom Sheet Overlay or Full-Width anchored sheet */
                fixed bottom-0 inset-x-0 sm:inset-x-auto sm:bottom-auto sm:absolute
                ${align === 'right' ? 'sm:right-0' : 'sm:left-0'}
                sm:top-full sm:mt-2.5
                w-full sm:w-[400px] md:w-[420px]
                bg-white
                rounded-t-3xl sm:rounded-2xl
                border border-slate-200/90
                shadow-2xl sm:shadow-xl
                z-50
                overflow-hidden
                flex flex-col
                text-left
                max-h-[85vh] sm:max-h-[580px]
              `}
            >
              {/* Mobile Drag Indicator Bar */}
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

              {/* 3. Header Bar */}
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Notifications
                  </h2>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-700 rounded-full">
                      {unreadCount} unread
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-500 rounded-full">
                      All caught up
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Mark All as Read Button */}
                  {unreadCount > 0 && (
                    <button
                      id="mark-all-notifications-read-btn"
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Mark all notifications as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all as read</span>
                    </button>
                  )}

                  {/* Close button for mobile sheet */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="sm:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                    aria-label="Close notifications menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs (All / Unread) */}
              <div className="px-4 sm:px-5 py-2 border-b border-slate-100 flex items-center gap-1.5 bg-white text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    activeFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('UNREAD')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    activeFilter === 'UNREAD'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* 4. Notification List (Auto-scrolling max-h-96) */}
              <div
                id="notification-items-scroll-container"
                className="max-h-96 overflow-y-auto divide-y divide-slate-100 bg-white"
              >
                {filteredNotifications.length === 0 ? (
                  /* Empty State */
                  <div className="py-12 px-6 text-center space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100/80 text-slate-400 flex items-center justify-center mx-auto">
                      <Bell className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No new notifications</p>
                    <p className="text-xs text-slate-500 max-w-[260px] mx-auto leading-relaxed">
                      {activeFilter === 'UNREAD'
                        ? "You've read all your active notifications. Great job staying informed!"
                        : 'Your verification alerts and fact-check updates will appear here.'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const { icon: TypeIcon, bgClass } = getTypeConfig(notif.type);
                    const isUnread = !notif.isRead;

                    return (
                      <div
                        key={notif.id}
                        id={`notification-item-${notif.id}`}
                        onClick={() => handleNotificationClick(notif)}
                        className={`
                          group relative p-3.5 sm:p-4 flex items-start gap-3 transition-colors cursor-pointer
                          ${
                            isUnread
                              ? 'bg-blue-50/40 hover:bg-blue-50/70 border-l-4 border-blue-600'
                              : 'bg-white hover:bg-slate-50/90 text-slate-500 border-l-4 border-transparent'
                          }
                        `}
                      >
                        {/* Type Icon Badge */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs ${bgClass}`}
                        >
                          <TypeIcon className="w-4 h-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <h3
                              className={`text-xs sm:text-sm leading-snug line-clamp-1 ${
                                isUnread
                                  ? 'font-extrabold text-slate-900'
                                  : 'font-semibold text-slate-700'
                              }`}
                            >
                              {notif.title}
                            </h3>

                            {/* Unread dot indicator */}
                            {isUnread && (
                              <span
                                className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1 ring-4 ring-blue-100"
                                title="Unread notification"
                              />
                            )}
                          </div>

                          <p
                            className={`text-xs leading-relaxed line-clamp-2 ${
                              isUnread ? 'text-slate-700 font-normal' : 'text-slate-500'
                            }`}
                          >
                            {notif.message}
                          </p>

                          {/* Relative Timestamp */}
                          <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatTimeAgo(notif.timestamp)}</span>
                          </div>
                        </div>

                        {/* Mark single as read button on hover */}
                        {isUnread && (
                          <button
                            type="button"
                            title="Mark as read"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 sm:opacity-0 focus:opacity-100 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 rounded-lg transition-opacity"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 font-bold text-slate-700 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                >
                  <span>View all notifications</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
