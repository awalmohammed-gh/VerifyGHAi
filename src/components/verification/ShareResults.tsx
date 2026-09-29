import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Twitter,
  Linkedin,
  Send,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  QrCode,
  Globe,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { ShareFindingsModal } from './ShareFindingsModal';

export interface ShareResultsProps {
  result: {
    id: string;
    classification: string;
    score: number;
    confidence?: number;
    inputContent: string;
    summary?: string;
    explanations?: string[];
    source?: { name?: string; domain?: string };
    createdAt?: string;
    humanReview?: any;
    status?: string;
  };
  variant?: 'button' | 'card' | 'inline' | 'compact' | 'icon';
  className?: string;
  buttonLabel?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  onShared?: () => void;
}

export const ShareResults: React.FC<ShareResultsProps> = ({
  result,
  variant = 'button',
  className = '',
  buttonLabel = 'Share Results',
  buttonSize = 'sm',
  onShared,
}) => {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://verifai-gh.app';
  const shareUrl = `${origin}/verify/result/${result.id}`;

  const effectiveClassification = (result.humanReview?.finalClassification || result.classification || 'UNVERIFIED').toUpperCase();
  const effectiveScore = result.humanReview?.finalCredibilityScore ?? result.score ?? 50;
  const effectiveConfidence = result.confidence ?? 85;

  const getEmojiForClassification = (cls: string) => {
    switch (cls) {
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

  const getShareTitle = () => `VerifAI Ghana: ${effectiveClassification} (${effectiveScore}/100)`;

  const getShareText = () => {
    const snippet = result.inputContent
      ? result.inputContent.length > 120
        ? result.inputContent.slice(0, 117) + '...'
        : result.inputContent
      : 'Credibility Assessment';
    return `🔍 VerifAI Credibility Assessment:\n"${snippet}"\nVerdict: ${getEmojiForClassification(effectiveClassification)}\nScore: ${effectiveScore}/100 | Confidence: ${effectiveConfidence}%\nExplore full evidence breakdown:`;
  };

  /**
   * Primary action handler utilizing the Web Share API with intelligent fallback
   */
  const handleTriggerShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Check for Native Web Share API support
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      const shareData = {
        title: getShareTitle(),
        text: getShareText(),
        url: shareUrl,
      };

      try {
        await navigator.share(shareData);
        toast.success('Shared Successfully', 'Assessment findings shared via system share menu.');
        onShared?.();
        return;
      } catch (err: any) {
        // User aborted share sheet or unsupported platform
        if (err.name === 'AbortError') {
          return;
        }
        console.warn('[ShareResults] Web Share error, fallback to modal:', err);
      }
    }

    // Fallback if Web Share is unavailable or errored: Open rich sharing modal
    setIsModalOpen(true);
  };

  const handleQuickCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast.success('Link Copied', 'Direct assessment URL copied to clipboard.');
      onShared?.();
    } catch (err) {
      toast.error('Copy Failed', 'Please manually copy the link from the share modal.');
      setIsModalOpen(true);
    }
  };

  // 1. Icon Only Variant
  if (variant === 'icon') {
    return (
      <>
        <button
          type="button"
          onClick={handleTriggerShare}
          className={`p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors cursor-pointer ${className}`}
          title="Share Assessment via Web Share or Socials"
          aria-label="Share assessment findings"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <ShareFindingsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          result={result as any}
        />
      </>
    );
  }

  // 2. Compact Variant (Pill button with Share icon)
  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleTriggerShare}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs ${className}`}
          title="Share findings via Web Share API"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{buttonLabel}</span>
        </button>

        <ShareFindingsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          result={result as any}
        />
      </>
    );
  }

  // 3. Inline Row Variant (Share + Quick Copy + Social Icons)
  if (variant === 'inline') {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(getShareText());

    return (
      <>
        <div className={`flex items-center gap-2 flex-wrap ${className}`}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTriggerShare}
            leftIcon={<Share2 className="w-3.5 h-3.5 text-blue-600" />}
            className="text-xs font-bold border-slate-200 hover:border-blue-300"
          >
            {buttonLabel}
          </Button>

          <button
            type="button"
            onClick={handleQuickCopyLink}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Copy direct verification link"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
          </button>

          <a
            href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
            title="Share to WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Share to X"
          >
            <Twitter className="w-4 h-4" />
          </a>
        </div>

        <ShareFindingsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          result={result as any}
        />
      </>
    );
  }

  // 4. Card Variant (Full sharing hub card)
  if (variant === 'card') {
    return (
      <>
        <div
          id={`share-results-card-${result.id}`}
          className={`rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-4 text-left ${className}`}
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Share Credibility Findings
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Broadcast this fact-check report across social channels or copy a summary.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleTriggerShare}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
            >
              Web Share
            </Button>
          </div>

          {/* Share Preview Quote */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-600 dark:text-slate-300">
                Verdict: <span className="font-extrabold text-blue-600 dark:text-blue-400">{effectiveClassification}</span>
              </span>
              <span className="font-mono text-slate-400">Score: {effectiveScore}/100</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic line-clamp-2">
              "{result.inputContent}"
            </p>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 truncate pr-20"
              />
              <button
                type="button"
                onClick={handleQuickCopyLink}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold whitespace-nowrap"
            >
              More Options
            </Button>
          </div>
        </div>

        <ShareFindingsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          result={result as any}
        />
      </>
    );
  }

  // 5. Default Button Variant
  return (
    <>
      <Button
        id={`share-results-btn-${result.id}`}
        type="button"
        variant="outline"
        size={buttonSize}
        onClick={handleTriggerShare}
        leftIcon={<Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
        className={`text-xs font-bold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-600 shadow-2xs cursor-pointer ${className}`}
      >
        {buttonLabel}
      </Button>

      <ShareFindingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={result as any}
      />
    </>
  );
};
