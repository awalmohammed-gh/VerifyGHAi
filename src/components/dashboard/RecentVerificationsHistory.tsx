import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  Search,
  ExternalLink,
  RotateCcw,
  Copy,
  Check,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Filter,
  Eye,
} from 'lucide-react';
import { Submission, ContentType } from '../../types';
import { ClassificationBadge } from '../verification/ClassificationBadge';
import { SourceFolderBadge } from '../common/SourceFolderBadge';
import { ConfidenceScoreGauge, ConfidenceThresholdBadge } from '../verification/ConfidenceScoreGauge';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';


export interface RecentVerificationsHistoryProps {
  submissions: Submission[];
  maxDisplay?: number;
  className?: string;
}

export const RecentVerificationsHistory: React.FC<RecentVerificationsHistoryProps> = ({
  submissions,
  maxDisplay = 6,
  className = '',
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'ALL' | ContentType>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to Clipboard', 'Analyzed content snippet copied.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReverify = (sub: Submission) => {
    // Navigate to /verify with initial content state if applicable
    if (sub.contentType === 'ARTICLE_URL' && sub.url) {
      navigate('/verify', { state: { initialTab: 'url', initialUrl: sub.url } });
    } else {
      navigate('/verify', { state: { initialTab: 'text', initialText: sub.fullContent } });
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesType =
      activeTypeFilter === 'ALL' || sub.contentType === activeTypeFilter;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesType;

    const matchesSearch =
      sub.fullContent.toLowerCase().includes(query) ||
      (sub.url && sub.url.toLowerCase().includes(query)) ||
      (sub.result?.source?.name && sub.result.source.name.toLowerCase().includes(query)) ||
      (sub.result?.source?.domain && sub.result.source.domain.toLowerCase().includes(query)) ||
      (sub.result?.summary && sub.result.summary.toLowerCase().includes(query));

    return matchesType && matchesSearch;
  });

  const displayedSubmissions = filteredSubmissions.slice(0, maxDisplay);

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'ARTICLE_URL':
        return <Globe className="w-4 h-4 text-blue-600" />;
      case 'TEXT':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'SCREENSHOT':
        return <ImageIcon className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeLabel = (type: ContentType) => {
    switch (type) {
      case 'ARTICLE_URL':
        return 'Web Article / URL';
      case 'TEXT':
        return 'Text / Claim Forward';
      case 'SCREENSHOT':
        return 'Screenshot Image';
      default:
        return type;
    }
  };

  const getScoreColor = (score?: number, classification?: string) => {
    if (classification === 'VERIFIED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (classification === 'TRUSTED') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (classification === 'SUSPICIOUS') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (classification === 'FAKE') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className={`w-full rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xs space-y-6 text-left ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Recent Verifications
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
              {submissions.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse and quickly revisit previously analyzed web URLs, WhatsApp forwards, and text claims.
          </p>
        </div>

        <Link to="/history" className="self-start md:self-auto">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            View Full History
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/70 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTypeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/90'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Items ({submissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('ARTICLE_URL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTypeFilter === 'ARTICLE_URL'
                ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/90'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            URLs ({submissions.filter((s) => s.contentType === 'ARTICLE_URL').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('TEXT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTypeFilter === 'TEXT'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/90'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Texts ({submissions.filter((s) => s.contentType === 'TEXT').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('SCREENSHOT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTypeFilter === 'SCREENSHOT'
                ? 'bg-white text-purple-700 shadow-2xs border border-slate-200/90'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Screenshots ({submissions.filter((s) => s.contentType === 'SCREENSHOT').length})
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter analyzed URLs or text..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Submissions List */}
      {displayedSubmissions.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
          <p className="text-xs font-medium text-slate-500">
            {searchQuery
              ? `No verifications found matching "${searchQuery}".`
              : 'No verifications found in this category.'}
          </p>
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
            >
              Clear Search Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedSubmissions.map((sub) => {
            const res = sub.result;
            const formattedDate = new Date(sub.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = new Date(sub.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const isUrl = sub.contentType === 'ARTICLE_URL' && !!sub.url;

            return (
              <div
                key={sub.id}
                className="group relative rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all duration-150 p-4 sm:p-5 flex flex-col gap-3"
              >
                {/* Header row: Type badge, Date/Time, Score & Classification */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                      {getTypeIcon(sub.contentType)}
                      <span>{getTypeLabel(sub.contentType)}</span>
                    </span>

                    <SourceFolderBadge
                      url={sub.url}
                      domain={res?.source?.domain}
                      sourceName={res?.source?.name}
                      contentType={sub.contentType}
                      fullContent={sub.fullContent}
                      size="xs"
                    />

                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {formattedDate} • {formattedTime}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {res && (
                      <>
                        <ConfidenceScoreGauge
                          score={res.score}
                          confidence={res.confidence}
                          classification={res.classification}
                          variant="compact"
                          size="sm"
                          showBadge={false}
                        />
                        <ConfidenceThresholdBadge
                          score={res.score}
                          confidence={res.confidence}
                          classification={res.classification}
                          size="sm"
                          showIcon={true}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Content Details: URL or Text representation */}
                <div className="space-y-1.5">
                  {isUrl ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-blue-700 bg-blue-50/70 px-3 py-1.5 rounded-xl border border-blue-100 break-all max-w-full overflow-hidden">
                        <Globe className="w-3.5 h-3.5 flex-shrink-0 text-blue-600" />
                        <span className="truncate">{sub.url}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-relaxed">
                        {sub.fullContent}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
                      <p className="text-xs sm:text-sm font-medium text-slate-800 line-clamp-2 leading-relaxed italic">
                        "{sub.fullContent}"
                      </p>
                    </div>
                  )}

                  {/* Summary / Source Metadata if available */}
                  {res?.summary && (
                    <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                      <strong className="text-slate-700 font-semibold">Key Finding:</strong> {res.summary}
                    </p>
                  )}
                </div>

                {/* Footer Controls & Quick Links */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {res?.source?.name || 'Indexed Source'}
                    </span>
                    {res?.source?.domain && (
                      <span className="text-[11px] font-mono text-slate-400">({res.source.domain})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyContent(isUrl && sub.url ? sub.url : sub.fullContent, sub.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-[11px] font-bold cursor-pointer"
                      title="Copy content snippet"
                    >
                      {copiedId === sub.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Re-verify Button */}
                    <button
                      type="button"
                      onClick={() => handleReverify(sub)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-[11px] font-bold cursor-pointer"
                      title="Re-verify or update analysis"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>Re-analyze</span>
                    </button>

                    {/* View Report Link */}
                    <Link to={`/dashboard/verify/result?id=${sub.id || (sub as any)._id || sub.result?.id}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                        className="py-1 px-3 text-xs font-bold"
                      >
                        View &gt;
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link to view full archive if multiple submissions */}
      {submissions.length > maxDisplay && (
        <div className="pt-2 text-center">
          <Link to="/history">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View all {submissions.length} verifications in History Archive
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
