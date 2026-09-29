import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthProgressIndicator } from '../../components/auth/AuthProgressIndicator';

export const AdminSetupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [organization, setOrganization] = useState('VerifAI GH Governance');
  const [roleTitle, setRoleTitle] = useState('Lead Platform Administrator');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { registerAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !adminSecretKey) {
      setError('Please fill in all required administrative registration fields.');
      return;
    }

    if (password.length < 6) {
      setError('Administrative password must be at least 6 characters in length.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await registerAdmin({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        adminSecretKey: adminSecretKey.trim(),
        organization: organization.trim(),
        roleTitle: roleTitle.trim(),
      });

      setSuccess(true);
      toast.success(
        'Admin Initialized Successfully',
        'Your administrator account has been written to the database. Redirecting to login...'
      );

      setTimeout(() => {
        navigate('/admin/login', { replace: true });
      }, 1500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Admin initialization failed. Please verify your master setup key.';
      setError(msg);
      toast.error('Setup Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 border border-slate-700 shadow-md mb-1">
          <KeyRound className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider block mx-auto w-fit">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Master Admin Provisioning • Setup Portal
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Admin Account Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Provision a primary system administrator account directly into the database. Requires your secret setup key.
        </p>
      </div>

      {/* Admin Setup Card */}
      <div className="rounded-3xl border border-slate-300/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5 relative overflow-hidden">
        {/* Network Request Progress Indicator */}
        <AuthProgressIndicator
          isLoading={isSubmitting}
          variant="admin"
          steps={[
            'Verifying master administrative setup key...',
            'Hashing administrator password with bcrypt...',
            'Persisting ADMIN record to database...',
            'Issuing elevated session credentials...',
          ]}
        />

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
              Admin Account Successfully Created
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Admin credentials for <strong className="font-semibold">{email}</strong> have been secured in the database.
            </p>
            <Button
              onClick={() => navigate('/admin/login')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
            >
              Proceed to Admin Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 font-medium text-left">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Helper Key Info Pill */}
            <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start gap-2 text-xs text-blue-800 dark:text-blue-200">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                Default Master Setup Key:{' '}
                <button
                  type="button"
                  onClick={() => setAdminSecretKey('v8f9_4d3a2e1b8c7f0a9e8d7c6b5a4f3e')}
                  className="font-mono font-bold bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded underline hover:bg-blue-200 transition-colors"
                >
                  v8f9_4d3a2e1b8c7f0a9e8d7c6b5a4f3e
                </button>{' '}
                (click to autofill).
              </div>
            </div>

            <Input
              label="Master Setup Key (Secret)"
              type="password"
              placeholder="Enter ADMIN_SETUP_KEY"
              value={adminSecretKey}
              onChange={(e) => setAdminSecretKey(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
              disabled={isSubmitting}
              helperText="Security verification key configured in the environment."
            />

            <Input
              label="Admin Full Name"
              type="text"
              placeholder="e.g. Dion Malik Deh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
              disabled={isSubmitting}
              autoComplete="name"
            />

            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@verifai.org"
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
              helperText="Minimum 6 characters with secure bcrypt hashing."
              autoComplete="new-password"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Organization / Entity"
                type="text"
                placeholder="VerifAI GH Governance"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                leftIcon={<Building2 className="w-4 h-4" />}
                disabled={isSubmitting}
              />
              <Input
                label="Role Title"
                type="text"
                placeholder="Chief Administrator"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isSubmitting ? 'Registering Admin...' : 'Create Administrator Account'}
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Already registered?</span>
          <Link to="/admin/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Go to Admin Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
