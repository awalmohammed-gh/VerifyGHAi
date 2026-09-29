import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Database, CheckCircle2, X } from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isUpdateAvailable, updateApp, cachedScansCount, isCached } = useOffline();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setIsDismissed(false);
    } else if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <>
      <AnimatePresence>
        {/* Offline Banner */}
        {!isOnline && !isDismissed && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="sticky top-0 z-50 w-full bg-amber-500/95 dark:bg-amber-600/95 text-slate-950 backdrop-blur-md border-b border-amber-600/30 px-4 py-2.5 shadow-md"
          >
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-900"></span>
                </span>
                <WifiOff className="w-4 h-4 text-slate-900 shrink-0" />
                <span>
                  <strong>Offline Mode Active:</strong> You are currently viewing cached data.
                  {cachedScansCount > 0 && (
                    <span className="ml-1 opacity-90 hidden sm:inline">
                      ({cachedScansCount} recent scan{cachedScansCount === 1 ? '' : 's'} stored offline)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-2.5 py-1 bg-slate-950 text-white hover:bg-slate-900 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Database className="w-3.5 h-3.5" />
                  View Cached Scans
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="p-1 hover:bg-amber-600/30 rounded-md text-slate-900 transition-colors"
                  aria-label="Dismiss offline banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Back Online Toast */}
        {showReconnected && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="sticky top-0 z-50 w-full bg-emerald-600 text-white backdrop-blur-md border-b border-emerald-700 px-4 py-2 shadow-md"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold">
              <Wifi className="w-4 h-4" />
              <span>Back Online. Connection restored & caches synchronized.</span>
              <CheckCircle2 className="w-4 h-4 ml-1 text-emerald-200" />
            </div>
          </motion.div>
        )}

        {/* New Version Ready Prompt */}
        {isUpdateAvailable && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-700 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                <RefreshCw className="w-5 h-5 animate-spin duration-1000" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">App Update Available</p>
                <p className="text-2xs text-slate-400">A new version is ready to be loaded.</p>
              </div>
            </div>
            <button
              onClick={updateApp}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Update
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
