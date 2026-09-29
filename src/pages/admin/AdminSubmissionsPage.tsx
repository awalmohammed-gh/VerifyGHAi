import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Globe,
  FileText,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Submission, Classification, ContentType } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/Skeleton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ClassificationBadge } from '../../components/verification/ClassificationBadge';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { ConfidenceScoreGauge, ConfidenceThresholdBadge } from '../../components/verification/ConfidenceScoreGauge';


export const AdminSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [scoreRange, setScoreRange] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
    setCurrentPage(1);
  }, []);

  const filtered = submissions.filter((sub) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      sub.id.toLowerCase().includes(q) ||
      sub.fullContent.toLowerCase().includes(q) ||
      sub.contentPreview.toLowerCase().includes(q) ||
      sub.userName.toLowerCase().includes(q) ||
      sub.userEmail.toLowerCase().includes(q) ||
      (sub.result?.source.name && sub.result.source.name.toLowerCase().includes(q)) ||
      (sub.result?.source.domain && sub.result.source.domain.toLowerCase().includes(q));

    const matchesClass = selectedClass === 'ALL' || sub.result?.classification === selectedClass;
    const matchesFormat = selectedFormat === 'ALL' || sub.contentType === selectedFormat;
    const matchesStatus = selectedStatus === 'ALL' || sub.status === selectedStatus;

    let matchesScore = true;
    if (scoreRange === 'HIGH') matchesScore = (sub.result?.score ?? 0) >= 80;
    if (scoreRange === 'MED') matchesScore = (sub.result?.score ?? 0) >= 50 && (sub.result?.score ?? 0) < 80;
    if (scoreRange === 'LOW') matchesScore = (sub.result?.score ?? 0) < 50;

    return matchesSearch && matchesClass && matchesFormat && matchesStatus && matchesScore;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getFormatIcon = (type: ContentType) => {
    switch (type) {
      case 'TEXT':
        return <FileText className="w-3.5 h-3.5 text-blue-500" />;
      case 'ARTICLE_URL':
        return <Globe className="w-3.5 h-3.5 text-emerald-500" />;
      case 'SCREENSHOT':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">All Verification Submissions</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Complete index of text claims, news article URLs, and screenshots submitted for AI verification.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>Total Records:</span>
            <span className="text-slate-900 font-mono text-sm">{submissions.length}</span>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search keyword, claim, user, or domain..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Classification */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Classifications</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="TRUSTED">TRUSTED</option>
              <option value="SUSPICIOUS">SUSPICIOUS</option>
              <option value="FAKE">FAKE</option>
            </select>
          </div>

          {/* Content Type */}
          <div>
            <select
              value={selectedFormat}
              onChange={(e) => {
                setSelectedFormat(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Formats</option>
              <option value="TEXT">Text Claims</option>
              <option value="ARTICLE_URL">Article URLs</option>
              <option value="SCREENSHOT">Screenshots</option>
            </select>
          </div>

          {/* Credibility Score Range */}
          <div>
            <select
              value={scoreRange}
              onChange={(e) => {
                setScoreRange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Scores</option>
              <option value="HIGH">High Score (80-100)</option>
              <option value="MED">Moderate Score (50-79)</option>
              <option value="LOW">Low Score (0-49)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Submission Content</th>
                  <th className="px-5 py-3.5">Submitted By</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Classification</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Source</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <TableSkeleton rows={7} columns={8} />
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileCheck className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-700">No submissions found</p>
            <p className="text-xs text-slate-400">Try broadening your search query or reset filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Submission Content</th>
                    <th className="px-5 py-3.5">Submitted By</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Classification</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Source</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginated.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Content Preview */}
                      <td className="px-5 py-4 max-w-xs sm:max-w-sm">
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
                        <div className="truncate max-w-[140px]">
                          <span className="font-semibold text-slate-800 block truncate">{sub.userName}</span>
                          <span className="text-[10px] text-slate-400 truncate block">{sub.userEmail}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-700">
                          {getFormatIcon(sub.contentType)}
                          <span>{sub.contentType.replace('_', ' ')}</span>
                        </div>
                      </td>

                      {/* Classification & Credibility Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {sub.result ? (
                          <div className="flex items-center gap-1.5">
                            <ConfidenceThresholdBadge
                              score={sub.result.score}
                              confidence={sub.result.confidence}
                              classification={sub.result.classification}
                              size="sm"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-400">Processing</span>
                        )}
                      </td>

                      {/* Confidence Score Gauge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {sub.result ? (
                          <ConfidenceScoreGauge
                            score={sub.result.score}
                            confidence={sub.result.confidence}
                            classification={sub.result.classification}
                            variant="compact"
                            size="sm"
                            showBadge={false}
                          />
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="truncate max-w-[130px]">
                          <span className="font-semibold text-slate-800 block truncate">
                            {sub.result?.source.name || 'Unspecified'}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block font-mono">
                            {sub.result?.source.domain || 'direct-text'}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(sub.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Link to={`/admin/submissions/${sub.id}`}>
                          <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                <strong className="text-slate-800">
                  {Math.min(currentPage * itemsPerPage, filtered.length)}
                </strong>{' '}
                of <strong className="text-slate-800">{filtered.length}</strong> submissions
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
