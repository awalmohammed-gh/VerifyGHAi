import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Plus, Trash2, Printer, Eye, Calendar, Globe, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SavedReport } from '../../types';
import { reportsService } from '../../services/reportsService';
import { ClassificationBadge } from '../../components/verification/ClassificationBadge';
import { ConfidenceScoreGauge, ConfidenceThresholdBadge } from '../../components/verification/ConfidenceScoreGauge';
import { SourceFolderBadge } from '../../components/common/SourceFolderBadge';
import { Button } from '../../components/common/Button';
import { ReportsPageSkeleton } from '../../components/common/Skeleton';

export const ReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('ALL');

  const loadReports = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const data = await reportsService.getReports(currentUser.id);
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentUser]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await reportsService.deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.info('Report Removed', 'The saved report was removed from your archive.');
    } catch (err) {
      toast.error('Delete Failed', 'Could not delete report.');
    }
  };

  const handlePrint = (report: SavedReport, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/reports/${report.id}`);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contentPreview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.sourceDomain && r.sourceDomain.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass = filterClass === 'ALL' || r.classification === filterClass;
    return matchesSearch && matchesClass;
  });

  if (isLoading) {
    return <ReportsPageSkeleton />;
  }

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">My Reports</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Access, print, or export your saved credibility assessments.
          </p>
        </div>

        <Link to="/verify">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Verify Content
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      {reports.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search saved reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE'].map((cls) => (
              <button
                key={cls}
                onClick={() => setFilterClass(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterClass === cls
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {reports.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
            <Bookmark className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">No saved reports yet.</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              When reviewing a verification assessment, click "Save Report" to bookmark it for future reference or printing.
            </p>
          </div>
          <Link to="/verify" className="inline-block pt-2">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Verify Content
            </Button>
          </Link>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          No reports match your search criteria.
        </div>
      ) : (
        /* Reports Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => navigate(`/reports/${report.id}`)}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <ClassificationBadge classification={report.classification} size="sm" />
                    <ConfidenceThresholdBadge
                      score={report.score}
                      classification={report.classification}
                      size="xs"
                    />
                    <SourceFolderBadge domain={report.sourceDomain} size="xs" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {report.score}/100
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{report.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  "{report.contentPreview}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(report.savedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {report.sourceDomain && (
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {report.sourceDomain}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => handlePrint(report, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Print report"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(report.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link to={`/reports/${report.id}`}>
                    <Button variant="outline" size="sm" rightIcon={<Eye className="w-3.5 h-3.5" />}>
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
