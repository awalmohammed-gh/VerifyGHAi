import React, { useState } from 'react';
import {
  GitBranch,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Radio,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SourceTrace, SourceTraceNode } from '../../types/verification';
import { Badge } from '../common/Badge';

export interface SourceTraceCardProps {
  sourceTrace?: SourceTrace;
  className?: string;
}

export const SourceTraceCard: React.FC<SourceTraceCardProps> = ({
  sourceTrace,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'flow' | 'matrix'>('flow');

  if (!sourceTrace) {
    return null;
  }

  const {
    submittedSource,
    earliestSource,
    otherSources = [],
    supportingEvidence = [],
    contradictingEvidence = [],
    traceConfidence = 'LOW',
    propagationFlow = [],
    notes,
  } = sourceTrace;

  const isLowConfidence = traceConfidence === 'LOW';

  const getConfidenceBadge = (confidence: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (confidence) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            HIGH PROVENANCE CONFIDENCE
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            MEDIUM TRACE CONFIDENCE
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            LOW TRACE CONFIDENCE (LIMITED ORIGIN SIGNALS)
          </span>
        );
    }
  };

  const renderSourceValue = (val?: string | null, fallback = 'Information unavailable') => {
    if (!val || val.trim() === '' || val === 'Information unavailable') {
      return (
        <span className="italic text-slate-400 dark:text-slate-500 font-normal">
          {fallback}
        </span>
      );
    }
    return val;
  };

  return (
    <div
      id="source-trace-provenance-engine"
      className={`rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 dark:from-slate-800/40 dark:via-slate-900 dark:to-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs flex-shrink-0">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                PROVENANCE & ORIGIN ENGINE
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Source Trace & News Evolution
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {getConfidenceBadge(traceConfidence)}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Collapse section' : 'Expand section'}
            aria-label="Toggle Source Trace Details"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 sm:p-7 space-y-6">
          {/* Earliest Origin vs Submitted Source Comparison Hero */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earliest Discovered Origin */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Earliest Source Found
                </span>
                {earliestSource.credibilityScore !== undefined && (
                  <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                    Credibility: {earliestSource.credibilityScore}/100
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {renderSourceValue(earliestSource.name, 'Information unavailable')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                  {renderSourceValue(earliestSource.domain, 'Domain unconfirmed')}
                </p>
              </div>

              {earliestSource.headline && earliestSource.headline !== 'Information unavailable' && (
                <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
                  "{earliestSource.headline}"
                </p>
              )}

              <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Date: {renderSourceValue(earliestSource.publishedDate, 'Information unavailable')}
                </span>

                {earliestSource.url && earliestSource.url !== 'Information unavailable' ? (
                  <a
                    href={earliestSource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    View Original <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="italic text-slate-400">Link unavailable</span>
                )}
              </div>
            </div>

            {/* Submitted Source Origin */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  <FileText className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  Submitted Source Record
                </span>
                {submittedSource.credibilityScore !== undefined && (
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Rating: {submittedSource.credibilityScore}/100
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {renderSourceValue(submittedSource.name, 'Submitted Claim Text')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                  {renderSourceValue(submittedSource.domain, 'Input Text / Document')}
                </p>
              </div>

              {submittedSource.headline && submittedSource.headline !== 'Information unavailable' && (
                <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  "{submittedSource.headline}"
                </p>
              )}

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Date: {renderSourceValue(submittedSource.publishedDate, 'Information unavailable')}
                </span>

                {submittedSource.url && submittedSource.url !== 'Information unavailable' ? (
                  <a
                    href={submittedSource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Source <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="italic text-slate-400">Direct input</span>
                )}
              </div>
            </div>
          </div>

          {/* View Tab Selector */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('flow')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'flow'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Propagation Flow
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'matrix'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Detailed Provenance Matrix
              </button>
            </div>

            {notes && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:inline-block italic">
                {notes}
              </span>
            )}
          </div>

          {/* TAB 1: Visual Propagation Flow */}
          {activeTab === 'flow' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
                  Information Dissemination Timeline
                </span>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  {propagationFlow.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex-1 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs">
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </div>
                        <span className="leading-snug">{step}</span>
                      </div>

                      {idx < propagationFlow.length - 1 && (
                        <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 self-center">
                          <ArrowRight className="w-4 h-4 hidden md:block" />
                          <span className="md:hidden text-xs">↓</span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Detailed Provenance Matrix */}
          {activeTab === 'matrix' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Role / Node</th>
                    <th className="p-3.5">Publisher / Outlet</th>
                    <th className="p-3.5">Discovered Date</th>
                    <th className="p-3.5">Report / Stated Claim</th>
                    <th className="p-3.5 text-right">Link / Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {/* Earliest Origin Row */}
                  <tr className="bg-emerald-50/30 dark:bg-emerald-950/10">
                    <td className="p-3.5">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                        Earliest Found
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-900 dark:text-white font-bold">
                      {renderSourceValue(earliestSource.name)}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {renderSourceValue(earliestSource.publishedDate)}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {renderSourceValue(earliestSource.headline || earliestSource.summary)}
                    </td>
                    <td className="p-3.5 text-right">
                      {earliestSource.url && earliestSource.url !== 'Information unavailable' ? (
                        <a
                          href={earliestSource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          Source Link <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="italic text-slate-400">Unavailable</span>
                      )}
                    </td>
                  </tr>

                  {/* Submitted Source Row */}
                  <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                    <td className="p-3.5">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">
                        Submitted
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-900 dark:text-white font-bold">
                      {renderSourceValue(submittedSource.name)}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {renderSourceValue(submittedSource.publishedDate)}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {renderSourceValue(submittedSource.headline || submittedSource.summary)}
                    </td>
                    <td className="p-3.5 text-right">
                      {submittedSource.url && submittedSource.url !== 'Information unavailable' ? (
                        <a
                          href={submittedSource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          Source Link <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="italic text-slate-400">Direct input</span>
                      )}
                    </td>
                  </tr>

                  {/* Other Outlets Rows */}
                  {otherSources.map((source, idx) => (
                    <tr key={idx}>
                      <td className="p-3.5 text-slate-500">Syndication / Outlet</td>
                      <td className="p-3.5 text-slate-900 dark:text-white font-bold">
                        {renderSourceValue(source.name)}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {renderSourceValue(source.publishedDate)}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {renderSourceValue(source.headline || source.summary)}
                      </td>
                      <td className="p-3.5 text-right">
                        {source.url && source.url !== 'Information unavailable' ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            Source Link <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="italic text-slate-400">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Supporting & Contradicting Evidence Corroboration */}
          {(supportingEvidence.length > 0 || contradictingEvidence.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Supporting */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Corroborating Discovered Evidence ({supportingEvidence.length})
                </span>
                {supportingEvidence.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No direct corroborating records discovered.</p>
                ) : (
                  <ul className="space-y-2">
                    {supportingEvidence.map((se, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200/40 dark:border-emerald-800/30">
                        <span className="font-bold text-slate-900 dark:text-white block">{se.name}</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{se.summary || se.headline}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Contradicting */}
              <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-800 dark:text-red-300 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  Contradicting / Debunking Evidence ({contradictingEvidence.length})
                </span>
                {contradictingEvidence.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No contradictory records discovered.</p>
                ) : (
                  <ul className="space-y-2">
                    {contradictingEvidence.map((ce, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-red-200/40 dark:border-red-800/30">
                        <span className="font-bold text-slate-900 dark:text-white block">{ce.name}</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{ce.summary || ce.headline}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
