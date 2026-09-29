import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserCheck,
  ShieldAlert,
  Mail,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Shield,
  Activity
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { User, Submission, UserRole } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ClassificationBadge } from '../../components/verification/ClassificationBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';

export const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUserData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await adminService.getUserById(id);
      if (res?.user) {
        setUser(res.user);
        setSubmissions(res.submissions || []);
      } else {
        setError('User record not found.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve user profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminService.updateUserStatus(user.id, newStatus, 'Administrator');
      toast.success('Status Updated', `User account status set to ${newStatus}.`);
      await loadUserData();
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Unable to update user status.');
    }
  };

  const handleToggleRole = async () => {
    if (!user) return;
    const newRole: UserRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await adminService.updateUserRole(user.id, newRole, 'Administrator');
      toast.success('Role Updated', `User permissions changed to ${newRole}.`);
      await loadUserData();
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Unable to change user role.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading user account record..." />;
  }

  if (error || !user) {
    return (
      <ErrorState
        title="User Not Found"
        message={error || 'The requested user profile does not exist.'}
        onRetry={() => navigate('/admin/users')}
      />
    );
  }

  const verifiedCount = user.stats?.verified || submissions.filter(s => s.result?.classification === 'VERIFIED').length;
  const trustedCount = user.stats?.trusted || submissions.filter(s => s.result?.classification === 'TRUSTED').length;
  const suspiciousCount = user.stats?.suspicious || submissions.filter(s => s.result?.classification === 'SUSPICIOUS').length;
  const fakeCount = user.stats?.fake || submissions.filter(s => s.result?.classification === 'FAKE').length;
  const totalSubmissions = submissions.length || user.totalChecks;

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Top Breadcrumb / Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to User Directory
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleRole}
          >
            {user.role === 'ADMIN' ? 'Demote to User' : 'Make Administrator'}
          </Button>
          <Button
            variant={user.status === 'ACTIVE' ? 'danger' : 'secondary'}
            size="sm"
            onClick={handleToggleStatus}
          >
            {user.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
          </Button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-slate-900">{user.name}</h1>
                <Badge variant={user.role === 'ADMIN' ? 'purple' : 'info'} size="sm">
                  {user.role}
                </Badge>
                <Badge variant={user.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                  {user.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs text-slate-500 sm:text-right">
            <span className="flex items-center sm:justify-end gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center sm:justify-end gap-1.5 font-medium">
              <Building className="w-3.5 h-3.5 text-slate-400" /> {user.organization || 'Independent Citizen'}
            </span>
          </div>
        </div>

        {/* User Stats Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Total Checks</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalSubmissions}</span>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <span className="text-[11px] font-bold uppercase text-emerald-700 block mb-1">Verified</span>
            <span className="text-2xl font-extrabold text-emerald-800">{verifiedCount}</span>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <span className="text-[11px] font-bold uppercase text-blue-700 block mb-1">Trusted</span>
            <span className="text-2xl font-extrabold text-blue-800">{trustedCount}</span>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
            <span className="text-[11px] font-bold uppercase text-amber-700 block mb-1">Suspicious</span>
            <span className="text-2xl font-extrabold text-amber-800">{suspiciousCount}</span>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
            <span className="text-[11px] font-bold uppercase text-rose-700 block mb-1">Fake / Disinfo</span>
            <span className="text-2xl font-extrabold text-rose-800">{fakeCount}</span>
          </div>
        </div>
      </div>

      {/* User Verification Activity History */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">User Submission History</h2>
            <p className="text-xs text-slate-500">Recent verifications requested by this account</p>
          </div>
          <Badge variant="neutral" size="sm">
            {submissions.length} Total Records
          </Badge>
        </div>

        {submissions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No verification history recorded for this user yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map((sub) => (
              <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <ClassificationBadge
                      classification={sub.result?.classification || 'TRUSTED'}
                      size="sm"
                    />
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {sub.contentType}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-800 font-medium line-clamp-2">
                    {sub.contentPreview}
                  </p>
                  {sub.result?.source && (
                    <span className="text-[11px] text-slate-400">
                      Source: <span className="font-semibold text-slate-600">{sub.result.source.name}</span> ({sub.result.source.domain})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right font-mono">
                    <span className="text-xs font-extrabold text-slate-900 block">
                      {sub.result?.score || 0}/100
                    </span>
                    <span className="text-[10px] text-slate-400">Score</span>
                  </div>
                  <Link to={`/admin/submissions/${sub.id}`}>
                    <Button variant="outline" size="sm">
                      Inspect
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
