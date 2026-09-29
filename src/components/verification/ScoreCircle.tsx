import React from 'react';
import { Classification } from '../../types';
import { ConfidenceScoreGauge, ConfidenceThresholdBadge, getCredibilityThreshold } from './ConfidenceScoreGauge';
import { ClassificationBadge } from './ClassificationBadge';

export interface ScoreCircleProps {
  score: number; // 0 - 100
  classification: Classification;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showThresholdBadge?: boolean;
}

export const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  classification,
  confidence,
  size = 'lg',
  showThresholdBadge = true,
}) => {
  const threshold = getCredibilityThreshold(score, classification);

  const radius = size === 'xl' ? 56 : size === 'lg' ? 46 : size === 'md' ? 36 : 24;
  const strokeWidth = size === 'xl' ? 8.5 : size === 'lg' ? 8 : size === 'md' ? 6 : 4;
  const dimension = (radius + strokeWidth) * 2;
  const circumference = 2 * Math.PI * radius;
  const cleanScore = Math.max(0, Math.min(100, Math.round(score)));
  const strokeDashoffset = circumference - (cleanScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <div className="relative flex items-center justify-center">
        <svg
          width={dimension}
          height={dimension}
          className="transform -rotate-90 transition-all duration-700 ease-out"
        >
          {/* Background circle track */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={threshold.track}
            strokeWidth={strokeWidth}
            fill="transparent"
            className="dark:opacity-30"
          />
          {/* Progress circle dynamically styled by threshold (Green / Yellow / Red) */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={threshold.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Inner number readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline justify-center">
            <span
              className={`font-black tracking-tight font-mono ${
                size === 'xl'
                  ? 'text-4xl'
                  : size === 'lg'
                  ? 'text-3xl'
                  : size === 'md'
                  ? 'text-xl'
                  : 'text-sm'
              } ${threshold.textClass}`}
            >
              {cleanScore}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">/100</span>
          </div>
          {(size === 'lg' || size === 'xl') && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
              Credibility
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <ClassificationBadge classification={classification} size={size === 'lg' || size === 'xl' ? 'md' : 'sm'} />
          {showThresholdBadge && (
            <ConfidenceThresholdBadge
              score={cleanScore}
              classification={classification}
              confidence={confidence}
              size={size === 'lg' || size === 'xl' ? 'md' : 'sm'}
            />
          )}
        </div>
        {confidence !== undefined && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            AI Confidence: <span className="font-bold text-slate-800 dark:text-slate-200">{confidence}%</span>
          </p>
        )}
      </div>
    </div>
  );
};

