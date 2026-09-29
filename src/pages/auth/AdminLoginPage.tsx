import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, ArrowRight, AlertTriangle, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthProgressIndicator } from '../../components/auth/AuthProgressIndicator';
import { AuthFormSkeleton } from '../../components/auth/AuthFormSkeleton';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { adminLogin, logout, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  // Show skeleton loader if authentication context is still initializing session
  if (isAuthLoading) {
    return <AuthFormSkeleton variant="admin" />;
  }

  const ALLOWED_ADMIN_EMAIL = 'dion12@gmail.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your administrative email and password.');
      return;
    }

    if (email.trim().toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      setError('Access Restricted: Only authorized administrative accounts (dion12@gmail.com) have access to the admin dashboard.');
      toast.error('Access Denied', 'Administrative privileges are restricted to dion12@gmail.com.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const user = await adminLogin(email, password);

      if (user.role !== 'ADMIN' || user.email.toLowerCase().trim() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
        await logout();
        setError('Forbidden: Only dion12@gmail.com possesses administrative dashboard access.');
        toast.error('Access Denied', 'Administrative privileges are restricted to dion12@gmail.com.');
        return;
      }

      toast.success('Admin Authenticated', `Welcome back, System Administrator ${user.name}`);
      const destination = from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin/dashboard';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid administrative credentials. Access restricted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-blue-400 border border-slate-700 shadow-md mb-1">
          <Key className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-red-800 text-[11px] font-bold uppercase tracking-wider block mx-auto w-fit">
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          Restricted Area • Administrative Portal
        </div>
        <h1 className="text-2xl font-black text-slate-900">Admin Sign In</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Authorized personnel only. Access system governance queues, verified sources, and AI analytics.
        </p>
      </div>

      {/* Admin Auth Card */}
      <div className="rounded-3xl border border-slate-300/80 bg-white p-6 sm:p-8 shadow-sm space-y-5 relative overflow-hidden">
        {/* Network Request Progress Indicator */}
        <AuthProgressIndicator
          isLoading={isSubmitting}
          variant="admin"
          steps={[
            'Verifying cryptographic credentials...',
            'Auditing RBAC clearance & permissions...',
            'Validating administrative hardware token...',
            'Issuing elevated session keys...',
          ]}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 font-medium text-left">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Admin Email"
            type="email"
            placeholder="dion12@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            disabled={isSubmitting}
            autoComplete="email"
          />

          <Input
            label="Admin Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            disabled={isSubmitting}
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span>Remember workstation</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          >
            {isSubmitting ? 'Authenticating Admin...' : 'Authenticate as Administrator'}
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Need setup?{' '}
            <Link to="/admin/setup" className="font-bold text-slate-800 hover:text-blue-600 hover:underline">
              Provision Admin
            </Link>
          </div>
          <div>
            Standard user?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
