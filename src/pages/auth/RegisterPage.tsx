import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, User, ArrowRight, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthProgressIndicator } from '../../components/auth/AuthProgressIndicator';
import { AuthFormSkeleton } from '../../components/auth/AuthFormSkeleton';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Show skeleton loader if authentication context is still initializing session
  if (isAuthLoading) {
    return <AuthFormSkeleton variant="register" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await register({ name, email, password, organization });
      toast.success('Account Created!', 'Welcome to VerifAI GH.');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
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
        <h1 className="text-2xl font-black text-slate-900">Create your account</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Get started with rapid fact-checking and misinformation verification.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden">
        {/* Network Request Progress Indicator */}
        <AuthProgressIndicator
          isLoading={isSubmitting}
          variant="default"
          steps={[
            'Validating account information...',
            'Provisioning user record & security profiles...',
            'Hashing credentials & issuing access tokens...',
            'Setting up verification workspace...',
          ]}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="Kwame Mensah"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="kwame@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Organization (Optional)"
            placeholder="e.g., Ghana News Agency, Independent Citizen"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            leftIcon={<Building className="w-4 h-4" />}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Confirm"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="text-[11px] text-slate-500 pt-1">
            By signing up, you agree to our Terms of Service and Verification Ethics Policy.
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account & Get Started'}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
