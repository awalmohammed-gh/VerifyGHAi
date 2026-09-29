import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Calendar, Globe, ArrowRight, Folder, Share2 } from 'lucide-react';
import { Submission, VerificationResult } from '../../types';
import { ClassificationBadge } from '../verification/ClassificationBadge';
import { SourceFolderBadge } from '../common/SourceFolderBadge';
import { ConfidenceScoreGauge, ConfidenceThresholdBadge } from '../verification/ConfidenceScoreGauge';
import { ShareFindingsModal } from '../verification/ShareFindingsModal';
import { Button } from '../common/Button';

export interface RecentVerificationTableProps {
  submissions: Submission[];
  showUserCol?: boolean;
  adminView?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const RecentVerificationTable: React.FC<RecentVerificationTableProps> = ({
  submissions,
  showUserCol = false,
  adminView = false,
  emptyMessage = 'No verifications found.',
  className = '',
}) => {
  const [sharingResult, setSharingResult] = useState<VerificationResult | null>(null);

  if (submissions.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
            <tr>
              {showUserCol && <th className="px-4 py-3">User</th>}
              <th className="px-4 py-3">Content Preview</th>
              <th className="px-4 py-3">Source / Domain</th>
              <th className="px-4 py-3">Category Folder</th>
              <th className="px-4 py-3 text-center">Confidence Gauge</th>
              <th className="px-4 py-3">Credibility Badge</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {submissions.map((sub) => {
              const res = sub.result;
              const formattedDate = new Date(sub.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                  {showUserCol && (
                    <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      {sub.userName}
                    </td>
                  )}

                  <td className="px-4 py-3.5 max-w-xs">
                    <p className="font-semibold text-slate-900 truncate">
                      {sub.fullContent.slice(0, 70)}...
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">
                      {sub.contentType.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[140px]">{res?.source.name || 'Direct Input'}</span>
                    </div>
                    {res?.source.domain && (
                      <span className="text-[10px] text-slate-400 font-mono block pl-5">
                        {res.source.domain}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <SourceFolderBadge
                      url={sub.url}
                      domain={res?.source.domain}
                      sourceName={res?.source.name}
                      contentType={sub.contentType}
                      fullContent={sub.fullContent}
                      size="xs"
                    />
                  </td>

                  {/* Confidence Score Gauge (Radial & Score) */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {res ? (
                      <ConfidenceScoreGauge
                        score={res.score}
                        confidence={res.confidence}
                        classification={res.classification}
                        variant="compact"
                        size="sm"
                        showBadge={false}
                        className="justify-center"
                      />
                    ) : (
                      <span className="text-slate-400 font-mono">—</span>
                    )}
                  </td>

                  {/* Dynamic Threshold Badge (Green for High Credibility, Yellow for Caution, Red for Misinformation) */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {res ? (
                      <div className="flex items-center gap-1.5">
                        <ConfidenceThresholdBadge
                          score={res.score}
                          confidence={res.confidence}
                          classification={res.classification}
                          size="sm"
                          showIcon={true}
                        />
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">Processing</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                    {formattedDate}
                  </td>

                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {res && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSharingResult(res)}
                          leftIcon={<Share2 className="w-3 h-3 text-slate-400 hover:text-blue-600" />}
                          title="Share Findings"
                        >
                          <span className="sr-only sm:not-sr-only text-[11px]">Share</span>
                        </Button>
                      )}
                      <Link
                        to={
                          adminView
                            ? `/admin/submissions/${sub.id || (sub as any)._id || sub.result?.id}`
                            : `/dashboard/verify/result?id=${sub.id || (sub as any)._id || sub.result?.id}`
                        }
                      >
                        <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                          {adminView ? 'Inspect' : 'View >'}
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List Transformation */}
      <div className="sm:hidden space-y-3">
        {submissions.map((sub) => {
          const res = sub.result;
          const formattedDate = new Date(sub.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          return (
            <div
              key={sub.id}
              className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
                {res && (
                  <ConfidenceThresholdBadge
                    score={res.score}
                    confidence={res.confidence}
                    classification={res.classification}
                    size="xs"
                    showIcon={true}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <SourceFolderBadge
                  url={sub.url}
                  domain={res?.source.domain}
                  sourceName={res?.source.name}
                  contentType={sub.contentType}
                  fullContent={sub.fullContent}
                  size="xs"
                />
              </div>

              <p className="text-xs font-semibold text-slate-900 leading-snug">
                "{sub.fullContent.slice(0, 90)}..."
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium truncate max-w-[140px]">
                  {res?.source.name || 'Unknown source'}
                </span>
                {res && (
                  <ConfidenceScoreGauge
                    score={res.score}
                    confidence={res.confidence}
                    classification={res.classification}
                    variant="compact"
                    size="xs"
                    showBadge={false}
                  />
                )}
              </div>

              <div className="pt-1 flex items-center gap-2">
                {res && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSharingResult(res)}
                    leftIcon={<Share2 className="w-3.5 h-3.5 text-blue-600" />}
                    className="flex-shrink-0"
                  >
                    Share
                  </Button>
                )}
                <Link
                  to={
                    adminView
                      ? `/admin/submissions/${sub.id || (sub as any)._id || sub.result?.id}`
                      : `/dashboard/verify/result?id=${sub.id || (sub as any)._id || sub.result?.id}`
                  }
                  className="w-full block"
                >
                  <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3 h-3" />}>
                    {adminView ? 'Inspect Forensic Details' : 'View >'}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal */}
      {sharingResult && (
        <ShareFindingsModal
          isOpen={Boolean(sharingResult)}
          onClose={() => setSharingResult(null)}
          result={sharingResult}
        />
      )}
    </div>
  );
};

