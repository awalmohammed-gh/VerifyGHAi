import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, Shield, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../admin/Breadcrumbs';
import { AdminSearchModal } from '../admin/AdminSearchModal';
import { ThemeToggle } from '../common/ThemeToggle';
import { adminService } from '../../services/adminService';
import { AlertItem } from '../../types';

export interface AdminTopbarProps {
  onMenuToggle: () => void;
  title?: string;
  subtitle?: string;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({ onMenuToggle, title, subtitle }) => {
  const { currentUser, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    adminService
      .getAlerts({ limit: 10 })
      .then((data) => {
        if (isMounted) setAlerts(data);
      })
      .catch((err) => console.warn('[AdminTopbar] Error loading alerts:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const unreadAlerts = alerts.filter((a) => a.isActive && !a.isDismissed);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.info('Logged Out', 'Signed out from administrator session.');
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-all h-16 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile Sidebar Toggle & Page Title with Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle admin sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 text-left">
            <Breadcrumbs />
            {title && (
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                {title}
              </h1>
            )}
          </div>
        </div>

        {/* Right: Global Search, Theme Toggle, Notification Bell, Admin Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Admin Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline font-medium">Search users, sources, claims...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle size="sm" />

          {/* Admin Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="System Alerts & Warnings"
            >
              <Bell className="w-5 h-5" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 space-y-2 z-50 animate-in fade-in-50 zoom-in-95 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 px-1">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">Admin Alert Center</span>
                  <Link
                    to="/admin/alerts"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View All ({alerts.length})
                  </Link>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {unreadAlerts.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">No active unread alerts</div>
                  ) : (
                    unreadAlerts.slice(0, 4).map((alert) => (
                      <Link
                        key={alert.id}
                        to="/admin/alerts"
                        onClick={() => setIsNotifOpen(false)}
                        className="block p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{alert.title}</span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                              alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                                ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{alert.description}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 pl-2 rounded-full border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {currentUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[100px]">
                  {currentUser?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold leading-tight">Admin</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 space-y-1 z-50 animate-in fade-in-50 zoom-in-95 text-left">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{currentUser?.email}</p>
                </div>

                <Link
                  to="/admin/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Admin Profile</span>
                </Link>

                <Link
                  to="/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>System Settings</span>
                </Link>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Admin Search Modal */}
      <AdminSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
