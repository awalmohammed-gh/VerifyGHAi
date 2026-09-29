import React, { useState } from 'react';
import { Send, Sparkles, ShieldAlert } from 'lucide-react';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { demoVerificationPresets } from '../../constants/verificationPresets';

export interface TextVerificationFormProps {
  onSubmit: (content: string) => void;
  isLoading?: boolean;
}

export const TextVerificationForm: React.FC<TextVerificationFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please paste or write the text you would like to verify.');
      return;
    }
    if (content.trim().length < 15) {
      setError('Please provide at least 15 characters for a meaningful assessment.');
      return;
    }
    setError('');
    onSubmit(content.trim());
  };

  const handlePresetSelect = (text: string) => {
    setContent(text);
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
          .filter((p) => p.type === 'TEXT')
          .map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(preset.content)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors text-xs font-medium cursor-pointer"
            >
              {preset.title}
            </button>
          ))}
      </div>

      <Textarea
        label="Content"
        placeholder="Paste the text, broadcast message, or claim you want to verify..."
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (error) setError('');
        }}
        rows={6}
        maxLength={5000}
        error={error}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          Do not submit private passwords, bank credentials, or confidential personal data.
        </p>

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          rightIcon={<Send className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Analyze Content
        </Button>
      </div>
    </form>
  );
};
