import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Lock } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (password: string) => Promise<void>;
  userEmail?: string;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  userEmail = 'user@example.com',
}) => {
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmPhrase.trim().toUpperCase() === 'DELETE';

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) {
      setError('Please type DELETE exactly to confirm.');
      return;
    }
    setError('');
    setIsDeleting(true);
    try {
      await onConfirmDelete(password || 'password123');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmPhrase('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-red-200 overflow-hidden flex flex-col transform transition-all text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-100 bg-red-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Account Confirmation</h3>
              <p className="text-xs text-red-700 font-medium mt-0.5">This action is permanent and irreversible</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <form onSubmit={handleDelete} className="p-6 space-y-4 text-xs text-slate-600">
          <p className="leading-relaxed">
            You are about to permanently delete your account associated with{' '}
            <strong className="text-slate-900 font-mono">{userEmail}</strong>.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-slate-700">
            <span className="font-bold text-slate-900 block text-xs">The following data will be wiped immediately:</span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
              <li>All personal verification history and submitted claims</li>
              <li>Saved fact-check reports and bookmarked evidence items</li>
              <li>Analytical benchmarks and personal accuracy tracking</li>
              <li>Active sessions and device authorization keys</li>
            </ul>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Type <span className="font-mono text-red-600 font-bold">DELETE</span> to confirm:
              </label>
              <Input
                value={confirmPhrase}
                onChange={(e) => {
                  setConfirmPhrase(e.target.value);
                  if (error) setError('');
                }}
                placeholder="DELETE"
                className="font-mono"
                disabled={isDeleting}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Password (Optional for Demo):
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                disabled={isDeleting}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleClose}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Keep My Account
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={isDeleting}
              disabled={!isConfirmed}
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Permanently Delete Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
