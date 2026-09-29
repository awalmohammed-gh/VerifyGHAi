import React from 'react';
import { HelpCircle } from 'lucide-react';

export interface ExplanationSectionProps {
  explanations: string[];
  className?: string;
}

export const ExplanationSection: React.FC<ExplanationSectionProps> = ({
  explanations,
  className = '',
}) => {
  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs ${className}`}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <HelpCircle className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-bold text-slate-900">Why Did We Classify This Content This Way?</h4>
      </div>

      <div className="space-y-3">
        {explanations.map((reason, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <p className="text-xs text-slate-700 leading-relaxed pt-0.5 font-medium">{reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
