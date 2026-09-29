import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthProgressIndicator } from '../../components/auth/AuthProgressIndicator';
import { AuthFormSkeleton } from '../../components/auth/AuthFormSkeleton';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string; state?: any }; message?: string })?.from?.pathname || '/dashboard';
  const customMessage = (location.state as { message?: string })?.message;

  // Show skeleton loader if authentication context is still initializing session
  if (isAuthLoading) {
    return <AuthFormSkeleton variant="login" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const user = await login(email, password);
      toast.success('Welcome Back!', `Signed in as ${user.name}`);
      
      // Strict role-based redirect: only dion12@gmail.com has admin dashboard clearance
      if (user.role === 'ADMIN' && user.email.toLowerCase().trim() === 'dion12@gmail.com') {
        const destination = from.startsWith('/admin') ? from : '/admin';
        navigate(destination, { replace: true });
      } else {
        // Standard user always redirects to user dashboard
        const destination = from.startsWith('/admin') || from === '/login' ? '/dashboard' : from;
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. If you do not have an account, please create one.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-1 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            VERIFAI <span className="text-blue-600">GH</span>
          </span>
        </Link>
        <h1 className="text-2xl font-black text-slate-900">Sign In to Your Account</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          An active registered account is required to access the VerifAI GH verification platform.
        </p>
      </div>

      {customMessage && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium text-left">
          {customMessage}
        </div>
      )}

      {/* Regular Clean Login Form */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden">
        {/* Network Request Progress Indicator */}
        <AuthProgressIndicator
          isLoading={isSubmitting}
          variant="default"
          steps={[
            'Validating email & credentials...',
            'Connecting to authentication node...',
            'Verifying cryptographic token signature...',
            'Initializing authenticated user session...',
          ]}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium text-left">
              {error}
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            disabled={isSubmitting}
            autoComplete="email"
          />

          <Input
            label="Password"
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
              <span>Remember me</span>
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
            className="w-full"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100/80 dark:border-blue-900/60 text-blue-900 dark:text-blue-300 flex items-center justify-between">
            <span className="font-semibold text-xs">New to VerifAI GH?</span>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 font-bold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-700 shadow-2xs hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
