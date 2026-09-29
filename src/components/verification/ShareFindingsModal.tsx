import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Link as LinkIcon,
  MessageCircle,
  Twitter,
  Linkedin,
  Send,
  Mail,
  FileText,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { VerificationResult } from '../../types';
import { Button } from '../common/Button';
import { ClassificationBadge } from './ClassificationBadge';
import { useToast } from '../../context/ToastContext';

export interface ShareFindingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: VerificationResult;
  onCopySummary?: () => void;
}

type ShareTab = 'link' | 'summary' | 'markdown';

export const ShareFindingsModal: React.FC<ShareFindingsModalProps> = ({
  isOpen,
  onClose,
  result,
  onCopySummary,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ShareTab>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen) return null;

  // Build deep link
  const origin = window.location.origin || 'https://verifai-gh.app';
  const deepLink = `${origin}/verify/result/${result.id}`;

  const isReviewed = result.status === 'REVIEWED' || Boolean(result.humanReview);
  const effectiveClassification = (result.humanReview?.finalClassification || result.classification) as string;
  const effectiveScore = result.humanReview?.finalCredibilityScore ?? result.score;

  // Classification emoji & label
  const getClassificationEmoji = (cls: string) => {
    switch (cls?.toUpperCase()) {
      case 'VERIFIED':
        return '🟢 [VERIFIED - Authentic]';
      case 'TRUSTED':
        return '🔵 [TRUSTED - Credible]';
      case 'SUSPICIOUS':
        return '🟡 [SUSPICIOUS - Caution]';
      case 'FAKE':
        return '🔴 [FAKE - Misinformation]';
      default:
        return '⚪ [UNVERIFIED]';
    }
  };

  const getEmojiIcon = (cls: string) => {
    switch (cls?.toUpperCase()) {
      case 'VERIFIED':
        return '🟢';
      case 'TRUSTED':
        return '🔵';
      case 'SUSPICIOUS':
        return '🟡';
      case 'FAKE':
        return '🔴';
      default:
        return '⚪';
    }
  };

  // Generate plain-text verdict summary
  const generatePlainSummary = () => {
    const lines = [
      `🔍 VerifAI Ghana Fact-Check Assessment`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `VERDICT: ${getClassificationEmoji(effectiveClassification)}`,
      `CREDIBILITY SCORE: ${effectiveScore}/100 | CONFIDENCE: ${result.confidence}%`,
      isReviewed ? `AUDIT STATUS: 🛡️ Human-Reviewed & Adjudicated by VerifAI Fact-Checkers` : `AUDIT STATUS: ⚡ Automated AI Cross-Verification Engine`,
      ``,
      `CLAIM / CONTENT:`,
      `"${result.inputContent.length > 200 ? result.inputContent.slice(0, 197) + '...' : result.inputContent}"`,
      ``,
      `KEY FINDINGS:`,
      `• ${result.summary || 'Content was cross-examined against verified knowledge bases.'}`,
    ];

    if (result.explanations && result.explanations.length > 0) {
      lines.push(`• Context: ${result.explanations[0]}`);
    }

    if (result.recommendation) {
      lines.push(``, `RECOMMENDATION:`, `👉 ${result.recommendation}`);
    }

    lines.push(
      ``,
      `Read full evidence breakdown & source audit:`,
      `${deepLink}`,
      `#VerifAI #FactCheck #StopMisinformation`
    );

    return lines.join('\n');
  };

  // Generate Markdown summary
  const generateMarkdownSummary = () => {
    const lines = [
      `### 🔍 VerifAI Fact-Check Report: [Report #${result.id.slice(-6).toUpperCase()}](${deepLink})`,
      ``,
      `| Metric | Assessment |`,
      `| :--- | :--- |`,
      `| **Verdict** | **${effectiveClassification}** |`,
      `| **Credibility Score** | \`${effectiveScore}/100\` |`,
      `| **AI / Human Confidence** | \`${result.confidence}%\` |`,
      `| **Source Analyzed** | ${result.source.name || result.source.domain || 'Direct Content'} |`,
      `| **Status** | ${isReviewed ? '🛡️ Sealed & Reviewed by Human Fact-Checker' : '🤖 AI Cross-Verified'} |`,
      ``,
      `#### Claim Overview`,
      `> "${result.inputContent.replace(/\n+/g, ' ')}"`,
      ``,
      `#### Key Analysis Summary`,
      `${result.summary}`,
      ``,
    ];

    if (result.explanations && result.explanations.length > 0) {
      lines.push(`#### Key Evidentiary Findings:`);
      result.explanations.slice(0, 3).forEach((exp) => {
        lines.push(`- ${exp}`);
      });
      lines.push(``);
    }

    if (result.recommendation) {
      lines.push(`#### Recommendation`);
      lines.push(`*${result.recommendation}*`, ``);
    }

    lines.push(`---`, `*Verified via [VerifAI Ghana Platform](${deepLink}) on ${new Date(result.createdAt).toLocaleDateString()}*`);

    return lines.join('\n');
  };

  const plainSummary = generatePlainSummary();
  const markdownSummary = generateMarkdownSummary();

  // Copy helper with fallback
  const handleCopy = async (text: string, type: 'link' | 'summary' | 'markdown') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
        toast.success('Link Copied', 'Deep-link copied to clipboard!');
      } else if (type === 'summary') {
        setCopiedSummary(true);
        if (onCopySummary) onCopySummary();
        setTimeout(() => setCopiedSummary(false), 2500);
        toast.success('Summary Copied', 'Verdict summary copied to clipboard, ready to paste!');
      } else if (type === 'markdown') {
        setCopiedMarkdown(true);
        if (onCopySummary) onCopySummary();
        setTimeout(() => setCopiedMarkdown(false), 2500);
        toast.success('Markdown Copied', 'Markdown fact-check report copied!');
      }
    } catch (err) {
      toast.error('Copy Failed', 'Unable to access clipboard. Please select and copy manually.');
    }
  };

  // Native Web Share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VerifAI Fact-Check: ${effectiveClassification} (${effectiveScore}/100)`,
          text: `${getEmojiIcon(effectiveClassification)} VerifAI Fact-Check: "${result.inputContent.slice(0, 100)}..." rated as ${effectiveClassification}.`,
          url: deepLink,
        });
        toast.success('Shared Successfully', 'Shared via system share menu.');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('[ShareFindingsModal] Web Share error:', err);
        }
      }
    } else {
      handleCopy(deepLink, 'link');
    }
  };

  // Social share URLs
  const encodedUrl = encodeURIComponent(deepLink);
  const encodedShortText = encodeURIComponent(
    `🔍 Fact-Check Verdict: ${effectiveClassification} (${effectiveScore}/100) on VerifAI.\n"${result.inputContent.slice(0, 90)}..."\n`
  );
  const encodedFullText = encodeURIComponent(plainSummary);

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      url: `https://api.whatsapp.com/send?text=${encodedFullText}`,
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700',
      url: `https://twitter.com/intent/tweet?text=${encodedShortText}&url=${encodedUrl}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-sky-500 hover:bg-sky-600 text-white',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedShortText}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800 text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-slate-700 hover:bg-slate-800 text-white',
      url: `mailto:?subject=${encodeURIComponent(`VerifAI Fact-Check Assessment: ${effectiveClassification} [Score: ${effectiveScore}/100]`)}&body=${encodedFullText}`,
    },
  ];

  return (
    <div
      id="share-findings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-findings-modal-title"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="share-findings-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Share Verification Findings
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Report #{result.id.slice(-6).toUpperCase()}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <ClassificationBadge classification={effectiveClassification as any} size="xs" />
                <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">
                  {effectiveScore}/100
                </span>
              </div>
            </div>
          </div>
          <button
            id="close-share-findings-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 px-6 pt-2 gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'link'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Direct Deep-Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Verdict Summary (Text)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('markdown')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'markdown'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Markdown Citation
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
          {/* TAB 1: DIRECT LINK & SOCIAL SHARE */}
          {activeTab === 'link' && (
            <div className="space-y-5">
              {/* Deep Link Bar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Direct Verification Report URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="share-deep-link-input"
                      type="text"
                      readOnly
                      value={deepLink}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white select-all focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <Button
                    id="copy-deep-link-btn"
                    variant={copiedLink ? 'primary' : 'secondary'}
                    size="md"
                    onClick={() => handleCopy(deepLink, 'link')}
                    leftIcon={copiedLink ? <Check className="w-4 h-4 text-white animate-in zoom-in-50 duration-150" /> : <Copy className="w-4 h-4" />}
                    className={`transition-all duration-200 ${
                      copiedLink
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pop shadow-md ring-2 ring-emerald-400/40'
                        : ''
                    }`}
                  >
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Anyone with this link can inspect the full breakdown, evidence claims, source traces, and credibility metrics.
                </p>
              </div>

              {/* Native Web Share Button (if supported) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <div className="pt-1">
                  <Button
                    id="native-web-share-btn"
                    variant="outline"
                    size="sm"
                    onClick={handleNativeShare}
                    leftIcon={<Share2 className="w-3.5 h-3.5 text-blue-600" />}
                    className="w-full justify-center border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                  >
                    Share via Device Apps (AirDrop, Messages, etc.)
                  </Button>
                </div>
              )}

              {/* Social Channels */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Share Instantly to Social Platforms
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] ${social.color}`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{social.name}</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Quick Verdict Card Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Preview of Shared Verdict Card
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    {showQrCode ? 'Hide QR Code' : 'Show QR Code'}
                  </button>
                </div>

                {showQrCode && (
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(deepLink)}`}
                      alt="Verification Deep Link QR Code"
                      className="w-32 h-32 mx-auto rounded-lg border border-slate-200 dark:border-slate-800 p-1 bg-white"
                      loading="lazy"
                    />
                    <p className="text-[10px] text-slate-500">Scan with mobile camera to view assessment instantly</p>
                  </div>
                )}

                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                    "{result.inputContent}"
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2">
                    {result.summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLAIN TEXT SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Formatted Text Summary for Messaging & Socials
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {plainSummary.length} characters
                </span>
              </div>

              <div className="relative">
                <textarea
                  id="share-plain-summary-textarea"
                  readOnly
                  rows={9}
                  value={plainSummary}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full p-4 text-xs font-mono rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 select-all leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ready to copy and paste into WhatsApp chats, Slack channels, tweets, or SMS.
                </p>
                <Button
                  id="copy-plain-summary-btn"
                  variant={copiedSummary ? 'primary' : 'primary'}
                  size="sm"
                  onClick={() => handleCopy(plainSummary, 'summary')}
                  leftIcon={copiedSummary ? <Check className="w-3.5 h-3.5 text-white animate-in zoom-in-50 duration-150" /> : <Copy className="w-3.5 h-3.5" />}
                  className={`transition-all duration-200 flex-shrink-0 ${
                    copiedSummary
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pop shadow-md ring-2 ring-emerald-400/40'
                      : ''
                  }`}
                >
                  {copiedSummary ? 'Summary Copied!' : 'Copy Summary'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: MARKDOWN CITATION */}
          {activeTab === 'markdown' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Markdown Report Format for Documentation & Research
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  Markdown (.md)
                </span>
              </div>

              <div className="relative">
                <textarea
                  id="share-markdown-summary-textarea"
                  readOnly
                  rows={9}
                  value={markdownSummary}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full p-4 text-xs font-mono rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 select-all leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Includes formatted tables, verdict headers, and link citations for Notion, GitHub, or publishing.
                </p>
                <Button
                  id="copy-markdown-summary-btn"
                  variant={copiedMarkdown ? 'primary' : 'primary'}
                  size="sm"
                  onClick={() => handleCopy(markdownSummary, 'markdown')}
                  leftIcon={copiedMarkdown ? <Check className="w-3.5 h-3.5 text-white animate-in zoom-in-50 duration-150" /> : <Copy className="w-3.5 h-3.5" />}
                  className={`transition-all duration-200 flex-shrink-0 ${
                    copiedMarkdown
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pop shadow-md ring-2 ring-emerald-400/40'
                      : ''
                  }`}
                >
                  {copiedMarkdown ? 'Markdown Copied!' : 'Copy Markdown'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Publicly shareable fact-check link</span>
          </div>
          <Button
            id="close-share-modal-footer-btn"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
