import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  CheckCheck,
  ArrowRight,
  Clock,
  FileText,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { UserNotification, NotificationType } from '../../types';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatTimeAgo } from '../../utils/timeAgo';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success('All Caught Up', 'All notifications marked as read.');
  };

  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.relatedResultId) {
      navigate(`/verify/result/${notif.relatedResultId}`);
    } else if (notif.type === 'REPORT_SAVED') {
      navigate('/reports');
    }
  };

  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case 'VERIFICATION_COMPLETED':
        return {
          icon: CheckCircle2,
          bgClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/70',
        };
      case 'SUSPICIOUS_RESULT':
        return {
          icon: AlertTriangle,
          bgClass: 'bg-amber-50 text-amber-600 border border-amber-200/70',
        };
      case 'LOW_CREDIBILITY_SOURCE':
        return {
          icon: XCircle,
          bgClass: 'bg-rose-50 text-rose-600 border border-rose-200/70',
        };
      case 'REPORT_SAVED':
        return {
          icon: FileText,
          bgClass: 'bg-purple-50 text-purple-600 border border-purple-200/70',
        };
      case 'SYSTEM_ALERT':
      default:
        return {
          icon: Info,
          bgClass: 'bg-blue-50 text-blue-600 border border-blue-200/70',
        };
    }
  };

  const filteredNotifs =
    filter === 'UNREAD' ? notifications.filter((n) => !n.isRead) : notifications;

  if (isLoading && notifications.length === 0) {
    return <LoadingSpinner size="lg" label="Loading notifications..." />;
  }

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time updates regarding your verification requests and source flags.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Tabs / Filter Controls */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === 'UNREAD'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">You're all caught up</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filter === 'UNREAD'
              ? 'There are no unread notifications at this time.'
              : 'You have no notifications yet. Verified submission alerts will show up here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((notif) => {
            const { icon: TypeIcon, bgClass } = getTypeConfig(notif.type);
            const isUnread = !notif.isRead;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-500/10'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${bgClass}`}
                  >
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold truncate ${
                          isUnread ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(notif.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 self-end sm:self-center flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {notif.relatedResultId && (
                    <Link to={`/verify/result/${notif.relatedResultId}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        View Report
                      </Button>
                    </Link>
                  )}
                  {isUnread && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      className="text-xs text-slate-400 hover:text-blue-600 font-semibold px-2 py-1 cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

