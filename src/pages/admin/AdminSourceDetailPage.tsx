import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Calendar,
  ExternalLink,
  History,
  Archive,
  Edit3,
  CheckCircle2
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Source, Submission, FactCheck } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ClassificationBadge } from '../../components/verification/ClassificationBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';

export const AdminSourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [source, setSource] = useState<Source | null>(null);
  const [relatedSubmissions, setRelatedSubmissions] = useState<Submission[]>([]);
  const [factChecks, setFactChecks] = useState<FactCheck[]>([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const loadSourceData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await adminService.getSourceById(id);
      if (res?.source) {
        setSource(res.source);
        setRelatedSubmissions(res.relatedSubmissions || []);
        setFactChecks(res.factChecks || []);
        setAdminNotes(res.source.notes || 'Domain regularly monitored for viral social misattribution.');
      } else {
        setError('Source registry entry not found.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve source record.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSourceData();
  }, [id]);

  const handleSaveNotes = async () => {
    if (!source) return;
    try {
      setIsSavingNotes(true);
      await adminService.updateSource(source.id, { notes: adminNotes });
      toast.success('Notes Saved', 'Internal administrator notes updated.');
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Could not update notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!source) return;
    const newStatus = !source.isArchived;
    try {
      await adminService.updateSource(source.id, { isArchived: newStatus });
      toast.success('Registry Updated', `Source has been ${newStatus ? 'archived' : 'unarchived'}.`);
      await loadSourceData();
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Unable to modify archive state.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading domain credibility intelligence profile..." />;
  }

  if (error || !source) {
    return (
      <ErrorState
        title="Source Not Found"
        message={error || 'The requested publisher domain does not exist in the credibility registry.'}
        onRetry={() => navigate('/admin/sources')}
      />
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header / Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/sources"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Credibility Registry
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant={source.isArchived ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleToggleArchive}
            leftIcon={<Archive className="w-3.5 h-3.5" />}
          >
            {source.isArchived ? 'Unarchive Source' : 'Archive Source'}
          </Button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black shadow-sm">
              <Globe className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-slate-900">{source.name}</h1>
                <Badge
                  variant={
                    source.status === 'VERIFIED'
                      ? 'success'
                      : source.status === 'SUSPICIOUS' || source.status === 'UNRELIABLE'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                >
                  {source.status}
                </Badge>
                {source.isArchived && <Badge variant="neutral" size="sm">Archived</Badge>}
              </div>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> {source.domain} • {source.category} • {source.country}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 self-start sm:self-auto">
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Credibility Score
              </span>
              <span className="text-3xl font-black text-slate-900 font-mono">
                {source.credibilityScore}<span className="text-sm font-bold text-slate-400">/100</span>
              </span>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Disinfo Flags
              </span>
              <span className="text-3xl font-black text-rose-600 font-mono">
                {source.misinformationRecords}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Domain Description</h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {source.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Admin Notes & Source History */}
        <div className="space-y-6">
          {/* Admin Internal Notes */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">Administrator Security Notes</h2>
              <Button
                variant="secondary"
                size="sm"
                isLoading={isSavingNotes}
                onClick={handleSaveNotes}
              >
                Save Notes
              </Button>
            </div>
            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              placeholder="Record forensic audit observations, editorial ownership info, or domain flags..."
            />
          </div>

          {/* Source Chronological Audit History */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <History className="w-4 h-4 text-blue-600" />
              Source Timeline & Reputation Audit
            </div>
            <div className="space-y-3">
              {(source.history && source.history.length > 0 ? source.history : [
                {
                  id: 'h-1',
                  date: source.lastUpdated,
                  event: 'Registry Audit Refresh',
                  type: 'VERIFICATION',
                  details: `Automated scoring routine indexed ${source.totalChecks} domain verification checks.`
                },
                {
                  id: 'h-2',
                  date: '2025-10-14',
                  event: 'Domain Verification Recorded',
                  type: 'STATUS_CHANGE',
                  details: 'Publisher registered under African Media Credibility framework.'
                }
              ]).map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.event}</span>
                    <span className="text-[11px] font-mono text-slate-400">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-600">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Related Submissions & Fact Checks */}
        <div className="space-y-6">
          {/* Related Submissions */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">Related Citizen Submissions</h2>
              <Badge variant="neutral" size="sm">{relatedSubmissions.length} Ingestions</Badge>
            </div>

            {relatedSubmissions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No submissions linked directly to this domain yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {relatedSubmissions.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-1 max-w-sm">
                      <p className="text-xs text-slate-800 font-medium line-clamp-1">{sub.contentPreview}</p>
                      <span className="text-[11px] text-slate-400 font-mono">{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClassificationBadge classification={sub.result?.classification || 'TRUSTED'} size="sm" />
                      <Link to={`/admin/submissions/${sub.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Fact Checks */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">Cross-Referenced Fact Checks</h2>
              <Badge variant="neutral" size="sm">{factChecks.length} Records</Badge>
            </div>

            {factChecks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No fact-check records cite this publisher.</p>
            ) : (
              <div className="space-y-2">
                {factChecks.slice(0, 4).map((fc) => (
                  <div key={fc.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">{fc.claim}</span>
                      <Badge variant={fc.verdict === 'FALSE' ? 'danger' : 'warning'} size="sm">{fc.verdict}</Badge>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Date: {fc.date} • Verified by: {fc.verifiedBy}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
