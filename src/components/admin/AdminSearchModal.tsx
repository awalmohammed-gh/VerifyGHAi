import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, FileText, Globe, Database, Loader2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { User as UserType, Submission, Source, FactCheck } from '../../types';
import { ClassificationBadge } from '../verification/ClassificationBadge';
import { ConfidenceScoreGauge, ConfidenceThresholdBadge } from '../verification/ConfidenceScoreGauge';


interface AdminSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSearchModal: React.FC<AdminSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [factChecks, setFactChecks] = useState<FactCheck[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setUsers([]);
      setSubmissions([]);
      setSources([]);
      setFactChecks([]);
      return;
    }
  }, [isOpen]);

  // Debounced dynamic search against real admin endpoints
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setUsers([]);
      setSubmissions([]);
      setSources([]);
      setFactChecks([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [u, sub, src, fc] = await Promise.all([
          adminService.getUsers({ search: trimmed, limit: 4 }),
          adminService.getSubmissions({ search: trimmed, limit: 4 }),
          adminService.getSources({ search: trimmed, limit: 4 }),
          adminService.getFactChecks({ search: trimmed, limit: 4 }),
        ]);
        setUsers(u);
        setSubmissions(sub);
        setSources(src);
        setFactChecks(fc);
      } catch (err) {
        console.warn('[AdminSearchModal] Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = users.length + submissions.length + sources.length + factChecks.length;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/50">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search across users, submissions, sources, and fact-checks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-hidden font-medium"
          />
          {isSearching && <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />}
          {query && !isSearching && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="p-4 overflow-y-auto flex-1 space-y-5 text-left text-xs">
          {!query.trim() ? (
            <div className="py-8 text-center space-y-2 text-slate-400 dark:text-slate-500">
              <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Global Admin Entity Search</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                Type domain names, keywords, claims, user emails, or IDs to jump directly to administrative records.
              </p>
            </div>
          ) : !isSearching && totalResults === 0 ? (
            <div className="py-8 text-center space-y-1 text-slate-500 dark:text-slate-400">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No records found for "{query}"</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Try searching with a different domain, keyword, or user name.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sources */}
              {sources.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500 px-2">
                    <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Source Credibility Records ({sources.length})</span>
                  </div>
                  <div className="space-y-1">
                    {sources.map((src) => (
                      <button
                        key={src.id}
                        onClick={() => handleSelect(`/admin/sources/${src.id}`)}
                        className="w-full p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 flex items-center justify-between text-left transition-colors cursor-pointer gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{src.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                            {src.domain}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <ConfidenceScoreGauge
                            score={src.credibilityScore}
                            variant="compact"
                            size="sm"
                            showBadge={true}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submissions */}
              {submissions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500 px-2">
                    <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>Submissions ({submissions.length})</span>
                  </div>
                  <div className="space-y-1">
                    {submissions.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSelect(`/admin/submissions/${sub.id}`)}
                        className="w-full p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 flex items-center justify-between text-left transition-colors cursor-pointer gap-2"
                      >
                        <div className="truncate max-w-xs sm:max-w-md pr-2 min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">"{sub.contentPreview}"</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            By {sub.userName} • {sub.contentType.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {sub.result ? (
                            <ConfidenceScoreGauge
                              score={sub.result.score}
                              confidence={sub.result.confidence}
                              classification={sub.result.classification}
                              variant="compact"
                              size="sm"
                              showBadge={true}
                            />
                          ) : (
                            <span className="text-slate-400 text-xs">Pending</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fact Checks */}
              {factChecks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500 px-2">
                    <Database className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>Fact Checks ({factChecks.length})</span>
                  </div>
                  <div className="space-y-1">
                    {factChecks.map((fc) => {
                      const v = (fc.verdict || '').toUpperCase();
                      const fcScore = v.includes('TRUE') || v.includes('VERIFIED') || v.includes('ACCURATE')
                        ? 90
                        : v.includes('FALSE') || v.includes('FAKE') || v.includes('UNTRUE') || v.includes('DEBUNKED')
                        ? 15
                        : 55;
                      const fcClass = fcScore >= 70 ? 'VERIFIED' : fcScore <= 35 ? 'FAKE' : 'SUSPICIOUS';

                      return (
                        <button
                          key={fc.id}
                          onClick={() => handleSelect(`/admin/fact-checks/${fc.id}`)}
                          className="w-full p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 flex items-center justify-between text-left transition-colors cursor-pointer gap-2"
                        >
                          <div className="truncate max-w-xs sm:max-w-md pr-2 min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">{fc.claim}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{fc.source}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <ConfidenceThresholdBadge
                              score={fcScore}
                              classification={fcClass}
                              size="xs"
                              customLabel={fc.verdict}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Users */}
              {users.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500 px-2">
                    <User className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Users ({users.length})</span>
                  </div>
                  <div className="space-y-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelect(`/admin/users/${u.id}`)}
                        className="w-full p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {u.email} • Role: {u.role}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {u.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Navigate with mouse or click</span>
          <span className="font-mono">Quick Search: Cmd+K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
};
