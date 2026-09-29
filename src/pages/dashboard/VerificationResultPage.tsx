import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, RotateCcw, ShieldAlert, History as HistoryIcon } from 'lucide-react';
import { verificationService } from '../../services/verificationService';
import { recentScansService } from '../../services/recentScansService';
import { VerificationResult } from '../../types';
import { ResultSummary } from '../../components/verification/ResultSummary';
import { VerificationResultSkeleton } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';

export const VerificationResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Extract ID strictly from URL query parameters (?id=...) or path params (/result/:id)
  const verificationId = searchParams.get('id') || paramId || '';

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!verificationId) {
      setIsLoading(false);
      setError('Unable to load verification details. The record could not be found.');
      return;
    }

    let isMounted = true;

    const fetchVerificationDossier = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await verificationService.getVerificationResultById(verificationId);
        if (!isMounted) return;

        if (data && data.id) {
          setResult(data);
          recentScansService.addFromResult(data);
        } else {
          setError('Unable to load verification details. The record could not be found.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('[VerificationResultPage] Database fetch error:', err);
        setError('Unable to load verification details. The record could not be found.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVerificationDossier();

    return () => {
      isMounted = false;
    };
  }, [verificationId]);

  // Full-page Skeleton Loader while fetching from database
  if (isLoading) {
    return <VerificationResultSkeleton title="Retrieving verification dossier from database..." />;
  }

  // Clean Error Container when record is not found or fails
  if (error || !result) {
    return (
      <div className="w-full max-w-xl mx-auto my-12 p-8 sm:p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/50">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Record Not Found
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {error || 'Unable to load verification details. The record could not be found.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard/history')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto font-bold"
          >
            Return to History
          </Button>

          <Link to="/verify" className="w-full sm:w-auto">
            <Button
              variant="outline"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="w-full sm:w-auto font-semibold"
            >
              New Verification
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-left">
      <ResultSummary
        result={result}
        onVerifyAnother={() => navigate('/verify')}
        backPath="/dashboard/history"
        backLabel="Back to History"
      />
    </div>
  );
};
