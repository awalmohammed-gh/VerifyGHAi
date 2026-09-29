import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  History,
  Bookmark,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { notificationsService } from '../../services/notificationsService';
import { RecentSearchesSidebar } from '../dashboard/RecentSearchesSidebar';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser?.id) {
      notificationsService.getUnreadCount(currentUser.id).then(setUnreadCount);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    toast.info('Signed Out', 'You have been safely signed out of your session.');
    navigate('/login');
  };

  const isSettingsActive =
    location.pathname.startsWith('/dashboard/settings') ||
    location.pathname.startsWith('/settings') ||
    location.pathname === '/profile' ||
    location.pathname === '/notifications' ||
    location.pathname === '/help';

  const isAdmin =
    currentUser?.role?.toUpperCase() === 'ADMIN' &&
    currentUser?.email?.toLowerCase().trim() === 'dion12@gmail.com';

  const navGroups = [
    {
      group: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Verify Content', path: '/verify', icon: ShieldCheck, highlight: true },
        { label: 'History', path: '/history', icon: History },
      ],
    },
    {
      group: 'INSIGHTS',
      items: [
        { label: 'My Reports', path: '/reports', icon: Bookmark },
        { label: 'Statistics', path: '/statistics', icon: BarChart3 },
      ],
    },
    {
      group: 'PREFERENCES',
      items: [
        {
          label: 'Settings',
          path: '/dashboard/settings',
          icon: Settings,
          badge: unreadCount > 0 ? unreadCount : undefined,
          isCustomActive: isSettingsActive,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between flex-shrink-0 select-none shadow-2xs transition-colors">
      {/* Brand Header (h-16 matches sticky topbar) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="h-16 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group" onClick={onClose}>
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                VERIFAI <span className="text-blue-600 font-black">GH</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block -mt-1 tracking-wider uppercase">
                Check Before You Share
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 p-3.5 space-y-5 overflow-y-auto">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {grp.group}
              </span>
              <div className="mt-1 space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => {
                        const active = item.isCustomActive !== undefined ? item.isCustomActive : isActive;
                        return `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                          active
                            ? item.highlight
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                            : item.highlight
                            ? 'text-blue-700 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 font-extrabold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`;
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white leading-none">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Recent Searches Sidebar Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <RecentSearchesSidebar onItemClick={onClose} maxItems={3} />
          </div>
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        <NavLink
          to="/dashboard/settings?tab=profile"
          onClick={onClose}
          className={`p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border text-xs flex items-center gap-2.5 transition-colors ${
            isSettingsActive && location.search.includes('tab=profile')
              ? 'border-blue-300 dark:border-blue-500 ring-1 ring-blue-500/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="truncate min-w-0 flex-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate text-xs">{currentUser?.name}</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">{currentUser?.email}</span>
          </div>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
