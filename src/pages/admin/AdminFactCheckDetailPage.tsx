import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  ExternalLink,
  ShieldCheck,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { FactCheck, Submission } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ClassificationBadge } from '../../components/verification/ClassificationBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { useToast } from '../../context/ToastContext';

export const AdminFactCheckDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [factCheck, setFactCheck] = useState<FactCheck | null>(null);
  const [matchingSubmissions, setMatchingSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const fcs = await adminService.getFactChecks();
        const found = fcs.find((f) => f.id === id);
        if (found) {
          setFactCheck(found);
          // Find matching citizen submissions
          const subs = await adminService.getSubmissions();
          const q = found.claim.toLowerCase().slice(0, 20);
          const matched = subs.filter(
            (s) =>
              s.contentPreview.toLowerCase().includes(q) ||
              (s.result?.claims && s.result.claims.some((c) => c.text.toLowerCase().includes(q)))
          );
          setMatchingSubmissions(matched);
        } else {
          setError('Fact-check entry not found.');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load fact check.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!factCheck) return;
    try {
      setIsDeleting(true);
      await adminService.deleteFactCheck(factCheck.id);
      toast.success('Fact Check Deleted', 'Record deleted from repository.');
      navigate('/admin/fact-checks');
    } catch (err: any) {
      toast.error('Delete Failed', err?.message || 'Could not delete entry.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading fact-check dossier..." />;
  }

  if (error || !factCheck) {
    return (
      <ErrorState
        title="Fact-Check Not Found"
        message={error || 'The requested fact check record could not be found.'}
        onRetry={() => navigate('/admin/fact-checks')}
      />
    );
  }

  let badgeVariant: 'danger' | 'warning' | 'success' | 'neutral' = 'neutral';
  if (factCheck.verdict === 'FALSE') badgeVariant = 'danger';
  if (factCheck.verdict === 'MISLEADING') badgeVariant = 'warning';
  if (factCheck.verdict === 'TRUE') badgeVariant = 'success';

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Back and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/fact-checks"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete Record
          </Button>
        </div>
      </div>

      {/* Main Dossier Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant={badgeVariant} size="md">
                VERDICT: {factCheck.verdict}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">ID: {factCheck.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              "{factCheck.claim}"
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Verified by: <strong className="text-slate-800">{factCheck.verifiedBy}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Published: {factCheck.date}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Origin: <strong className="text-slate-800">{factCheck.source}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Notes / Context */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Fact-Checking Findings & Context Analysis
          </h2>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
            {factCheck.notes}
          </div>
        </div>

        {/* Evidence Link */}
        {factCheck.evidenceUrl && (
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-medium">
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span>Official Reference / Source Documentation:</span>
              <a
                href={factCheck.evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 font-mono font-bold hover:underline truncate max-w-xs sm:max-w-md"
              >
                {factCheck.evidenceUrl}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Cross-Referenced Citizen Ingestions */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Cross-Referenced Submissions ({matchingSubmissions.length})
            </h2>
            <p className="text-xs text-slate-500">
              Citizen submissions matching this claim profile in the active registry
            </p>
          </div>
        </div>

        {matchingSubmissions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No live citizen submissions currently cross-reference this specific claim.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {matchingSubmissions.map((sub) => (
              <div key={sub.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 max-w-xl">
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">
                    "{sub.contentPreview}"
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono">
                    By {sub.userName} • {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <ClassificationBadge classification={sub.result?.classification || 'FAKE'} size="sm" />
                  <Link to={`/admin/submissions/${sub.id}`}>
                    <Button variant="secondary" size="sm">
                      Inspect
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Fact-Check Record?"
        message="Are you sure you want to permanently delete this fact check record? It will be removed from the public knowledge base and AI scoring heuristics."
        confirmText="Delete Record"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
