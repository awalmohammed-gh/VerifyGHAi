import React from 'react';
import { Skeleton } from '../common/Skeleton';

export interface AuthFormSkeletonProps {
  variant?: 'login' | 'admin' | 'register' | 'forgot-password';
  className?: string;
}

export const AuthFormSkeleton: React.FC<AuthFormSkeletonProps> = ({
  variant = 'login',
  className = '',
}) => {
  return (
    <div className={`w-full space-y-6 animate-pulse ${className}`}>
      {/* Brand Header Skeleton */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-200" />
        {variant === 'admin' && (
          <div className="h-5 w-44 rounded-full bg-slate-200" />
        )}
        <div className="h-7 w-56 rounded-xl bg-slate-200" />
        <div className="h-4 w-72 rounded-lg bg-slate-100" />
      </div>

      {/* Auth Card Skeleton */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        {/* Submitting indicator placeholder */}
        <div className="h-1.5 w-full rounded-full bg-slate-100" />

        {/* Form Fields Skeletons */}
        <div className="space-y-4">
          {variant === 'register' && (
            <div className="space-y-1.5">
              <div className="h-3.5 w-20 rounded bg-slate-200" />
              <div className="h-11 w-full rounded-xl bg-slate-100 border border-slate-200" />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-slate-200" />
            <div className="h-11 w-full rounded-xl bg-slate-100 border border-slate-200" />
          </div>

          {variant === 'register' && (
            <div className="space-y-1.5">
              <div className="h-3.5 w-36 rounded bg-slate-200" />
              <div className="h-11 w-full rounded-xl bg-slate-100 border border-slate-200" />
            </div>
          )}

          {variant !== 'forgot-password' && (
            <div className="space-y-1.5">
              <div className="h-3.5 w-20 rounded bg-slate-200" />
              <div className="h-11 w-full rounded-xl bg-slate-100 border border-slate-200" />
            </div>
          )}

          {variant === 'register' && (
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-slate-200" />
              <div className="h-11 w-full rounded-xl bg-slate-100 border border-slate-200" />
            </div>
          )}

          {variant !== 'register' && variant !== 'forgot-password' && (
            <div className="flex items-center justify-between pt-1">
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
            </div>
          )}

          {/* Action Button Skeleton */}
          <div className="h-12 w-full rounded-xl bg-slate-200 mt-2" />
        </div>

        {/* Footer Skeleton */}
        <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
          <div className="h-4 w-48 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
};
