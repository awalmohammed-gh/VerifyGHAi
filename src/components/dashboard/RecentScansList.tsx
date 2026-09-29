import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  RotateCcw,
  ExternalLink,
  Trash2,
  Share2,
  FileText,
  Globe,
  Image as ImageIcon,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Info,
  ArrowRight,
  Plus,
  Sparkles,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useOffline } from '../../context/OfflineContext';
import { recentScansService, RecentScanItem } from '../../services/recentScansService';
import { ShareResults } from '../verification/ShareResults';
import { Button } from '../common/Button';
import { WifiOff, Database } from 'lucide-react';

export interface RecentScansListProps {
  className?: string;
  maxDisplay?: number;
  onSelectScan?: (scan: RecentScanItem) => void;
  showCardWrapper?: boolean;
}

export const RecentScansList: React.FC<RecentScansListProps> = ({
  className = '',
  maxDisplay = 5,
  onSelectScan,
  showCardWrapper = true,
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOffline();
  const navigate = useNavigate();

  const [scans, setScans] = useState<RecentScanItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadScans = () => {
    setIsLoading(true);
    try {
      const items = recentScansService.getRecentScans(currentUser?.id, maxDisplay);
      setScans(items);
    } catch (e) {
      console.warn('[RecentScansList] Error loading scans:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
    const unsubscribe = recentScansService.onScansUpdated(() => {
      loadScans();
    });
    return unsubscribe;
  }, [currentUser?.id, maxDisplay]);

  const handleRemoveItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = recentScansService.removeRecentScan(id, currentUser?.id);
    setScans(updated.slice(0, maxDisplay));
    toast.info('Scan Removed', 'Item removed from your local recent scans list.');
  };

  const handleClearAll = () => {
    recentScansService.clearRecentScans(currentUser?.id);
    setScans([]);
    toast.info('Recent Scans Cleared', 'Local recent verification history has been cleared.');
  };

  const handleReScan = (e: React.MouseEvent, item: RecentScanItem) => {
    e.stopPropagation();
    navigate('/verify', {
      state: {
        prefilledText: item.contentSnippet,
        initialType: item.type,
      },
    });
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification?.toUpperCase()) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </span>
        );
      case 'TRUSTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-3 h-3" /> Trusted
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3" /> Suspicious
          </span>
        );
      case 'FAKE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3" /> Fake
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Info className="w-3 h-3" /> Unverified
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
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

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recently';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Scans
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Last {scans.length} requests
            </span>
            {!isOnline ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                <WifiOff className="w-3 h-3" /> Offline Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hidden sm:inline-flex">
                <Database className="w-3 h-3" /> Cached Locally
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quick-access history of your last content verifications, locally saved for instant re-access.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {scans.length > 0 && (
            <button
              id="clear-recent-scans-btn"
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Clear stored recent scans"
            >
              Clear
            </button>
          )}

          <Link to="/verify">
            <Button
              id="new-scan-cta-btn"
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
            >
              New Scan
            </Button>
          </Link>
        </div>
      </div>

      {/* Scans List Items */}
      {scans.length > 0 ? (
        <div className="space-y-2.5">
          {scans.map((scan, idx) => (
            <div
              key={scan.id || idx}
              id={`recent-scan-item-${idx + 1}`}
              onClick={() => {
                if (onSelectScan) {
                  onSelectScan(scan);
                } else {
                  navigate(`/verify/result/${scan.id}`);
                }
              }}
              className="group p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-blue-300 dark:hover:border-blue-700/60 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Left Info */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-600/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getTypeIcon(scan.type)}
                </div>

                <div className="min-w-0 space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {scan.title || scan.contentSnippet}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                      {scan.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                    "{scan.contentSnippet}"
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatRelativeTime(scan.scannedAt)}
                    </span>
                    <span>•</span>
                    <span>
                      Score: <strong className="text-slate-700 dark:text-slate-200 font-bold">{scan.score}/100</strong>
                    </span>
                    {scan.sourceName && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[150px]">{scan.sourceName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Verdict & Actions */}
              <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
                {getClassificationBadge(scan.classification)}

                {/* Quick Share Web API */}
                <ShareResults
                  result={{
                    id: scan.id,
                    classification: scan.classification,
                    score: scan.score,
                    confidence: scan.confidence,
                    inputContent: scan.contentSnippet,
                  }}
                  variant="icon"
                />

                {/* Re-Scan Button */}
                <button
                  type="button"
                  onClick={(e) => handleReScan(e, scan)}
                  className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                  title="Re-verify or modify this query"
                  aria-label="Re-verify scan"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Open Dossier */}
                <Link
                  to={`/verify/result/${scan.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <span>Dossier</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>

                {/* Remove item */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveItem(e, scan.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                  title="Remove from recent scans"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No recent scans recorded
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your latest 5 verification requests will appear here automatically for one-click re-access and sharing.
            </p>
          </div>
          <Link to="/verify">
            <Button variant="primary" size="sm" className="font-bold text-xs mt-2">
              Start Verification Scan
            </Button>
          </Link>
        </div>
      )}
    </div>
  );

  if (!showCardWrapper) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div
      id="dashboard-recent-scans-card"
      className={`rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xs text-left ${className}`}
    >
      {content}
    </div>
  );
};
