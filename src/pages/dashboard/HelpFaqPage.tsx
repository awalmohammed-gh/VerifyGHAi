import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
} from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const HelpFaqPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is VerifAI GH?',
      a: 'VerifAI GH is an informational verification platform designed to help citizens, journalists, and readers check the credibility of text messages, online articles, and visual screenshots before sharing them. It provides explainable credibility scoring and evidence summaries.',
    },
    {
      q: 'How do I verify content?',
      a: 'Navigate to "Verify Content" from your dashboard or sidebar. Choose whether you have a text snippet (e.g. WhatsApp forward), an Article URL (news website), or a Screenshot image. Click "Analyze Content" to start the verification report pipeline.',
    },
    {
      q: 'How does the 0–100 Credibility Score work?',
      a: 'The credibility score evaluates multiple weighted factors: (1) Domain reputation and registered status in the Ghana credibility index, (2) Linguistic tone, clickbait triggers, and sensationalism markers, (3) Cross-referencing against verified regional fact-checking databases, and (4) Matching claims against supporting or contradictory primary documents.',
    },
    {
      q: 'What does the "VERIFIED" classification mean?',
      a: 'VERIFIED indicates that the core factual claims in the submission are strongly supported by official records, credible primary sources, and verified ministerial publications.',
    },
    {
      q: 'What does the "TRUSTED" classification mean?',
      a: 'TRUSTED indicates that the content originates from an established publisher with consistent editorial standards, and available facts align with known reporting without obvious deceptive indicators.',
    },
    {
      q: 'What does the "SUSPICIOUS" classification mean?',
      a: 'SUSPICIOUS indicates that the content contains red flags such as uncorroborated sensational claims, manipulated quotes, unverified sources, or emotionally charged urgency triggers. You should pause and look for independent corroboration before sharing.',
    },
    {
      q: 'What does the "FAKE" classification mean?',
      a: 'FAKE indicates that the submission is a confirmed rumor, fabricated statement, phishing attempt, or contradicted by authoritative public notices. Do NOT forward or share.',
    },
    {
      q: 'How is source credibility assessed?',
      a: 'Source domains are evaluated for institutional transparency, ownership disclosure, editorial correction policies, and past history of circulating unverified or retracted claims.',
    },
    {
      q: 'What should I do if content is suspicious?',
      a: 'Do not forward it to WhatsApp groups or social feeds. Check independent news outlets, search official ministry websites (e.g. gov.gh domains), or consult recognized regional fact-checkers.',
    },
    {
      q: 'Can I completely rely on the result?',
      a: 'VerifAI GH is an AI-assisted decision-support tool, not an infallible judge of truth. While our automated models evaluate evidence, we always encourage users to apply human critical thinking and consult multiple independent sources.',
    },
    {
      q: 'Privacy and data usage',
      a: 'We respect user privacy. We recommend not submitting passwords, private financial PINs, confidential health records, or sensitive personal identifiable information into the verification form.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Help & Guide</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Everything you need to know about credibility classifications, scoring, and source evaluation.
        </p>

        <div className="pt-6">
          <Input
            placeholder="Search help topics (e.g. score, WhatsApp, suspicious, fake)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 flex items-center justify-between text-left gap-4 bg-white hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Support CTA */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-950">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-bold text-sm">Have a question not listed here?</h4>
          <p className="text-blue-800">
            Our verification research team is happy to help clarify methodology.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => window.open('mailto:help@verifai.gh')}
          leftIcon={<MessageSquare className="w-4 h-4" />}
        >
          Contact Support
        </Button>
      </div>
    </div>
  );
};
