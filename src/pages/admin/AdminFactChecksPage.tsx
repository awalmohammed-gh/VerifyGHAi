import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit2
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { FactCheck } from '../../types';
import { FactCheckModal } from '../../components/admin/FactCheckModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminFactChecksPage: React.FC = () => {
  const [factChecks, setFactChecks] = useState<FactCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { toast } = useToast();

  const loadFactChecks = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getFactChecks();
      setFactChecks(data);
    } catch (err) {
      console.error('Failed to load fact checks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFactChecks();
  }, []);

  const handleAddFactCheck = async (data: Omit<FactCheck, 'id' | 'date'>) => {
    try {
      await adminService.addFactCheck(data);
      toast.success('Fact-Check Published', 'New verified debunking added to the platform knowledge base.');
      setIsModalOpen(false);
      await loadFactChecks();
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Could not save fact-check.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await adminService.deleteFactCheck(deleteId);
      toast.success('Fact-Check Removed', 'Record deleted from repository.');
      setDeleteId(null);
      await loadFactChecks();
    } catch (err: any) {
      toast.error('Delete Failed', err?.message || 'Could not delete record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = factChecks.filter((fc) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      fc.claim.toLowerCase().includes(q) ||
      fc.source.toLowerCase().includes(q) ||
      fc.notes.toLowerCase().includes(q) ||
      fc.verifiedBy.toLowerCase().includes(q);

    const matchesVerdict = verdictFilter === 'ALL' || fc.verdict === verdictFilter;

    return matchesSearch && matchesVerdict;
  });

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
                <Database className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">Fact-Check Knowledge Base</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Curated official gazette notices, verified debunkings, and cross-referenced claims repository.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Fact-Check
          </Button>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search claims, ministries, source outlets, or keywords..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <select
              value={verdictFilter}
              onChange={(e) => {
                setVerdictFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Verdicts</option>
              <option value="FALSE">FALSE (Debunked)</option>
              <option value="MISLEADING">MISLEADING (Partial Truth)</option>
              <option value="TRUE">TRUE (Verified Fact)</option>
              <option value="UNPROVEN">UNPROVEN (Inconclusive)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fact Checks Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-2 bg-white rounded-3xl border border-slate-200/90 shadow-2xs">
          <Database className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
          <p className="text-sm font-bold text-slate-700">No fact checks match criteria</p>
          <p className="text-xs text-slate-400">Try modifying your verdict filter or search query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginated.map((fc) => {
              let badgeVariant: 'danger' | 'warning' | 'success' | 'neutral' = 'neutral';
              if (fc.verdict === 'FALSE') badgeVariant = 'danger';
              if (fc.verdict === 'MISLEADING') badgeVariant = 'warning';
              if (fc.verdict === 'TRUE') badgeVariant = 'success';

              return (
                <div
                  key={fc.id}
                  className="p-5 sm:p-6 rounded-3xl border border-slate-200/90 bg-white shadow-2xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant={badgeVariant} size="sm">
                        {fc.verdict}
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-mono">{fc.date}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      "{fc.claim}"
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 line-clamp-3">
                      {fc.notes}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
                    <div className="truncate">
                      <span className="font-semibold text-slate-700 block truncate">
                        Ref: {fc.source}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        By {fc.verifiedBy}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link to={`/admin/fact-checks/${fc.id}`}>
                        <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                          Dossier
                        </Button>
                      </Link>
                      <button
                        onClick={() => setDeleteId(fc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
              <strong className="text-slate-800">
                {Math.min(currentPage * itemsPerPage, filtered.length)}
              </strong>{' '}
              of <strong className="text-slate-800">{filtered.length}</strong> fact checks
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
        </div>
      )}

      {/* Add Fact Check Modal */}
      <FactCheckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddFactCheck}
      />

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <ConfirmationModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Fact-Check Record?"
          message="Are you sure you want to delete this fact-check entry from the verification knowledge base? Associated submissions will no longer cross-reference this record."
          confirmText="Delete Entry"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
