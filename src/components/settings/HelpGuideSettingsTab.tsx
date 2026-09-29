import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const HelpGuideSettingsTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'Verification & Scoring',
      q: 'How does VerifAI GH evaluate credibility scores (0–100)?',
      a: 'The credibility score is an AI-assisted composite metric derived from: (1) Domain reputation in the Ghana Source Credibility Index, (2) Sensationalism and emotional urgency lexical patterns, (3) Cross-referencing against verified regional fact-checking databases, and (4) Corroboration against official government gazettes and primary publications.',
    },
    {
      category: 'Classifications',
      q: 'What is the distinction between "VERIFIED", "TRUSTED", "SUSPICIOUS", and "FAKE"?',
      a: 'VERIFIED indicates full factual confirmation by official sources. TRUSTED means the content originates from an established publisher with sound editorial standards. SUSPICIOUS flags red flags such as sensational uncorroborated claims or urgency triggers. FAKE denotes a confirmed fabricated hoax or malicious rumor.',
    },
    {
      category: 'Supported Formats',
      q: 'What types of content can I verify?',
      a: 'You can verify three distinct formats: (1) Raw Text Snippets (such as viral WhatsApp chain forwards), (2) Published Article URLs (online news websites and blogs), and (3) Screenshot Images (flyers, social media screenshots, and official-looking circulars).',
    },
    {
      category: 'Data & Privacy',
      q: 'Are my submitted claims and uploaded images private?',
      a: 'Yes. User submissions are processed securely for credibility indexing and fact-checking synthesis. We strongly advise against submitting confidential credentials, private financial PINs, or sensitive personally identifiable health data.',
    },
    {
      category: 'Best Practices',
      q: 'What should I do if a WhatsApp message is flagged as SUSPICIOUS or FAKE?',
      a: 'Do not forward the message to any contacts or group chats. Check verified regional news sources, visit official ministry websites (e.g. gov.gh), or view our comprehensive evidence breakdown to share the factual debunking summary instead.',
    },
    {
      category: 'Account & Reports',
      q: 'Can I export or print verification evidence reports?',
      a: 'Yes. Every completed verification can be bookmarked to your "My Reports" archive and exported or printed with a dedicated print-optimized layout including full evidence logs and timestamped authenticity scores.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase()) ||
      faq.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 text-left">
      {/* Search Header */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Knowledge Base & Support Documentation</h3>
          </div>
          <p className="text-xs text-slate-500">
            Learn about verification methodologies, detection sensitivity, and fact-checking standards.
          </p>
        </div>

        <Input
          placeholder="Search documentation (e.g. score, WhatsApp, classifications, privacy)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Guide Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Verification Guide</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Step-by-step instructions on evaluating online misinformation in Ghana.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Source Credibility Index</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            How domain reputation and editorial transparency metrics are compiled.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Evidence Standards</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Criteria for corroboration and primary document cross-referencing.
          </p>
        </div>
      </div>

      {/* Searchable FAQ Accordion */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Frequently Asked Questions</h3>
          <span className="text-[11px] font-semibold text-slate-400">
            {filteredFaqs.length} {filteredFaqs.length === 1 ? 'topic' : 'topics'} found
          </span>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            No matching topics found for "{search}". Try searching for words like "score", "fake", or "WhatsApp".
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 overflow-hidden transition-all bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-4.5 flex items-center justify-between text-left gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">
                        {faq.category}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4.5 pb-4.5 pt-1 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Support & Contact Banner */}
      <div className="rounded-3xl bg-blue-50 border border-blue-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-blue-950 shadow-xs">
        <div className="space-y-1.5 text-center sm:text-left">
          <h4 className="font-bold text-sm text-blue-900">Need personalized guidance or custom integrations?</h4>
          <p className="text-blue-800 leading-relaxed">
            Our fact-checking methodology team and engineering support are available to answer inquiries.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => window.open('mailto:support@verifai.gh')}
          leftIcon={<Mail className="w-4 h-4" />}
          className="flex-shrink-0"
        >
          Contact Support
        </Button>
      </div>
    </div>
  );
};
