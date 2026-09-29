import React, { useState, useEffect } from 'react';
import { Menu, Shield, Search, Clock, Command } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeToggle } from '../common/ThemeToggle';
import { RecentSearchesDropdown } from '../dashboard/RecentSearchesDropdown';
import { useOffline } from '../../context/OfflineContext';
import { WifiOff } from 'lucide-react';

export interface TopbarProps {
  onMenuToggle: () => void;
  title?: string;
  subtitle?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, title, subtitle }) => {
  const { currentUser } = useAuth();
  const { isOnline } = useOffline();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isAdmin =
    currentUser?.role?.toUpperCase() === 'ADMIN' &&
    currentUser?.email?.toLowerCase().trim() === 'dion12@gmail.com';

  // Global keyboard shortcut to open Recent Searches (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Derive dynamic page title if not provided
  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path.startsWith('/verify/result')) return 'Verification Result';
    if (path === '/verify') return 'Verify Content';
    if (path.startsWith('/history/')) return 'Verification Record';
    if (path === '/history') return 'Verification History';
    if (path.startsWith('/reports/')) return 'Saved Report';
    if (path === '/reports') return 'My Reports';
    if (path === '/statistics') return 'My Statistics';
    if (path.startsWith('/dashboard/settings') || path.startsWith('/settings')) return 'Settings & Preferences';
    if (path === '/notifications') return 'Notifications';
    if (path === '/profile') return 'My Profile';
    if (path === '/help') return 'Help & Guide';
    return 'Dashboard';
  };

  const activeTitle = getPageTitle();

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-all h-16 px-4 sm:px-6 flex items-center justify-between no-print">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">{activeTitle}</h1>
            {subtitle ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{subtitle}</p>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">Check information before you share</p>
            )}
          </div>
        </div>

        {/* Center/Right: Quick Search & Revisit Trigger + Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isOnline && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Offline Mode</span>
            </span>
          )}

          {/* Quick Search & Revisit Results Trigger Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs cursor-pointer group"
            title="Search and revisit recent verifications (⌘K)"
            aria-label="Search and revisit recent verifications"
          >
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            <span className="text-xs font-semibold hidden md:inline-block">
              Recent Searches
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400 dark:text-slate-500">
              <Command className="w-2.5 h-2.5 inline" />K
            </kbd>
          </button>

          {/* Theme Toggle Button */}
          <ThemeToggle size="sm" />

          {/* Responsive Notification Bell with Dropdown Popover */}
          <NotificationBell align="right" />

          {/* User Profile Pill */}
          <Link
            to="/dashboard/settings?tab=profile"
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            aria-label="View user profile"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline-block max-w-[130px] truncate">
              {currentUser?.name || 'Account'}
            </span>
          </Link>
        </div>
      </header>

      {/* Global Recent Searches & Verification History Popover Modal */}
      <RecentSearchesDropdown
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

