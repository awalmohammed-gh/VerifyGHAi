import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Eye,
  SlidersHorizontal,
  FileCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { ReviewQueueItem, Submission, Classification } from '../../types';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/common/Skeleton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ClassificationBadge } from '../../components/verification/ClassificationBadge';
import { PriorityBadge } from '../../components/admin/PriorityBadge';
import { StatusBadge } from '../../components/admin/StatusBadge';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'RESOLVED' | 'ALL'>('PENDING');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { toast } = useToast();

  const loadReviewsData = async () => {
    try {
      setIsLoading(true);
      const queue = await adminService.getReviewQueue({
        status: statusFilter,
        priority: priorityFilter,
      });
      setReviews(queue);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviewsData();
    setCurrentPage(1);
  }, [statusFilter, priorityFilter]);

  const totalPages = Math.ceil(reviews.length / itemsPerPage) || 1;
  const paginated = reviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingCount = reviews.filter((r) => r.status === 'PENDING').length;
  const resolvedCount = reviews.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">Manual Review Workspace</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Adjudicate flagged content, review edge cases, and override automated classification confidence scores.
            </p>
          </div>

          {/* Tab Selector for Pending vs Resolved */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1 self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                statusFilter === 'RESOLVED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Priority Level:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">HIGH Priority</option>
              <option value="MEDIUM">MEDIUM Priority</option>
              <option value="LOW">LOW Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Submission Snippet</th>
                  <th className="px-5 py-3.5">Automated Result</th>
                  <th className="px-5 py-3.5">Flag Reason</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Adjudication</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <TableSkeleton rows={6} columns={7} />
            </table>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-700">No review queue items</p>
            <p className="text-xs text-slate-400">All flagged submissions in this filter category have been adjudicated.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Submission Snippet</th>
                    <th className="px-5 py-3.5">Automated Result</th>
                    <th className="px-5 py-3.5">Flag Reason</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Adjudication</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginated.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Priority */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <PriorityBadge priority={item.priority} size="sm" />
                      </td>

                      {/* Snippet */}
                      <td className="px-5 py-4 max-w-xs sm:max-w-md">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 line-clamp-2 leading-snug">
                            "{item.submissionSnippet || item.submission?.contentPreview}"
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Submission ID: {item.submissionId}
                          </span>
                        </div>
                      </td>

                      {/* Automated Classification & Score */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <ClassificationBadge classification={item.autoClassification} size="sm" />
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Score: <strong className="text-slate-700">{item.autoScore}/100</strong>
                          </span>
                        </div>
                      </td>

                      {/* Flag Reason */}
                      <td className="px-5 py-4 max-w-[200px]">
                        <span className="text-[11px] text-slate-600 font-medium line-clamp-2">
                          {item.flagReason}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            item.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Adjudication Decision */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {item.decision ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block font-mono text-[11px]">
                              {item.decision}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              By {item.reviewedBy || 'Admin'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Awaiting decision</span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Link to={`/admin/reviews/${item.submissionId}`}>
                          <Button
                            variant={item.status === 'PENDING' ? 'primary' : 'secondary'}
                            size="sm"
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            {item.status === 'PENDING' ? 'Review' : 'View Decision'}
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
                  {Math.min(currentPage * itemsPerPage, reviews.length)}
                </strong>{' '}
                of <strong className="text-slate-800">{reviews.length}</strong> review queue items
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
