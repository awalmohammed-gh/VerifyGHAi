import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  MoreVertical,
  Edit2,
  Lock,
  Unlock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Calendar,
  X,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { User, UserStatus, Role } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { StatusBadge } from './StatusBadge';
import { TableSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { ConfirmationModal } from './ConfirmationModal';
import { useToast } from '../../context/ToastContext';

export interface AdminUserTableProps {
  onUserSelect?: (user: User) => void;
  className?: string;
}

export const AdminUserTable: React.FC<AdminUserTableProps> = ({ onUserSelect, className = '' }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  // Action Modals State
  const [statusModalUser, setStatusModalUser] = useState<User | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<Role>('USER');
  const [roleReason, setRoleReason] = useState<string>('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isActionPending, setIsActionPending] = useState<boolean>(false);

  const { toast } = useToast();

  const fetchUsers = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        const sortParam = `${sortOrder === 'desc' ? '-' : ''}${sortField}`;
        const data = await adminService.getUsersPaginated({
          page: currentPage,
          limit,
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          role: roleFilter !== 'ALL' ? roleFilter : undefined,
          sort: sortParam,
        });

        startTransition(() => {
          setUsers(data.items);
          setTotalCount(data.total);
          setTotalPages(data.totalPages);
        });
      } catch (err: any) {
        console.error('[AdminUserTable] Failed to fetch users:', err);
        toast.error('Sync Error', 'Could not load users from backend registry.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, limit, search, statusFilter, roleFilter, sortField, sortOrder, toast]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(1);
  };

  // Status Modal Trigger
  const handleOpenStatusModal = (user: User) => {
    setStatusModalUser(user);
    setIsStatusModalOpen(true);
  };

  // Perform Status Change (Optimistic & Real-Time Sync)
  const handleConfirmStatusChange = async () => {
    if (!statusModalUser) return;
    const targetId = statusModalUser.id;
    const nextStatus: UserStatus = statusModalUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const oldStatus = statusModalUser.status;

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, status: nextStatus } : u))
    );
    setIsStatusModalOpen(false);

    try {
      setIsActionPending(true);
      await adminService.updateUserStatus(targetId, nextStatus);
      toast.success(
        `User ${nextStatus === 'ACTIVE' ? 'Activated' : 'Suspended'}`,
        `${statusModalUser.name}'s status has been changed to ${nextStatus}.`
      );
      await fetchUsers(true);
    } catch (err: any) {
      // Revert optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, status: oldStatus } : u))
      );
      toast.error('Status Update Failed', err?.message || 'Could not update user status.');
    } finally {
      setIsActionPending(false);
      setStatusModalUser(null);
    }
  };

  // Role Modal Trigger
  const handleOpenRoleModal = (user: User) => {
    setRoleModalUser(user);
    setSelectedNewRole(user.role === 'ADMIN' ? 'USER' : 'ADMIN');
    setRoleReason('');
    setIsRoleModalOpen(true);
  };

  // Perform Role Change (Optimistic & Real-Time Sync)
  const handleConfirmRoleChange = async () => {
    if (!roleModalUser) return;
    const targetId = roleModalUser.id;
    const oldRole = roleModalUser.role;
    const nextRole = selectedNewRole;

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, role: nextRole } : u))
    );
    setIsRoleModalOpen(false);

    try {
      setIsActionPending(true);
      await adminService.updateUserRole(targetId, nextRole, roleReason.trim() || undefined);
      toast.success(
        `Role Changed to ${nextRole}`,
        `${roleModalUser.name} is now assigned the ${nextRole} role.`
      );
      await fetchUsers(true);
    } catch (err: any) {
      // Revert optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, role: oldRole } : u))
      );
      toast.error('Role Update Failed', err?.message || 'Could not update user role.');
    } finally {
      setIsActionPending(false);
      setRoleModalUser(null);
    }
  };

  // Sort Toggle
  const handleSortToggle = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalCount);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Control Bar: Filters, Search, Items per page */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or organization..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            rightIcon={
              search ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Filter dropdowns & sync button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* Page Limit Selector */}
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchUsers(true)}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden transition-colors">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Role & Permissions</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Verifications</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <TableSkeleton rows={6} columns={6} />
            </table>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Users className="w-12 h-12 text-slate-300 dark:text-slate-600" />}
              title="No Users Found"
              description={
                search || statusFilter !== 'ALL' || roleFilter !== 'ALL'
                  ? 'No users match the active filters or search keyword.'
                  : 'There are currently no registered users in the platform database.'
              }
              action={
                search || statusFilter !== 'ALL' || roleFilter !== 'ALL' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('ALL');
                      setRoleFilter('ALL');
                      setCurrentPage(1);
                    }}
                  >
                    Clear All Filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th
                    className="py-4 px-6 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSortToggle('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>User</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-4 px-6">Role & Permissions</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Verifications</th>
                  <th
                    className="py-4 px-6 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSortToggle('createdAt')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Joined Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {users.map((user) => {
                  const initials = user.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'U';

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* User Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div className="truncate max-w-[220px]">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            {user.role}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenRoleModal(user)}
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Change User Role"
                          >
                            Change
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={user.status} />
                        </div>
                      </td>

                      {/* Total Checks */}
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-200">
                          {user.totalChecks ?? 0}
                        </div>
                        <div className="text-[10px] text-slate-400">Claims verified</div>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role Quick Toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenRoleModal(user)}
                            className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            title="Change Role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          {/* Suspend / Activate Toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenStatusModal(user)}
                            className={`text-xs ${
                              user.status === 'ACTIVE'
                                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            title={user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                          >
                            {user.status === 'ACTIVE' ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {!isLoading && users.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-900 dark:text-white">{startRecord}</span> to{' '}
              <span className="font-bold text-slate-900 dark:text-white">{endRecord}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span> registered users
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1 || isActionPending}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              {/* Page Indicator */}
              <div className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages || isActionPending}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Suspend / Activate */}
      <ConfirmationModal
        isOpen={isStatusModalOpen}
        title={statusModalUser?.status === 'ACTIVE' ? 'Suspend User Account' : 'Activate User Account'}
        message={
          statusModalUser?.status === 'ACTIVE'
            ? `Are you sure you want to suspend ${statusModalUser?.name}? They will immediately lose access to submit new verifications and interact with the platform.`
            : `Are you sure you want to reactivate ${statusModalUser?.name}? Their access to the platform will be restored immediately.`
        }
        confirmText={statusModalUser?.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
        confirmVariant={statusModalUser?.status === 'ACTIVE' ? 'danger' : 'primary'}
        isLoading={isActionPending}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setIsStatusModalOpen(false)}
      />

      {/* Role Change Modal */}
      {isRoleModalOpen && roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-base">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Change User Role</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update access level for <strong className="text-slate-900 dark:text-white">{roleModalUser.name}</strong> ({roleModalUser.email}).
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-slate-400 block">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedNewRole('USER')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedNewRole === 'USER'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>Standard User</span>
                    {selectedNewRole === 'USER' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal">Can submit claims and view reports</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedNewRole('ADMIN')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedNewRole === 'ADMIN'
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>Administrator</span>
                    {selectedNewRole === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal">Full control over users, reviews, and settings</p>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 block">Audit Reason (Optional)</label>
              <input
                type="text"
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                placeholder="e.g., Promoted to fact-checking team"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRoleModalOpen(false)}
                disabled={isActionPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRoleChange}
                isLoading={isActionPending}
              >
                Save Role Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
