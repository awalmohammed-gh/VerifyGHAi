import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastPromiseOptions<T> {
  loading: string | { title: string; message?: string };
  success: string | { title: string; message?: string } | ((data: T) => string | { title: string; message?: string });
  error: string | { title: string; message?: string } | ((err: any) => string | { title: string; message?: string });
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Omit<ToastMessage, 'id'>>) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, message?: string, duration?: number) => string;
    error: (title: string, message?: string, duration?: number) => string;
    warning: (title: string, message?: string, duration?: number) => string;
    info: (title: string, message?: string, duration?: number) => string;
    loading: (title: string, message?: string) => string;
    promise: <T>(promise: Promise<T>, options: ToastPromiseOptions<T>) => Promise<T>;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback(
    (id: string, updates: Partial<Omit<ToastMessage, 'id'>>) => {
      setToasts((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            const updated = { ...t, ...updates };
            if (updates.duration && updates.duration > 0) {
              setTimeout(() => {
                removeToast(id);
              }, updates.duration);
            }
            return updated;
          }
          return t;
        })
      );
    },
    [removeToast]
  );

  const addToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0 && type !== 'loading') {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (title: string, message?: string, duration = 4500) =>
      addToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration = 6000) =>
      addToast({ type: 'error', title, message, duration }),
    warning: (title: string, message?: string, duration = 5000) =>
      addToast({ type: 'warning', title, message, duration }),
    info: (title: string, message?: string, duration = 4500) =>
      addToast({ type: 'info', title, message, duration }),
    loading: (title: string, message?: string) =>
      addToast({ type: 'loading', title, message, duration: 0 }),
    promise: async <T,>(promise: Promise<T>, options: ToastPromiseOptions<T>): Promise<T> => {
      const loadingConfig =
        typeof options.loading === 'string'
          ? { title: options.loading, message: undefined }
          : options.loading;
      const toastId = addToast({
        type: 'loading',
        title: loadingConfig.title,
        message: loadingConfig.message,
        duration: 0,
      });

      try {
        const result = await promise;
        const successRes =
          typeof options.success === 'function' ? options.success(result) : options.success;
        const successConfig =
          typeof successRes === 'string'
            ? { title: successRes, message: undefined }
            : successRes;

        updateToast(toastId, {
          type: 'success',
          title: successConfig.title,
          message: successConfig.message,
          duration: 4500,
        });
        return result;
      } catch (err: any) {
        const errorRes =
          typeof options.error === 'function' ? options.error(err) : options.error;
        const errorConfig =
          typeof errorRes === 'string'
            ? { title: errorRes, message: err?.message }
            : errorRes;

        updateToast(toastId, {
          type: 'error',
          title: errorConfig.title,
          message: errorConfig.message || err?.message,
          duration: 6000,
        });
        throw err;
      }
    },
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, updateToast, removeToast, toast }}>
      {children}
      <div
        id="toast-container"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print"
      >
        {toasts.map((t) => {
          let bg = 'bg-slate-900 text-white border-slate-700';
          let Icon = Info;
          let iconColor = 'text-blue-400';
          let isSpinning = false;

          if (t.type === 'success') {
            bg = 'bg-emerald-950/95 text-emerald-100 border-emerald-800';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (t.type === 'error') {
            bg = 'bg-rose-950/95 text-rose-100 border-rose-800';
            Icon = AlertCircle;
            iconColor = 'text-rose-400';
          } else if (t.type === 'warning') {
            bg = 'bg-amber-950/95 text-amber-100 border-amber-800';
            Icon = AlertTriangle;
            iconColor = 'text-amber-400';
          } else if (t.type === 'loading') {
            bg = 'bg-slate-900/95 text-sky-100 border-sky-800 shadow-sky-950/40';
            Icon = Loader2;
            iconColor = 'text-sky-400';
            isSpinning = true;
          } else {
            bg = 'bg-slate-900/95 text-slate-100 border-slate-700';
            Icon = Info;
            iconColor = 'text-sky-400';
          }

          return (
            <div
              key={t.id}
              id={`toast-${t.id}`}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${bg}`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor} ${
                  isSpinning ? 'animate-spin' : ''
                }`}
              />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{t.title}</p>
                {t.message && <p className="text-xs opacity-90 mt-0.5">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
