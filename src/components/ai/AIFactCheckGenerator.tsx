import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Globe,
  RefreshCw,
  Copy,
  Check,
  StopCircle,
} from 'lucide-react';
import { useAIGeneration } from '../../hooks/useAIGeneration.js';
import { useToast } from '../../context/ToastContext.js';
import { Button } from '../common/Button.js';
import { Textarea } from '../common/Textarea.js';

export interface AIFactCheckGeneratorProps {
  initialPrompt?: string;
  className?: string;
}

export const AIFactCheckGenerator: React.FC<AIFactCheckGeneratorProps> = ({
  initialPrompt = '',
  className = '',
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();
  const {
    generateStream,
    cancelStream,
    isGenerating,
    generatedText,
    responseData,
    error,
    reset,
  } = useAIGeneration();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.warning('Empty Prompt', 'Please enter a claim or topic to verify.');
      return;
    }

    await generateStream({
      prompt: prompt.trim(),
      searchGrounding: true,
      systemInstruction:
        'You are an expert investigative fact-checker. Your sole objective is to verify text, images, uploaded documents, or URLs for fake news, propaganda, or misinformation. You MUST search for and cross-reference claims against AT LEAST 3 distinct, reputable news outlets or official databases (e.g., Reuters, AP News, BBC, official government notices) before issuing a verdict.',
    });
  };

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    toast.success('Copied to Clipboard', 'Verification summary copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="ai-fact-check-generator"
      className={`rounded-3xl border border-blue-200/90 bg-gradient-to-b from-blue-50/50 via-white to-white p-6 sm:p-7 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Truth & Fact Verification Engine
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Automated evidence-based cross-referencing and verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            Real-Time Cross-Reference Active
          </span>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="mt-5 space-y-4">
        <div>
          <Textarea
            label="Claim or Topic for Deep Analysis"
            placeholder="e.g. 'Evaluate the claim that cocoa export tariffs in Ghana were abolished for the 2026 agricultural season.'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            maxLength={10000}
            disabled={isGenerating}
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Automated cross-referencing against verified news registries & databases</span>
          </div>

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelStream}
                leftIcon={<StopCircle className="w-3.5 h-3.5 text-rose-600" />}
                className="text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                Halt Analysis
              </Button>
            ) : (
              generatedText && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="text-xs font-semibold text-slate-500"
                >
                  Clear Output
                </Button>
              )
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isGenerating || !prompt.trim()}
              isLoading={isGenerating}
              rightIcon={<Send className="w-3.5 h-3.5" />}
              className="text-xs font-bold shadow-xs"
            >
              Verify Article
            </Button>
          </div>
        </div>
      </form>

      {/* Generated Results Card */}
      {generatedText && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Fact-Check Synthesis & Evidence Report
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              className="text-xs font-semibold text-slate-700 border-slate-200"
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans max-h-96 overflow-y-auto pr-2">
            {generatedText}
          </div>

          {/* Sources Grounding Display */}
          {responseData?.searchGrounding?.sources && responseData.searchGrounding.sources.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" /> Referenced Trusted Sources:
              </span>
              <div className="flex flex-wrap gap-2">
                {responseData.searchGrounding.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg truncate max-w-xs transition-colors hover:underline"
                  >
                    {src.title || src.uri}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
