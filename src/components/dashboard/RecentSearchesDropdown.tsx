import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Clock,
  X,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  Sparkles,
  Globe,
  FileText,
  Image as ImageIcon,
  Trash2,
  ChevronRight,
  Command,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { recentSearchesService, RecentSearchQuery } from '../../services/recentSearchesService';
import { verificationService } from '../../services/verificationService';
import { Submission, Classification } from '../../types';
import { formatTimeAgo } from '../../utils/timeAgo';

export interface RecentSearchesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
  className?: string;
}

export const RecentSearchesDropdown: React.FC<RecentSearchesDropdownProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [queryText, setQueryText] = useState('');
  const [recentQueries, setRecentQueries] = useState<RecentSearchQuery[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Load recent searches and verifications when opening
  useEffect(() => {
    if (isOpen) {
      const searches = recentSearchesService.getRecentSearches(currentUser?.id, 8);
      setRecentQueries(searches);

      setIsLoadingSubmissions(true);
      verificationService
        .getUserSubmissions(currentUser?.id)
        .then((data) => {
          setSubmissions(data.slice(0, 10));
        })
        .catch((err) => {
          console.warn('[RecentSearchesDropdown] Failed to fetch submissions:', err);
        })
        .finally(() => {
          setIsLoadingSubmissions(false);
        });

      // Focus search input on open
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQueryText('');
    }
  }, [isOpen, currentUser]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filtered submissions based on live input
  const filteredSubmissions = useMemo(() => {
    if (!queryText.trim()) return submissions;
    const q = queryText.toLowerCase().trim();
    return submissions.filter((sub) => {
      const contentMatch = sub.fullContent?.toLowerCase().includes(q);
      const urlMatch = sub.url?.toLowerCase().includes(q);
      const domainMatch = sub.result?.source?.domain?.toLowerCase().includes(q);
      const nameMatch = sub.result?.source?.name?.toLowerCase().includes(q);
      const classMatch = sub.result?.classification?.toLowerCase().includes(q);
      const claimMatch = sub.result?.claims?.some((c) => c.text.toLowerCase().includes(q));
      return contentMatch || urlMatch || domainMatch || nameMatch || classMatch || claimMatch;
    });
  }, [submissions, queryText]);

  // Handle clicking a recent search query tag
  const handleQueryClick = (searchItem: RecentSearchQuery) => {
    if (searchItem.targetResultId) {
      onClose();
      navigate(`/verify/result/${searchItem.targetResultId}`);
    } else {
      setQueryText(searchItem.query);
      inputRef.current?.focus();
    }
  };

  // Handle removing a single search term
  const handleRemoveSearch = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = recentSearchesService.removeSearchQuery(id, currentUser?.id);
    setRecentQueries(updated);
  };

  // Handle clear all recent searches
  const handleClearAllSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    recentSearchesService.clearRecentSearches(currentUser?.id);
    setRecentQueries([]);
  };

  // Handle clicking a submission record
  const handleSelectSubmission = (sub: Submission) => {
    // Record query in recent searches
    const querySummary = sub.url || sub.fullContent.slice(0, 60);
    recentSearchesService.addSearchQuery(querySummary, {
      userId: currentUser?.id,
      targetResultId: sub.result?.id || sub.id,
      classification: sub.result?.classification,
      score: sub.result?.score,
      type: 'verification',
    });

    onClose();
    const targetId = sub.id || (sub as any)._id || sub.result?.id;
    navigate(`/dashboard/verify/result?id=${targetId}`);
  };

  // Handle submitting a new search/verification query
  const handleExecuteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = queryText.trim();
    if (!trimmed) return;

    recentSearchesService.addSearchQuery(trimmed, {
      userId: currentUser?.id,
      type: 'search',
    });

    onClose();
    // Navigate to verify page with prefilled text or search in history
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      navigate('/verify', {
        state: { prefilledText: trimmed, initialType: 'ARTICLE_URL' },
      });
    } else {
      navigate('/verify', {
        state: { prefilledText: trimmed, initialType: 'TEXT' },
      });
    }
  };

  // Helper for status badge
  const renderVerdictBadge = (classification?: Classification | string) => {
    const cls = classification?.toUpperCase();
    switch (cls) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
            <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED
          </span>
        );
      case 'TRUSTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
            <ShieldCheck className="w-2.5 h-2.5" /> TRUSTED
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
            <AlertTriangle className="w-2.5 h-2.5" /> SUSPICIOUS
          </span>
        );
      case 'FAKE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
            <XCircle className="w-2.5 h-2.5" /> FAKE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            RECORD
          </span>
        );
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'ARTICLE_URL':
      case 'URL':
        return <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'SCREENSHOT':
      case 'IMAGE':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] ${className}`}
        >
          {/* Header & Search Form */}
          <form
            onSubmit={handleExecuteSearch}
            className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-900/90"
          >
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search previous verification results, claims, or URLs..."
              className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
            {queryText && (
              <button
                type="button"
                onClick={() => setQueryText('')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                aria-label="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              aria-label="Close dialog"
            >
              <span className="hidden sm:inline">ESC</span>
              <X className="w-3.5 h-3.5 sm:hidden" />
            </button>
          </form>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {/* Recent Search Queries / Tags */}
            {recentQueries.length > 0 && !queryText && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Recent Searches & Queries
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllSearches}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear History
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-0.5">
                  {recentQueries.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleQueryClick(item)}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100/90 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer shadow-2xs max-w-full truncate"
                    >
                      <Clock className="w-3 h-3 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                      <span className="truncate max-w-[220px]">{item.query}</span>
                      {item.score !== undefined && (
                        <span className="text-[10px] font-mono font-bold px-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          {item.score}%
                        </span>
                      )}
                      <span
                        onClick={(e) => handleRemoveSearch(e, item.id)}
                        className="opacity-40 group-hover:opacity-100 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded-sm transition-opacity"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Verification Results List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  {queryText
                    ? `Matching Results (${filteredSubmissions.length})`
                    : 'Previous Verification Results'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Click to revisit report
                </span>
              </div>

              {isLoadingSubmissions ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Loading your verification history...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {queryText
                      ? `No verification results match "${queryText}"`
                      : 'No previous verifications found in your records.'}
                  </p>
                  {queryText && (
                    <button
                      type="button"
                      onClick={handleExecuteSearch}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Run new verification on this claim
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                  {filteredSubmissions.map((sub) => {
                    const res = sub.result;
                    const classification = res?.classification || 'TRUSTED';
                    const score = res?.score ?? 75;
                    const timeString = formatTimeAgo(sub.createdAt);

                    return (
                      <div
                        key={sub.id}
                        onClick={() => handleSelectSubmission(sub)}
                        className="p-3 sm:p-3.5 hover:bg-blue-50/50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {getTypeIcon(sub.contentType)}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {renderVerdictBadge(classification)}
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Score: <span className="font-mono">{score}</span>/100
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                • {timeString}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {sub.fullContent || sub.url || 'Verification Submission Record'}
                            </p>
                            {sub.url && (
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1 font-mono">
                                <Globe className="w-3 h-3 flex-shrink-0" />
                                {sub.url}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-bold text-xs">
                          <span className="hidden sm:inline">View Dossier</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/history');
              }}
              className="font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" /> View Complete History
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/verify');
              }}
              className="font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> New Verification
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
