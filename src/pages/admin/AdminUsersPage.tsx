import React, { useEffect, useState } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  TrendingUp,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AdminUserTable } from '../../components/admin/AdminUserTable';

export const AdminUsersPage: React.FC = () => {
  const [userStats, setUserStats] = useState<{
    total: number;
    active: number;
    suspended: number;
    growthRate: number;
  }>({
    total: 0,
    active: 0,
    suspended: 0,
    growthRate: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const analytics = await adminService.getAnalytics('30d');
        if (analytics?.users) {
          setUserStats({
            total: analytics.users.total || 0,
            active: analytics.users.activeUsers || 0,
            suspended: analytics.users.suspendedUsers || 0,
            growthRate: analytics.users.growthRate || 0,
          });
        }
      } catch (err) {
        console.warn('[AdminUsersPage] Could not load user metrics:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">User Directory & Access Control</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage platform members, assign staff roles, review verification activity, and manage suspension states.
            </p>
          </div>
        </div>

        {/* Quick User Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Accounts</span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{userStats.total}</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active</span>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">{userStats.active}</div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Suspended</span>
            <div className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono">{userStats.suspended}</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">30D Growth</span>
            <div className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono">+{userStats.growthRate}%</div>
          </div>
        </div>
      </div>

      {/* Main Admin User Table with server pagination and optimistic updates */}
      <AdminUserTable />
    </div>
  );
};

export default AdminUsersPage;
