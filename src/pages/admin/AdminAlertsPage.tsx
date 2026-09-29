import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BellRing,
  Plus,
  AlertTriangle,
  ShieldCheck,
  Info,
  Trash2,
  Eye,
  Archive,
  Search,
  Filter,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AlertItem } from '../../types';
import { AlertModal } from '../../components/admin/AlertModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertItem | null>(null);
  const [deleteAlert, setDeleteAlert] = useState<AlertItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleSaveAlert = async (alertData: any) => {
    try {
      if (editingAlert) {
        await adminService.updateAlert(editingAlert.id, alertData);
        toast.success('Alert Updated', 'Advisory notice updated.');
      } else {
        await adminService.createAlert(alertData);
        toast.success('Alert Broadcasted', 'Public notification has been published across the portal.');
      }
      setIsModalOpen(false);
      setEditingAlert(null);
      await loadAlerts();
    } catch (err: any) {
      toast.error('Failed to Save', err?.message || 'Unable to broadcast alert.');
    }
  };

  const handleToggleArchive = async (item: AlertItem) => {
    try {
      const nextActive = !item.isActive;
      await adminService.updateAlert(item.id, { isActive: nextActive });
      toast.info(
        nextActive ? 'Alert Reactivated' : 'Alert Archived',
        `Advisory "${item.title}" is now ${nextActive ? 'active' : 'archived'}.`
      );
      await loadAlerts();
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Could not change alert status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAlert) return;
    try {
      setIsDeleting(true);
      await adminService.deleteAlert(deleteAlert.id);
      toast.success('Alert Deleted', 'Advisory removed completely.');
      setDeleteAlert(null);
      await loadAlerts();
    } catch (err: any) {
      toast.error('Delete Failed', err?.message || 'Could not delete alert.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = alerts.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.createdBy.toLowerCase().includes(q);

    const matchesSeverity = severityFilter === 'ALL' || item.severity === severityFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && item.isActive) ||
      (statusFilter === 'ARCHIVED' && !item.isActive);

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <BellRing className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Public Alerts & Misinformation Advisories
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Broadcast critical warnings, viral health scam alerts, and emerging hoax advisories across the platform.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setEditingAlert(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Broadcast New Alert
          </Button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Input
            placeholder="Search advisory title, keywords, author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Broadcast Statuses</option>
              <option value="ACTIVE">ACTIVE ONLY</option>
              <option value="ARCHIVED">ARCHIVED ONLY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      {isLoading ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200/90 shadow-2xs">
          <LoadingSpinner size="md" label="Loading public safety advisories..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-2 bg-white rounded-3xl border border-slate-200/90 shadow-2xs">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 stroke-[1.5]" />
          <p className="text-sm font-bold text-slate-700">No advisories match filter criteria</p>
          <p className="text-xs text-slate-400">All emergency broadcast channels are clear.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-6 rounded-3xl border transition-all ${
                item.isActive
                  ? 'bg-white border-slate-200/90 shadow-2xs'
                  : 'bg-slate-50 border-slate-200/80 opacity-70'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={item.severity as any} size="sm" />
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {item.isActive ? 'BROADCASTING' : 'ARCHIVED'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Target: {item.targetAudience} • By {item.createdBy}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-3.5 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                    {item.description}
                  </p>

                  <span className="text-[10px] text-slate-400 font-mono block">
                    Broadcasted: {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex sm:flex-col items-center gap-2 self-end sm:self-start">
                  <Link to={`/admin/alerts/${item.id}`}>
                    <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                      Details
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleArchive(item)}
                    leftIcon={<Archive className="w-3.5 h-3.5" />}
                  >
                    {item.isActive ? 'Archive' : 'Activate'}
                  </Button>
                  <button
                    onClick={() => setDeleteAlert(item)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AlertModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAlert(null);
        }}
        onSubmit={handleSaveAlert}
        initialData={editingAlert}
      />

      {/* Delete Confirmation */}
      {deleteAlert && (
        <ConfirmationModal
          isOpen={!!deleteAlert}
          onClose={() => setDeleteAlert(null)}
          onConfirm={handleDeleteConfirm}
          title={`Delete Advisory: ${deleteAlert.title}?`}
          message="Are you sure you want to permanently delete this public advisory? It will be removed from all user banners and system logs."
          confirmText="Delete Advisory"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
