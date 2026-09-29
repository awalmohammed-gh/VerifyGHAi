import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsService } from '../../services/reportsService';
import { SavedReport, VerificationResult } from '../../types';
import { ResultSummary } from '../../components/verification/ResultSummary';
import { VerificationResultSkeleton } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<SavedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await reportsService.getReportById(id);
        setReport(data);
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (isLoading) {
    return <VerificationResultSkeleton title="Loading saved fact-checking dossier..." />;
  }

  if (!report || !report.result) {
    return (
      <div className="w-full py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Saved Report Not Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This report may have been deleted from your saved archive or the link is invalid.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/reports')}>
          Return to My Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full text-left">
      <ResultSummary
        result={report.result}
        backPath="/reports"
        backLabel="Back to My Reports"
      />
    </div>
  );
};
