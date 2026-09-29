import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import { verificationService } from '../../services/verificationService';
import { VerificationResult } from '../../types';
import { ResultSummary } from '../../components/verification/ResultSummary';
import { VerificationResultSkeleton } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';

export const HistoryDetailPage: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const targetId = searchParams.get('id') || paramId || '';
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVerificationRecord = async () => {
      if (!targetId) {
        setIsLoading(false);
        setError('Unable to load verification details. The record could not be found.');
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const res = await verificationService.getVerificationResultById(targetId);
        if (res && res.id) {
          setResult(res);
        } else {
          setError('Unable to load verification details. The record could not be found.');
        }
      } catch (err: any) {
        console.error('[HistoryDetailPage] Load error:', err);
        setError('Unable to load verification details. The record could not be found.');
      } finally {
        setIsLoading(false);
      }
    };

    loadVerificationRecord();
  }, [targetId]);

  if (isLoading) {
    return <VerificationResultSkeleton title="Retrieving verification report from database..." />;
  }

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
