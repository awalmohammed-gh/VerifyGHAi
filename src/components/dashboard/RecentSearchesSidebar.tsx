import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Trash2,
  History,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { recentSearchesService, RecentSearchQuery } from '../../services/recentSearchesService';
import { verificationService } from '../../services/verificationService';
import { Submission } from '../../types';
import { formatTimeAgo } from '../../utils/timeAgo';

export interface RecentSearchesSidebarProps {
  onItemClick?: () => void;
  maxItems?: number;
  className?: string;
  showCardWrapper?: boolean;
}

export const RecentSearchesSidebar: React.FC<RecentSearchesSidebarProps> = ({
  onItemClick,
  maxItems = 4,
  className = '',
  showCardWrapper = false,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [recentQueries, setRecentQueries] = useState<RecentSearchQuery[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const searches = recentSearchesService.getRecentSearches(currentUser?.id, maxItems);
      setRecentQueries(searches);

      const submissions = await verificationService.getUserSubmissions(currentUser?.id);
      setRecentSubmissions(submissions.slice(0, maxItems));
    } catch (err) {
      console.warn('[RecentSearchesSidebar] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, maxItems]);

  const handleClearSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    recentSearchesService.clearRecentSearches(currentUser?.id);
    setRecentQueries([]);
  };

  const handleRemoveSearch = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = recentSearchesService.removeSearchQuery(id, currentUser?.id);
    setRecentQueries(updated.slice(0, maxItems));
  };

  const handleSearchClick = (item: RecentSearchQuery) => {
    if (onItemClick) onItemClick();
    if (item.targetResultId) {
      navigate(`/verify/result/${item.targetResultId}`);
    } else {
      navigate('/verify', {
        state: {
          prefilledText: item.query,
          initialType: item.query.startsWith('http') ? 'ARTICLE_URL' : 'TEXT',
        },
      });
    }
  };

  const handleSubmissionClick = (sub: Submission) => {
    if (onItemClick) onItemClick();
    const targetId = sub.id || (sub as any)._id || sub.result?.id;
    navigate(`/dashboard/verify/result?id=${targetId}`);
  };

  const getStatusDot = (classification?: string) => {
    switch (classification?.toUpperCase()) {
      case 'VERIFIED':
        return <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Verified" />;
      case 'TRUSTED':
        return <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" title="Trusted" />;
      case 'SUSPICIOUS':
        return <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Suspicious" />;
      case 'FAKE':
        return <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" title="Fake" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" title="Record" />;
    }
  };

  // Render combined or prioritised items
  const hasItems = recentQueries.length > 0 || recentSubmissions.length > 0;

  const content = (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-400" /> Recent Verifications
        </span>
        {recentQueries.length > 0 && (
          <button
            type="button"
            onClick={handleClearSearches}
            className="text-[10px] font-bold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="Clear recent searches"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-1.5 px-1 py-2">
          <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded animate-pulse w-4/5" />
          <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded animate-pulse w-3/5" />
        </div>
      ) : !hasItems ? (
        <div className="px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            No previous verifications yet.
          </p>
          <button
            type="button"
            onClick={() => {
              if (onItemClick) onItemClick();
              navigate('/verify');
            }}
            className="mt-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Verify a claim now
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Submissions list */}
          {recentSubmissions.slice(0, maxItems).map((sub) => {
            const classification = sub.result?.classification || 'TRUSTED';
            const timeAgo = formatTimeAgo(sub.createdAt);
            const title = sub.url || sub.fullContent || 'Verification Query';

            return (
              <div
                key={sub.id}
                onClick={() => handleSubmissionClick(sub)}
                className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl hover:bg-blue-50/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getStatusDot(classification)}
                  <span className="truncate font-semibold text-[11px] block">{title}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {sub.result?.score ? `${sub.result.score}%` : ''}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}

          {/* Quick link to view all */}
          <div className="pt-1 px-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (onItemClick) onItemClick();
                navigate('/history');
              }}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <History className="w-3 h-3" /> View full history
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (showCardWrapper) {
    return (
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {content}
      </div>
    );
  }

  return content;
};
