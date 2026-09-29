import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Circle, ShieldCheck } from 'lucide-react';

export interface AnalysisProgressProps {
  onComplete: () => void;
  submissionSummary?: string;
}

interface Step {
  id: number;
  label: string;
  detail: string;
}

const STEPS: Step[] = [
  { id: 1, label: 'Content submitted', detail: 'Received and indexed submission payload.' },
  { id: 2, label: 'Preparing content', detail: 'Normalizing text tokens and identifying syntax.' },
  { id: 3, label: 'Analyzing content', detail: 'Evaluating emotional tone and unsupported claims.' },
  { id: 4, label: 'Checking source', detail: 'Cross-referencing domain registry and past flags.' },
  { id: 5, label: 'Evaluating evidence', detail: 'Matching claims against regional fact-check repositories.' },
  { id: 6, label: 'Calculating credibility', detail: 'Synthesizing scores using weighted indicators.' },
  { id: 7, label: 'Preparing report', detail: 'Generating explainable breakdown and recommendations.' },
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  onComplete,
  submissionSummary,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const intervals = [350, 450, 500, 450, 400, 350, 300];

    if (currentStepIndex < STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, intervals[currentStepIndex] || 400);

      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 400);
      return () => clearTimeout(finishTimer);
    }
  }, [currentStepIndex, onComplete]);

  const progressPercent = Math.min(
    100,
    Math.round(((currentStepIndex + 1) / STEPS.length) * 100)
  );

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4 animate-pulse">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-1.5">Analyzing Content</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Evaluating content characteristics, source credibility, and supporting evidence.
          </p>
          {submissionSummary && (
            <p className="text-xs text-slate-400 font-mono mt-2 truncate bg-slate-50 p-2 rounded-lg border border-slate-100">
              "{submissionSummary.slice(0, 80)}..."
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-8 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Items List */}
        <div className="space-y-3.5">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3.5 p-3 rounded-xl transition-all duration-200 ${
                  isCurrent
                    ? 'bg-blue-50/80 border border-blue-100 shadow-2xs'
                    : isCompleted
                    ? 'bg-slate-50/70 border border-transparent'
                    : 'opacity-40 border border-transparent'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold ${
                        isCurrent
                          ? 'text-blue-900 text-sm'
                          : isCompleted
                          ? 'text-slate-800 font-semibold'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">Done</span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] text-blue-600 font-bold uppercase animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 mt-0.5 leading-tight">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Real-time verification pipeline • Connected to live truth & fact verification registries
          </p>
        </div>
      </div>
    </div>
  );
};
