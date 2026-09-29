import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Link as LinkIcon, Image, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';

export const QuickVerificationCard: React.FC = () => {
  const navigate = useNavigate();

  const handleStartVerification = (type: 'text' | 'url' | 'screenshot') => {
    navigate('/verify', { state: { initialType: type } });
  };

  return (
    <div className="rounded-3xl border border-blue-200/90 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 p-6 sm:p-8 shadow-sm relative overflow-hidden">
      {/* Decorative subtle accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Rapid Information Check
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Have something you want to verify?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Check text, article links, or screenshots for signs of misleading or unreliable information before sharing.
          </p>
        </div>

        {/* 3 Quick Action Cards / Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleStartVerification('text')}
            className="flex items-center sm:flex-col sm:items-start justify-between sm:justify-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all group text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-xs sm:text-sm">Paste Text</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">WhatsApp, posts, claims</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors sm:hidden" />
          </button>

          <button
            type="button"
            onClick={() => handleStartVerification('url')}
            className="flex items-center sm:flex-col sm:items-start justify-between sm:justify-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all group text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-xs sm:text-sm">Article URL</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">News websites & blogs</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors sm:hidden" />
          </button>

          <button
            type="button"
            onClick={() => handleStartVerification('screenshot')}
            className="flex items-center sm:flex-col sm:items-start justify-between sm:justify-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all group text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors flex-shrink-0">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-xs sm:text-sm">Upload Screenshot</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Flyers & chats</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors sm:hidden" />
          </button>
        </div>
      </div>
    </div>
  );
};
