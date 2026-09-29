import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BellRing,
  AlertTriangle,
  Calendar,
  User,
  Users,
  ShieldCheck,
  Archive,
  Trash2,
  Edit2
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AlertItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { AlertModal } from '../../components/admin/AlertModal';
import { useToast } from '../../context/ToastContext';

export const AdminAlertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [alert, setAlert] = useState<AlertItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAlert = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const alerts = await adminService.getAlerts();
      const found = alerts.find((a) => a.id === id);
      if (found) {
        setAlert(found);
      } else {
        setError('Alert record not found.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load alert advisory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlert();
  }, [id]);

  const handleToggleArchive = async () => {
    if (!alert) return;
    try {
      const nextActive = !alert.isActive;
      await adminService.updateAlert(alert.id, { isActive: nextActive });
      toast.success(
        nextActive ? 'Alert Reactivated' : 'Alert Archived',
        `Advisory status updated.`
      );
      await loadAlert();
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Could not update alert.');
    }
  };

  const handleSaveEdit = async (data: any) => {
    if (!alert) return;
    try {
      await adminService.updateAlert(alert.id, data);
      toast.success('Alert Updated', 'Advisory updated successfully.');
      setIsEditModalOpen(false);
      await loadAlert();
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Could not update advisory.');
    }
  };

  const handleDelete = async () => {
    if (!alert) return;
    try {
      setIsDeleting(true);
      await adminService.deleteAlert(alert.id);
      toast.success('Alert Deleted', 'Advisory removed from system.');
      navigate('/admin/alerts');
    } catch (err: any) {
      toast.error('Delete Failed', err?.message || 'Could not delete alert.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading advisory details..." />;
  }

  if (error || !alert) {
    return (
      <ErrorState
        title="Alert Not Found"
        message={error || 'The requested advisory record could not be located.'}
        onRetry={() => navigate('/admin/alerts')}
      />
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/alerts"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Advisories
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit Advisory
          </Button>
          <Button
            variant={alert.isActive ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleToggleArchive}
            leftIcon={<Archive className="w-3.5 h-3.5" />}
          >
            {alert.isActive ? 'Archive Advisory' : 'Reactivate'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Alert Detail Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={alert.severity as any} size="md" />
              <span
                className={`px-2.5 py-0.5 text-xs font-extrabold uppercase rounded-full border ${
                  alert.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {alert.isActive ? 'ACTIVE BROADCAST' : 'ARCHIVED'}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {alert.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {alert.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Created by: <strong className="text-slate-800">{alert.createdBy}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Broadcast Time: {new Date(alert.createdAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Audience: <strong className="text-slate-800">{alert.targetAudience}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Advisory Notice Text & Refutation Guidance
          </h2>
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
            {alert.description}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AlertModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleSaveEdit}
        initialData={alert}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Emergency Advisory?"
        message="Are you sure you want to permanently delete this public advisory?"
        confirmText="Delete Advisory"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
