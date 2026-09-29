import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';

/**
 * Isolated Full-Page Authentication Layout
 * Renders without the Global PublicNavbar or PublicFooter.
 */
export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-50 dark:from-[#090D16] dark:via-slate-900 dark:to-[#090D16] text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-hidden transition-colors duration-200">
      {/* Subtle Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-blue-100/40 via-blue-50/20 to-transparent dark:from-blue-900/20 dark:via-blue-950/10 dark:to-transparent pointer-events-none -z-10" />

      {/* Minimal Auth Header: Back link & Security note (NO Global Navbar) */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          aria-label="Return to Homepage"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>256-Bit Encrypted Session</span>
        </div>
      </header>

      {/* Main Authentication Card Mount Point */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10 w-full">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Minimal Auth Sub-Footer (NO Global Footer) */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-400 dark:text-slate-500 z-10">
        <p>© 2026 VERIFAI GH. AI-Powered Misinformation Detection System. All rights reserved.</p>
      </footer>
    </div>
  );
};
