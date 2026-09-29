import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  FileCheck,
  Globe,
  Database,
  BarChart2,
  Cpu,
  Users,
  BellRing,
  Settings,
  Shield,
  LogOut,
  ClipboardList,
  Sun,
  Moon,
  Laptop,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';

export interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSearch?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  onOpenSearch,
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();

  // Dynamic status counts for enhanced route awareness & accessibility
  const [badgeCounts, setBadgeCounts] = useState<{
    pendingReviews: number;
    activeAlerts: number;
    flaggedClaims: number;
  }>({
    pendingReviews: 0,
    activeAlerts: 0,
    flaggedClaims: 0,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchBadgeMetrics = async () => {
      try {
        const [stats, alerts, reviews] = await Promise.all([
          adminService.getDashboardStats().catch(() => null),
          adminService.getAlerts({ limit: 20 }).catch(() => []),
          adminService.getReviewQueue({ status: 'PENDING' }).catch(() => []),
        ]);

        if (isMounted) {
          const unreadAlerts = (alerts || []).filter((a) => a.isActive && !a.isDismissed).length;
          const pendingCount = (reviews || []).filter((r) => r.status === 'PENDING').length;
          const flaggedCount = stats?.fakeCount || 0;

          setBadgeCounts({
            pendingReviews: pendingCount,
            activeAlerts: unreadAlerts,
            flaggedClaims: flaggedCount,
          });
        }
      } catch (e) {
        // Non-blocking telemetry warning
      }
    };

    fetchBadgeMetrics();
    const interval = setInterval(fetchBadgeMetrics, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.info('Logged Out', 'Signed out from administrator session.');
    navigate('/login');
  };

  const adminNavGroups = [
    {
      group: 'OVERVIEW',
      items: [
        {
          label: 'Overview',
          path: '/admin',
          icon: LayoutDashboard,
          ariaLabel: 'Admin Overview Dashboard',
        },
      ],
    },
    {
      group: 'USER MANAGEMENT',
      items: [
        {
          label: 'Users',
          path: '/admin/users',
          icon: Users,
          ariaLabel: 'Manage and monitor all platform users',
        },
      ],
    },
    {
      group: 'VERIFICATION MANAGEMENT',
      items: [
        {
          label: 'Verifications',
          path: '/admin/verifications',
          icon: FileCheck,
          ariaLabel: 'All Submitted Claims & Verifications',
        },
        {
          label: 'Review Queue',
          path: '/admin/reviews',
          icon: ClipboardList,
          badge: badgeCounts.pendingReviews > 0 ? badgeCounts.pendingReviews : undefined,
          badgeVariant: 'amber',
          ariaLabel: 'Adjudication Review Queue',
        },
        {
          label: 'Flagged Content',
          path: '/admin/flags',
          icon: ShieldAlert,
          badge: badgeCounts.flaggedClaims > 0 ? badgeCounts.flaggedClaims : undefined,
          badgeVariant: 'rose',
          ariaLabel: 'Flagged Misinformation Claims',
        },
      ],
    },
    {
      group: 'CONTENT & KNOWLEDGE',
      items: [
        {
          label: 'Sources',
          path: '/admin/sources',
          icon: Globe,
          ariaLabel: 'Media Sources & Domain Credibility Registry',
        },
        {
          label: 'Fact Checks',
          path: '/admin/fact-checks',
          icon: Database,
          ariaLabel: 'Cross-Referenced Fact Checks Database',
        },
      ],
    },
    {
      group: 'MONITORING',
      items: [
        {
          label: 'Alerts',
          path: '/admin/alerts',
          icon: BellRing,
          badge: badgeCounts.activeAlerts > 0 ? badgeCounts.activeAlerts : undefined,
          badgeVariant: 'rose',
          ariaLabel: 'Critical Incidents & Anomaly Alerts',
        },
        {
          label: 'Analytics',
          path: '/admin/analytics',
          icon: BarChart2,
          ariaLabel: 'Platform Analytics & Ingestion Metrics',
        },
        {
          label: 'Audit Logs',
          path: '/admin/audit-logs',
          icon: Shield,
          ariaLabel: 'Administrative Activity & Compliance Audit Logs',
        },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        {
          label: 'Settings',
          path: '/admin/settings',
          icon: Settings,
          ariaLabel: 'Platform and AI Engine Settings',
        },
      ],
    },
  ];

  return (
    <aside
      aria-label="Admin Navigation Sidebar"
      className={`h-full flex flex-col justify-between select-none transition-all duration-300 border-r ${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-800 shadow-xs dark:shadow-none`}
    >
      {/* Top Header & Brand Identity */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="h-16 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <NavLink
            to="/admin"
            className="flex items-center gap-2.5 group focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-xl p-1"
            onClick={onClose}
            aria-label="VerifAI GH Admin Home"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors flex-shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  VERIFAI <span className="text-blue-600 dark:text-blue-400 font-black">GH</span>
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block -mt-1 tracking-widest uppercase">
                  ADMIN PORTAL
                </span>
              </div>
            )}
          </NavLink>

          {/* Mobile Close Button or Desktop Collapse Toggle */}
          <div className="flex items-center gap-1">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close navigation sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Quick Search Shortcut Banner */}
        {!isCollapsed && onOpenSearch && (
          <div className="px-3.5 pt-3 pb-1">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Jump to route / claim...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Scrollable Navigation Groups */}
        <nav
          className="flex-1 p-3 space-y-4 overflow-y-auto overflow-x-hidden text-left focus:outline-hidden"
          aria-label="Admin Navigation Links"
        >
          {adminNavGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                  {grp.group}
                </div>
              )}
              {isCollapsed && <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />}
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isDashboard = item.path === '/admin';
                  const isRouteActive = isDashboard
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={isDashboard}
                      onClick={onClose}
                      aria-label={item.ariaLabel}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) => {
                        const active = isActive || isRouteActive;
                        return `group relative flex items-center ${
                          isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
                        } rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                          active
                            ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600 dark:text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                        }`;
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {/* Item Badges */}
                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full leading-none flex-shrink-0 ${
                            item.badgeVariant === 'rose'
                              ? 'bg-rose-500 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Collapsed Badge Dot Indicator */}
                      {isCollapsed && item.badge !== undefined && (
                        <span
                          className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                            item.badgeVariant === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Controls: Integrated Theme Switcher, Admin Profile & Safe Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/70 space-y-2.5 flex-shrink-0 text-left">
        {/* Interactive Theme Switcher using existing ThemeContext */}
        <div
          className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-2xs ${
            isCollapsed ? 'flex justify-center' : 'space-y-1.5'
          }`}
        >
          {!isCollapsed ? (
            <div>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Theme Appearance
                </span>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 capitalize">
                  {theme}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  aria-label="Set Light Theme"
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[11px]">Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  aria-label="Set Dark Theme"
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[11px]">Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  aria-label="Set System Theme"
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[11px]">Auto</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={`Switch Theme (Current: ${theme})`}
              aria-label={`Toggle theme (Current: ${theme})`}
            >
              {actualTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
            </button>
          )}
        </div>

        {/* Administrator Profile Card */}
        {!isCollapsed ? (
          <NavLink
            to="/admin/settings"
            onClick={onClose}
            className="flex items-center gap-2.5 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-2xs">
              {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="truncate flex-1 min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {currentUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono block -mt-0.5">
                Super Admin
              </span>
            </div>
          </NavLink>
        ) : (
          <div className="flex justify-center">
            <NavLink
              to="/admin/settings"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-2xs"
              title={currentUser?.name || 'Administrator'}
            >
              {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
            </NavLink>
          </div>
        )}

        {/* Safe Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
          } py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-rose-500`}
          title={isCollapsed ? 'Sign Out' : undefined}
          aria-label="Sign Out of Admin Session"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
