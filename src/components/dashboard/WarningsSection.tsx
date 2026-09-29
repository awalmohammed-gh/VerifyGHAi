import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Submission } from '../../types';
import { Button } from '../common/Button';

export interface WarningsSectionProps {
  submissions: Submission[];
}

export const WarningsSection: React.FC<WarningsSectionProps> = ({ submissions }) => {
  // Find submissions that are SUSPICIOUS or FAKE
  const warningSubmissions = submissions.filter(
    (s) => s.result?.classification === 'SUSPICIOUS' || s.result?.classification === 'FAKE'
  );

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Warnings</h3>
            <p className="text-[11px] text-slate-500">Unreliable or flagged claims requiring caution</p>
          </div>
        </div>

        {warningSubmissions.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
            {warningSubmissions.length} Flagged
          </span>
        )}
      </div>

      {warningSubmissions.length === 0 ? (
        <div className="py-6 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700">No recent warnings.</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Your recently checked submissions have not triggered critical misinformation or phishing alerts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {warningSubmissions.slice(0, 3).map((sub) => {
            const isFake = sub.result?.classification === 'FAKE';
            return (
              <div
                key={sub.id}
                className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isFake
                    ? 'bg-red-50/60 border-red-200/80 text-red-950'
                    : 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider ${
                        isFake ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                      }`}
                    >
                      {sub.result?.classification}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Score {sub.result?.score}/100
                    </span>
                  </div>
                  <p className="text-xs font-bold truncate text-slate-900">
                    "{sub.contentPreview}"
                  </p>
                  <p className="text-[11px] text-slate-600 line-clamp-1">
                    {sub.result?.summary || 'This content contains flags that require further independent verification.'}
                  </p>
                </div>

                <Link
                  to={`/dashboard/verify/result?id=${sub.id || (sub as any)._id || sub.result?.id}`}
                  className="flex-shrink-0"
                >
                  <Button
                    variant={isFake ? 'danger' : 'outline'}
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="w-full sm:w-auto"
                  >
                    View Report
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
