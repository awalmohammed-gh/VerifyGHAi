import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  AlertTriangle,
  Eye,
  CheckCircle2,
  BellRing,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Submission, Classification } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ClassificationBadge } from '../../components/verification/ClassificationBadge';
import { ConfidenceScoreGauge, ConfidenceThresholdBadge } from '../../components/verification/ConfidenceScoreGauge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';


export const AdminFlaggedPage: React.FC = () => {
  const [flaggedSubmissions, setFlaggedSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchFlagged = async () => {
      try {
        setIsLoading(true);
        const data = await adminService.getSubmissions();
        const flagged = data.filter(
          (s) => s.result?.classification === 'FAKE' || s.result?.classification === 'SUSPICIOUS'
        );
        setFlaggedSubmissions(flagged);
      } catch (err) {
        console.error('Failed to load flagged submissions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlagged();
  }, []);

  const filtered = flaggedSubmissions.filter((sub) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      sub.fullContent.toLowerCase().includes(q) ||
      sub.contentPreview.toLowerCase().includes(q) ||
      sub.userName.toLowerCase().includes(q) ||
      (sub.result?.source.name && sub.result.source.name.toLowerCase().includes(q));

    const matchesClass = classFilter === 'ALL' || sub.result?.classification === classFilter;

    return matchesSearch && matchesClass;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">Flagged Misinformation Feed</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              High-risk content and viral hoaxes identified by AI indicators and automated fact-checking heuristics.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-100/70 px-3 py-1.5 rounded-xl border border-rose-200">
            <span>High-Risk Detections:</span>
            <span className="font-mono text-sm">{flaggedSubmissions.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search flagged claims, keywords, users, or domains..."
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
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Flagged Tiers</option>
              <option value="FAKE">FAKE (Disproven Hoaxes)</option>
              <option value="SUSPICIOUS">SUSPICIOUS (Unverified)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner size="md" label="Loading flagged misinformation index..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-700">No flagged misinformation records found</p>
            <p className="text-xs text-slate-400">All submissions in this query range have acceptable credibility scores.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Flagged Content</th>
                    <th className="px-5 py-3.5">Submitted By</th>
                    <th className="px-5 py-3.5">Classification</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Origin Domain</th>
                    <th className="px-5 py-3.5">Ingested</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginated.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Content Preview */}
                      <td className="px-5 py-4 max-w-xs sm:max-w-md">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 line-clamp-2 leading-snug">
                            "{sub.contentPreview}"
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            ID: {sub.id}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block truncate max-w-[130px]">{sub.userName}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[130px] font-mono">{sub.userEmail}</span>
                      </td>

                      {/* Classification & Credibility Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {sub.result && (
                          <ConfidenceThresholdBadge
                            score={sub.result.score}
                            confidence={sub.result.confidence}
                            classification={sub.result.classification}
                            size="sm"
                          />
                        )}
                      </td>

                      {/* Confidence Score Gauge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {sub.result && (
                          <ConfidenceScoreGauge
                            score={sub.result.score}
                            confidence={sub.result.confidence}
                            classification={sub.result.classification}
                            variant="compact"
                            size="sm"
                            showBadge={false}
                          />
                        )}
                      </td>

                      {/* Origin Domain */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block truncate max-w-[130px]">
                          {sub.result?.source.name || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[130px]">
                          {sub.result?.source.domain}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(sub.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                        <Link to={`/admin/flagged/${sub.id}`}>
                          <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                            Investigate
                          </Button>
                        </Link>
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
                of <strong className="text-slate-800">{filtered.length}</strong> flagged submissions
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
    </div>
  );
};
