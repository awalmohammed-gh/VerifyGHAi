import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Plus,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Source, SourceStatus } from '../../types';
import { SourceModal } from '../../components/admin/SourceModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { ConfidenceScoreGauge, ConfidenceThresholdBadge } from '../../components/verification/ConfidenceScoreGauge';
import { Button } from '../../components/common/Button';

import { Input } from '../../components/common/Input';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/common/Skeleton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [deleteSource, setDeleteSource] = useState<Source | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { toast } = useToast();

  const loadSources = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getSources();
      setSources(data);
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleModalSubmit = async (sourceData: Partial<Source>) => {
    try {
      if (editingSource) {
        await adminService.updateSource(editingSource.id, sourceData);
        toast.success('Source Updated', `Updated profile for ${sourceData.name}`);
      } else {
        await adminService.addSource(sourceData as Omit<Source, 'id'>);
        toast.success('Source Registered', `Added ${sourceData.name} to Credibility Registry.`);
      }
      setIsModalOpen(false);
      setEditingSource(null);
      await loadSources();
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Unable to save source profile.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteSource) return;
    try {
      setIsDeleting(true);
      await adminService.deleteSource(deleteSource.id);
      toast.success('Source Removed', `Removed ${deleteSource.name} from registry.`);
      setDeleteSource(null);
      await loadSources();
    } catch (err: any) {
      toast.error('Delete Failed', err?.message || 'Could not delete source.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = sources.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(q) ||
      s.domain.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q);

    const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const categories = Array.from(new Set(sources.map((s) => s.category).filter(Boolean)));

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">Source Credibility Registry</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage authoritative news domains, institutional outlets, baseline credibility scores, and incident logs.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingSource(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Source
          </Button>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Input
            placeholder="Search by source name, domain, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="TRUSTED">TRUSTED</option>
              <option value="SUSPICIOUS">SUSPICIOUS</option>
              <option value="UNRELIABLE">UNRELIABLE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sources Table */}
      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Source & Publisher</th>
                  <th className="px-5 py-3.5">Domain</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Credibility Score</th>
                  <th className="px-5 py-3.5">Status Tier</th>
                  <th className="px-5 py-3.5">Misinfo Count</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <TableSkeleton rows={6} columns={7} />
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Globe className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-700">No registered sources found</p>
            <p className="text-xs text-slate-400">Try adjusting your category or domain search terms.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Source & Publisher</th>
                    <th className="px-5 py-3.5">Domain</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Credibility Score</th>
                    <th className="px-5 py-3.5">Status Tier</th>
                    <th className="px-5 py-3.5">Misinfo Count</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginated.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <span className="font-bold text-slate-900 block">{s.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">ID: {s.id}</span>
                        </div>
                      </td>

                      {/* Domain */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-[11px] text-blue-600">
                        {s.domain}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-700">
                        {s.category}
                      </td>

                      {/* Credibility Score */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <ConfidenceScoreGauge
                          score={s.credibilityScore}
                          variant="compact"
                          size="sm"
                          showBadge={false}
                        />
                      </td>

                      {/* Status & Credibility Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <ConfidenceThresholdBadge
                            score={s.credibilityScore}
                            size="xs"
                          />
                          <StatusBadge status={s.status} size="sm" />
                        </div>
                      </td>

                      {/* Past Flags */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-bold">
                        {s.previousMisinformationCount > 0 ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {s.previousMisinformationCount} incidents
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            0 flags
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-1">
                        <Link to={`/admin/sources/${s.id}`}>
                          <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                            Profile
                          </Button>
                        </Link>
                        <button
                          onClick={() => {
                            setEditingSource(s);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit Source"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteSource(s)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                <strong className="text-slate-800">
                  {Math.min(currentPage * itemsPerPage, filtered.length)}
                </strong>{' '}
                of <strong className="text-slate-800">{filtered.length}</strong> sources
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Prev
                </Button>
                <span className="px-3 py-1 font-bold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Source Modal */}
      <SourceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSource(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingSource}
      />

      {/* Delete Confirmation Modal */}
      {deleteSource && (
        <ConfirmationModal
          isOpen={!!deleteSource}
          onClose={() => setDeleteSource(null)}
          onConfirm={handleDeleteConfirm}
          title={`Remove Source: ${deleteSource.name}?`}
          message={`Are you sure you want to delete ${deleteSource.name} (${deleteSource.domain}) from the Credibility Registry? This will affect future AI source weighting.`}
          confirmText="Delete Source"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
