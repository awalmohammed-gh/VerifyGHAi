import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AuthProgressIndicator } from '../../components/auth/AuthProgressIndicator';
import { AuthFormSkeleton } from '../../components/auth/AuthFormSkeleton';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoading: isAuthLoading } = useAuth();

  // Show skeleton loader if authentication context is still initializing session
  if (isAuthLoading) {
    return <AuthFormSkeleton variant="forgot-password" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate recovery email dispatch network request
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSubmitted(true);
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
        <h2 className="text-2xl font-black text-slate-900">Reset your password</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Enter your registered email address to receive password recovery instructions.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden">
        {/* Network Request Progress Indicator */}
        <AuthProgressIndicator
          isLoading={isSubmitting}
          variant="default"
          steps={[
            'Verifying registered account status...',
            'Generating one-time recovery token...',
            'Dispatching cryptographic reset instructions...',
          ]}
        />

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Registered Email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              disabled={isSubmitting}
              autoComplete="email"
            />

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full"
            >
              {isSubmitting ? 'Sending Instructions...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Recovery Email Dispatched</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              If an account exists for <span className="font-semibold text-slate-800">{email}</span>, you will receive password reset instructions shortly.
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
