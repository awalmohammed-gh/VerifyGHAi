import React, { useState } from 'react';
import { Send, Globe, Sparkles, ShieldAlert } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { demoVerificationPresets } from '../../constants/verificationPresets';

export interface UrlVerificationFormProps {
  onSubmit: (url: string, content: string) => void;
  isLoading?: boolean;
}

export const UrlVerificationForm: React.FC<UrlVerificationFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide a valid article or publication URL.');
      return;
    }

    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      setError('Please enter a valid website URL (e.g. https://example.com/article).');
      return;
    }

    setError('');
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const syntheticContent = `Article URL submission: ${fullUrl}. Content evaluated from domain records, editorial registry, and fact check archives.`;
    onSubmit(fullUrl, syntheticContent);
  };

  const handlePresetSelect = (presetUrl: string) => {
    setUrl(presetUrl);
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quick Test Presets */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-semibold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Quick Demo Samples:
        </span>
        {demoVerificationPresets
          .filter((p) => p.type === 'ARTICLE_URL')
          .map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(preset.url || '')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors text-xs font-medium cursor-pointer"
            >
              {preset.title}
            </button>
          ))}
      </div>

      <Input
        label="Article URL"
        placeholder="https://example.com/news/article-headline"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          if (error) setError('');
        }}
        leftIcon={<Globe className="w-4 h-4" />}
        error={error}
        helperText="We will analyze available article content, domain trust history, and source verification."
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          Supports public news outlets, blogs, academic journals, and institutional press sites.
        </p>

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          rightIcon={<Send className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Analyze Article
        </Button>
      </div>
    </form>
  );
};
