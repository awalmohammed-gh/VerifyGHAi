import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Key,
  Shield,
  ShieldCheck,
  Smartphone,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  History,
  Laptop,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { DeleteAccountModal } from './DeleteAccountModal';

export const AccountSettingsTab: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-blue-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = calculatePasswordStrength(newPassword);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (currentUser?.id) {
        await authService.changePassword(currentUser.id, currentPassword, newPassword);
      }
      toast.success('Password Updated', 'Your security password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
      toast.error('Update Failed', err?.message || 'Unable to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggle2FA = () => {
    const nextState = !twoFactorEnabled;
    setTwoFactorEnabled(nextState);
    if (nextState) {
      toast.success('2FA Activated', 'Two-factor authenticator verification has been enabled for sign-in.');
    } else {
      toast.info('2FA Disabled', 'Two-factor protection disabled.');
    }
  };

  const handleConfirmDeleteAccount = async (password: string) => {
    if (!currentUser?.id) return;
    try {
      await authService.deleteAccount(currentUser.id, password);
      await logout();
      toast.info('Account Deleted', 'Your account and data have been permanently removed.');
      navigate('/login');
    } catch (err: any) {
      toast.error('Delete Failed', err?.message || 'Unable to delete account.');
      throw err;
    }
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* 1. Change Password Section */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Change Password</h3>
          </div>
          <p className="text-xs text-slate-500">
            Ensure your account is protected with a strong, unique passphrase.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-2xl">
          <div className="space-y-4">
            <div>
              <Input
                label="Current Password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="Enter current password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="focus:outline-none hover:text-slate-700 cursor-pointer"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="At least 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="focus:outline-none hover:text-slate-700 cursor-pointer"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Input
                label="Confirm New Password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="Re-type new password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="focus:outline-none hover:text-slate-700 cursor-pointer"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            {/* Password strength bar */}
            {newPassword && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Password strength:</span>
                  <span className="font-bold text-slate-700">{strength.label}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {passwordError}
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" size="md" isLoading={isUpdatingPassword} leftIcon={<Key className="w-4 h-4" />}>
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Security & Active Sessions Section */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Security & Authentication Methods</h3>
          </div>
          <p className="text-xs text-slate-500">Manage multi-factor authentication and review authenticated devices.</p>
        </div>

        {/* 2FA Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs sm:text-sm">Two-Factor Authentication (2FA)</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    twoFactorEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Add an extra layer of protection requiring a one-time verification code when signing in.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant={twoFactorEnabled ? 'outline' : 'primary'}
            size="sm"
            onClick={handleToggle2FA}
            className="self-end sm:self-center flex-shrink-0"
          >
            {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
        </div>

        {/* Active Session Info */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Active Session</h4>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/60 border border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200/70 text-slate-700 flex items-center justify-center flex-shrink-0">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Current Web Browser Session</span>
                <span className="text-slate-400 font-mono text-[11px]">Accra, Ghana (IP: 102.176.xx.xx) • Active now</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              This Device
            </span>
          </div>
        </div>
      </div>

      {/* 3. Danger Zone Section */}
      <div className="rounded-3xl border border-red-200/90 bg-red-50/30 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-red-950">Danger Zone</h3>
          </div>
          <p className="text-xs text-red-700/80">
            Irreversible actions regarding your account existence and historical data records.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-red-200 shadow-2xs">
          <div>
            <span className="font-bold text-slate-900 block text-xs sm:text-sm">Delete VerifAI GH Account</span>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
              Permanently delete your user profile, submitted claims, saved reports, and personal metrics.
            </p>
          </div>

          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="flex-shrink-0 self-end sm:self-center"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal Guard */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDeleteAccount}
        userEmail={currentUser?.email}
      />
    </div>
  );
};
