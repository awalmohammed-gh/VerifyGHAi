import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'contact' | null>(null);

  return (
    <>
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80 py-12 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Brand Logo & Name */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              VerifAI <span className="text-blue-600 font-black">GH</span>
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            AI-assisted information verification.
          </p>

          {/* Links */}
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setActiveModal('privacy')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => setActiveModal('terms')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Terms
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => setActiveModal('contact')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-2">
            © 2026 VerifAI GH
          </p>
        </div>
      </footer>

      {/* Clean Informational Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-4 text-left">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {activeModal === 'privacy' && 'Privacy Policy'}
              {activeModal === 'terms' && 'Terms of Service'}
              {activeModal === 'contact' && 'Contact Support & Team'}
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed max-h-64 overflow-y-auto pr-1">
              {activeModal === 'privacy' && (
                <>
                  <p>
                    VerifAI GH respects your privacy. Content submitted for verification is analyzed in real-time
                    using search grounding and verified registries.
                  </p>
                  <p>
                    We do not sell personal data or track browsing history outside of submitted verification sessions.
                  </p>
                </>
              )}
              {activeModal === 'terms' && (
                <>
                  <p>
                    VerifAI GH provides automated informational assessments to assist with media literacy and information hygiene.
                  </p>
                  <p>
                    Verification indicators reflect automated algorithmic analysis against public web records and are intended for advisory and educational use.
                  </p>
                </>
              )}
              {activeModal === 'contact' && (
                <>
                  <p>
                    Have inquiries, publisher whitelisting requests, or partnership ideas for VerifAI GH?
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Email: support@verifai-gh.org
                  </p>
                  <p className="text-slate-500">
                    Location: Accra, Ghana
                  </p>
                </>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
