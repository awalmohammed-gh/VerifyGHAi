import React from 'react';
import { AlignLeft, Link2, Image } from 'lucide-react';
import { ContentType } from '../../types';

export interface VerificationTypeSelectorProps {
  selectedType: ContentType;
  onChange: (type: ContentType) => void;
  className?: string;
}

export const VerificationTypeSelector: React.FC<VerificationTypeSelectorProps> = ({
  selectedType,
  onChange,
  className = '',
}) => {
  const options: { type: ContentType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      type: 'TEXT',
      label: 'Text Snippet',
      icon: <AlignLeft className="w-4 h-4" />,
      desc: 'Paste articles, messaging forwards, or claims',
    },
    {
      type: 'ARTICLE_URL',
      label: 'Article URL',
      icon: <Link2 className="w-4 h-4" />,
      desc: 'Analyze published online web articles & domains',
    },
    {
      type: 'SCREENSHOT',
      label: 'Screenshot / Image',
      icon: <Image className="w-4 h-4" />,
      desc: 'Upload visual social graphics or flyers',
    },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 ${className}`}>
      {options.map((opt) => {
        const isSelected = selectedType === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => onChange(opt.type)}
            className={`flex flex-col sm:items-start text-left p-3.5 rounded-xl transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`p-1.5 rounded-lg ${
                  isSelected ? 'bg-blue-50 text-blue-600' : 'bg-slate-200/70 text-slate-500'
                }`}
              >
                {opt.icon}
              </span>
              <span className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                {opt.label}
              </span>
            </div>
            <span className="text-xs text-slate-500 leading-snug hidden sm:block">
              {opt.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
};
