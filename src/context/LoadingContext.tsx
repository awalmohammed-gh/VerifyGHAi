import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  Loader2,
  ShieldCheck,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  Minimize2,
  Maximize2,
  FileCheck2,
  Globe,
  Radio,
} from 'lucide-react';

export type LoadingTaskType =
  | 'VERIFICATION'
  | 'AI_GENERATION'
  | 'SEARCH'
  | 'EXPORT'
  | 'AUDIT'
  | 'GENERAL';

export interface LoadingTask {
  id: string;
  title: string;
  message?: string;
  type: LoadingTaskType;
  progress?: number; // 0 to 100
  step?: string;
  blocking?: boolean;
  cancelable?: boolean;
  onCancel?: () => void;
  startTime: number;
}

export type LoadingTaskInput =
  | string
  | {
      id?: string;
      title: string;
      message?: string;
      type?: LoadingTaskType;
      progress?: number;
      step?: string;
      blocking?: boolean;
      cancelable?: boolean;
      onCancel?: () => void;
    };

interface LoadingContextType {
  isLoading: boolean;
  activeTasks: LoadingTask[];
  primaryTask: LoadingTask | null;
  startLoading: (task: LoadingTaskInput) => string;
  updateLoading: (
    taskId: string,
    updates: Partial<Omit<LoadingTask, 'id' | 'startTime'>>
  ) => void;
  stopLoading: (taskId?: string) => void;
  withLoading: <T>(
    promise: Promise<T>,
    task: LoadingTaskInput
  ) => Promise<T>;
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<LoadingTask[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  const activeTasks = useMemo(() => tasks, [tasks]);
  const isLoading = activeTasks.length > 0;
  const primaryTask = activeTasks.length > 0 ? activeTasks[activeTasks.length - 1] : null;

  const stopLoading = useCallback((taskId?: string) => {
    setTasks((prev) => {
      if (!taskId) {
        return [];
      }
      return prev.filter((t) => t.id !== taskId);
    });
  }, []);

  const startLoading = useCallback(
    (input: LoadingTaskInput): string => {
      const id =
        typeof input === 'object' && input.id
          ? input.id
          : `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const newTask: LoadingTask =
        typeof input === 'string'
          ? {
              id,
              title: input,
              type: 'VERIFICATION',
              startTime: Date.now(),
            }
          : {
              id,
              title: input.title,
              message: input.message,
              type: input.type || 'VERIFICATION',
              progress: input.progress,
              step: input.step,
              blocking: input.blocking ?? false,
              cancelable: input.cancelable,
              onCancel: input.onCancel,
              startTime: Date.now(),
            };

      setTasks((prev) => [...prev.filter((t) => t.id !== id), newTask]);
      setIsMinimized(false);
      return id;
    },
    []
  );

  const updateLoading = useCallback(
    (taskId: string, updates: Partial<Omit<LoadingTask, 'id' | 'startTime'>>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
      );
    },
    []
  );

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>, taskInput: LoadingTaskInput): Promise<T> => {
      const taskId = startLoading(taskInput);
      try {
        const result = await promise;
        return result;
      } finally {
        stopLoading(taskId);
      }
    },
    [startLoading, stopLoading]
  );

  const setGlobalLoading = useCallback(
    (loading: boolean, message?: string) => {
      if (loading) {
        startLoading({
          id: 'global-singleton-task',
          title: message || 'Processing Request...',
          type: 'GENERAL',
        });
      } else {
        stopLoading('global-singleton-task');
      }
    },
    [startLoading, stopLoading]
  );

  // Pick appropriate icon according to primary task type
  const getTaskIcon = (type: LoadingTaskType) => {
    switch (type) {
      case 'VERIFICATION':
        return ShieldCheck;
      case 'AI_GENERATION':
        return Sparkles;
      case 'SEARCH':
        return Search;
      case 'EXPORT':
      case 'AUDIT':
        return FileCheck2;
      default:
        return Radio;
    }
  };

  const blockingTask = activeTasks.find((t) => t.blocking);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        activeTasks,
        primaryTask,
        startLoading,
        updateLoading,
        stopLoading,
        withLoading,
        setGlobalLoading,
      }}
    >
      {children}

      {/* 1. Global Top Ambient Progress Shimmer */}
      {isLoading && (
        <div
          id="global-top-progress-bar"
          className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-slate-900/20 overflow-hidden pointer-events-none"
        >
          <div className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600 animate-pulse w-full shadow-[0_0_12px_rgba(14,165,233,0.8)]" />
        </div>
      )}

      {/* 2. Floating Non-Blocking Live Verification Feedback Chip */}
      {isLoading && !blockingTask && primaryTask && (
        <div
          id="global-live-analysis-pill"
          className={`fixed bottom-20 right-4 sm:right-6 z-40 max-w-sm w-full bg-slate-900/95 text-slate-100 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            isMinimized ? 'p-3' : 'p-4'
          }`}
        >
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0 w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate">
                    {primaryTask.title}
                  </p>
                  {activeTasks.length > 1 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-500/20 text-sky-300 rounded-md">
                      +{activeTasks.length - 1}
                    </span>
                  )}
                </div>
                {!isMinimized && (
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {primaryTask.message ||
                      (primaryTask.type === 'VERIFICATION'
                        ? 'Cross-referencing truth registries & news wires...'
                        : 'Processing task...')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsMinimized((prev) => !prev)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand loading pill' : 'Minimize loading pill'}
              >
                {isMinimized ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <Minimize2 className="w-3.5 h-3.5" />
                )}
              </button>

              {primaryTask.cancelable && primaryTask.onCancel && (
                <button
                  onClick={() => {
                    primaryTask.onCancel?.();
                    stopLoading(primaryTask.id);
                  }}
                  className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-950/40 transition-colors"
                  title="Cancel Task"
                  aria-label="Cancel active task"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {!isMinimized && primaryTask.step && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">{primaryTask.step}</span>
              {typeof primaryTask.progress === 'number' && (
                <span className="font-semibold text-sky-400 ml-2">
                  {Math.round(primaryTask.progress)}%
                </span>
              )}
            </div>
          )}

          {!isMinimized && typeof primaryTask.progress === 'number' && (
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, primaryTask.progress))}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. Full Blocking Deep Verification Scan Modal */}
      {blockingTask && (
        <div
          id="global-blocking-verification-overlay"
          className="fixed inset-0 z-[9990] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            {/* Ambient Background Shimmer */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Pulsing Radar Animation Shield */}
            <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 border border-sky-500/30 flex items-center justify-center mb-5 shadow-inner">
              <div className="absolute inset-0 rounded-2xl animate-ping opacity-25 bg-sky-400" />
              <ShieldCheck className="w-10 h-10 text-sky-400 relative z-10" />
              <Loader2 className="w-14 h-14 text-emerald-400/40 animate-spin absolute z-0" />
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              {blockingTask.title}
            </h3>

            <p className="text-sm text-slate-400 mt-2">
              {blockingTask.message ||
                'Executing multi-source corroboration across national fact-checking registries and accredited news desks.'}
            </p>

            {/* Multi-tier Analysis Pipeline Stages */}
            <div className="mt-6 space-y-2 text-left bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Extracting atomic claims & semantic signals</span>
              </div>
              <div className="flex items-center gap-2 text-sky-300">
                <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin flex-shrink-0" />
                <span>Querying GNA, Reuters, Dubawa & official gazettes</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-3.5 h-3.5 rounded-full border border-slate-700 flex-shrink-0" />
                <span>Calculating credibility score & evidence dossier</span>
              </div>
            </div>

            {blockingTask.cancelable && blockingTask.onCancel && (
              <button
                onClick={() => {
                  blockingTask.onCancel?.();
                  stopLoading(blockingTask.id);
                }}
                className="mt-6 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                Cancel Verification
              </button>
            )}
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
