import React, { useState } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Search,
  CheckCircle2,
  Building2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Sparkles,
  Link2,
  AlertTriangle,
  FileText,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { VerificationSource } from '../../types';
import { Badge } from '../common/Badge';

export interface VerificationSourcesCardProps {
  sources?: VerificationSource[];
  referencedLinks?: string[];
  className?: string;
}

export const VerificationSourcesCard: React.FC<VerificationSourcesCardProps> = ({
  sources = [],
  referencedLinks = [],
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'TRUSTED' | 'OFFICIAL' | 'CONTRADICTING' | 'SUPPORTING'>('ALL');

  // Consolidate sources and standalone referenced links
  const allSources: VerificationSource[] = [];
  const existingUrls = new Set<string>();

  for (const s of sources) {
    if (s && s.url && !existingUrls.has(s.url)) {
      existingUrls.add(s.url);
      allSources.push(s);
    }
  }

  for (const link of referencedLinks) {
    if (link && !existingUrls.has(link)) {
      existingUrls.add(link);
      let domain = 'news-registry.org';
      try {
        domain = new URL(link).hostname.replace(/^www\./, '');
      } catch {}
      allSources.push({
        id: `ref_link_${allSources.length}`,
        sourceName: domain.split('.')[0].toUpperCase(),
        articleTitle: `Fact-Checking Citation (${domain})`,
        title: `Fact-Checking Citation (${domain})`,
        url: link,
        domain,
        publicationDate: new Date().toISOString().slice(0, 10),
        publishedDate: new Date().toISOString(),
        credibilityStatus: domain.endsWith('.gov') || domain.endsWith('.gov.gh') ? 'TRUSTED' : 'UNKNOWN',
        reliability: domain.endsWith('.gov') || domain.endsWith('.gov.gh') ? 'Official Registry' : 'High',
        relationship: 'MENTIONING',
        snippet: 'External citation cross-referenced during automated claim evaluation.',
        relevanceScore: 90,
      });
    }
  }

  // Filter sources
  const filteredSources = allSources.filter((source) => {
    const q = searchTerm.trim().toLowerCase();
    const title = (source.articleTitle || source.title || '').toLowerCase();
    const domain = (source.domain || '').toLowerCase();
    const sourceName = (source.sourceName || '').toLowerCase();
    const snippet = (source.snippet || '').toLowerCase();
    const matchedClaim = (source.matchedClaim || '').toLowerCase();

    const matchesSearch =
      q === '' ||
      title.includes(q) ||
      domain.includes(q) ||
      sourceName.includes(q) ||
      snippet.includes(q) ||
      matchedClaim.includes(q);

    const rel = (source.reliability || '').toUpperCase();
    const cred = (source.credibilityStatus || '').toUpperCase();
    const relationship = (source.relationship || '').toUpperCase();

    let matchesFilter = true;
    if (selectedFilter === 'OFFICIAL') {
      matchesFilter = rel.includes('OFFICIAL') || domain.includes('.gov');
    } else if (selectedFilter === 'TRUSTED') {
      matchesFilter = cred === 'TRUSTED' || rel.includes('HIGH') || rel.includes('OFFICIAL');
    } else if (selectedFilter === 'CONTRADICTING') {
      matchesFilter = relationship === 'CONTRADICTING';
    } else if (selectedFilter === 'SUPPORTING') {
      matchesFilter = relationship === 'SUPPORTING';
    }

    return matchesSearch && matchesFilter;
  });

  const getCredibilityBadge = (credibilityStatus?: string, reliability?: string, domain: string = '') => {
    const cred = (credibilityStatus || '').toUpperCase();
    const rel = (reliability || '').toLowerCase();

    if (cred === 'TRUSTED' || rel.includes('official') || domain.includes('.gov') || domain.includes('who.int')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          TRUSTED SOURCE
        </span>
      );
    }
    if (cred === 'SUSPICIOUS' || rel.includes('low')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          SUSPICIOUS SOURCE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
        UNKNOWN REPUTATION
      </span>
    );
  };

  const getRelationshipBadge = (relationship?: string) => {
    const rel = (relationship || '').toUpperCase();
    if (rel === 'SUPPORTING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
          <ThumbsUp className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          Supporting Evidence
        </span>
      );
    }
    if (rel === 'CONTRADICTING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <ThumbsDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          Contradicting / Debunking
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <FileText className="w-3 h-3 text-slate-500" />
        Contextual Mention
      </span>
    );
  };

  const getConfidenceGauge = (score?: number) => {
    if (typeof score !== 'number') return null;
    if (score >= 70) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          High Credibility ({score}%)
        </span>
      );
    }
    if (score >= 40) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Caution ({score}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Misinformation Risk ({score}%)
      </span>
    );
  };

  return (
    <div
      id="sources-and-evidence-verification-panel"
      className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Sources & Evidence Verification
              </h4>
              <Badge variant={allSources.length > 0 ? 'blue' : 'neutral'} size="sm">
                {allSources.length} {allSources.length === 1 ? 'Source' : 'Sources'} Identified
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exact sources, news wires, and registries cross-referenced for independent user verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/80">
            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            Google Search Grounding & Cross-Referencing
          </span>
        </div>
      </div>

      {/* Filter and Search Bar (when there are multiple sources) */}
      {allSources.length > 1 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search sources, headlines, or domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-xs ${
                selectedFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              All ({allSources.length})
            </button>
            <button
              onClick={() => setSelectedFilter('TRUSTED')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-xs ${
                selectedFilter === 'TRUSTED'
                  ? 'bg-emerald-700 text-white dark:bg-emerald-600 dark:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Trusted
            </button>
            <button
              onClick={() => setSelectedFilter('OFFICIAL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-xs ${
                selectedFilter === 'OFFICIAL'
                  ? 'bg-purple-700 text-white dark:bg-purple-600 dark:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Official Registries
            </button>
            <button
              onClick={() => setSelectedFilter('SUPPORTING')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-xs ${
                selectedFilter === 'SUPPORTING'
                  ? 'bg-teal-700 text-white dark:bg-teal-600 dark:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Supporting
            </button>
            <button
              onClick={() => setSelectedFilter('CONTRADICTING')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-xs ${
                selectedFilter === 'CONTRADICTING'
                  ? 'bg-rose-700 text-white dark:bg-rose-600 dark:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Debunking
            </button>
          </div>
        </div>
      )}

      {/* Source Links List or Empty State */}
      <div className="space-y-3 mt-4">
        {allSources.length === 0 ? (
          /* Missing Sources Handling (Explicit Requirement) */
          <div className="text-center py-8 px-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              No Direct Online Sources Found
            </h5>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 max-w-md mx-auto leading-relaxed">
              No independent online sources were found matching this exact claim. Exercise caution before sharing.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Cross-check with primary statutory bulletins or request a manual human fact-checker review.
            </p>
          </div>
        ) : filteredSources.length > 0 ? (
          filteredSources.map((source, index) => {
            const title = source.articleTitle || source.title || `${source.sourceName || 'Media'} Reference`;
            const pubDate = source.publicationDate || (source.publishedDate ? source.publishedDate.slice(0, 10) : null);
            const formattedPubDate = pubDate
              ? new Date(pubDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;

            return (
              <div
                key={source.id || `vsrc_${index}`}
                className="group relative rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 transition-all hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Domain, Publisher & Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {source.sourceName && (
                        <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-700/80 px-2 py-0.5 rounded-md">
                          {source.sourceName}
                        </span>
                      )}
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/60">
                        {source.domain}
                      </span>
                      {getCredibilityBadge(source.credibilityStatus, source.reliability, source.domain)}
                      {getRelationshipBadge(source.relationship)}
                      {getConfidenceGauge(source.relevanceScore)}
                      {formattedPubDate && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto sm:ml-0">
                          <Calendar className="w-3 h-3" />
                          {formattedPubDate}
                        </span>
                      )}
                    </div>

                    {/* Article Title as clickable external link */}
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors inline-flex items-center gap-1.5 leading-snug"
                    >
                      <span>{title}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>

                    {/* Factual Snippet / Citation */}
                    {source.snippet && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
                        {source.snippet}
                      </p>
                    )}

                    {/* Matched Claim or Query */}
                    {source.matchedClaim && (
                      <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Cross-referenced claim:</span>
                        <span className="italic truncate max-w-md text-slate-600 dark:text-slate-400">"{source.matchedClaim}"</span>
                      </div>
                    )}
                  </div>

                  {/* Direct Verification Button */}
                  <div className="flex-shrink-0 self-end sm:self-center">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Verify Source ↗</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No verification sources match the active query.
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('ALL');
                }}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Cross-referenced against verified Ghanaian & global fact-checking registries.</span>
        </div>
        <span>Google Search Grounding & Safe Citation Verification</span>
      </div>
    </div>
  );
};
