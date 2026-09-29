import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  showCharCount = true,
  maxLength = 5000,
  value,
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            {label}
          </label>
        )}
        {showCharCount && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {currentLength.toLocaleString()} {maxLength ? `/ ${maxLength.toLocaleString()}` : 'chars'}
          </span>
        )}
      </div>
      <textarea
        id={textareaId}
        value={value}
        maxLength={maxLength}
        rows={props.rows || 5}
        className={`w-full rounded-xl border bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:border-transparent resize-y leading-relaxed ${
          error
            ? 'border-red-300 dark:border-red-500/80 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/20'
            : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  );
};
