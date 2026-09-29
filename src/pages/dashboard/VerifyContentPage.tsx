import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles, HelpCircle, Bot, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';
import { verificationService } from '../../services/verificationService';
import { recentSearchesService } from '../../services/recentSearchesService';
import { recentScansService } from '../../services/recentScansService';
import { aiSettingsService } from '../../services/aiSettingsService';
import { ContentType, VerificationResult } from '../../types';
import { VerificationTypeSelector } from '../../components/verification/VerificationTypeSelector';
import { TextVerificationForm } from '../../components/verification/TextVerificationForm';
import { UrlVerificationForm } from '../../components/verification/UrlVerificationForm';
import { ScreenshotUploader } from '../../components/verification/ScreenshotUploader';
import { AnalysisProgress } from '../../components/verification/AnalysisProgress';
import { AIFactCheckGenerator } from '../../components/ai/AIFactCheckGenerator';
import { AiConfidenceThresholdSlider } from '../../components/settings/AiConfidenceThresholdSlider';

export const VerifyContentPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<ContentType>('TEXT');
  const [activeTab, setActiveTab] = useState<'STANDARD' | 'AI_ASSISTANT'>('STANDARD');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [createdResult, setCreatedResult] = useState<VerificationResult | null>(null);
  const [currentSubmissionSummary, setCurrentSubmissionSummary] = useState('');

  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { startLoading, updateLoading, stopLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as { prefilledText?: string; initialType?: string } | null;
  const prefilled = locationState?.prefilledText;

  useEffect(() => {
    if (locationState?.initialType) {
      const typeStr = locationState.initialType.toUpperCase();
      if (typeStr === 'TEXT' || typeStr === 'SCAN_TEXT') {
        setSelectedType('TEXT');
      } else if (typeStr === 'ARTICLE_URL' || typeStr === 'URL' || typeStr === 'VERIFY_URL') {
        setSelectedType('ARTICLE_URL');
      } else if (typeStr === 'SCREENSHOT' || typeStr === 'DOCUMENT' || typeStr === 'UPLOAD_DOCUMENT') {
        setSelectedType('SCREENSHOT');
      }
    }
  }, [locationState]);

  const handleStartAnalysis = async (params: {
    contentType: ContentType;
    content: string;
    url?: string;
    imageName?: string;
    imageFile?: File;
  }) => {
    const user = currentUser || {
      id: 'guest_user',
      name: 'Guest Citizen',
      email: 'guest@verifai.gh',
    };

    setCurrentSubmissionSummary(params.content || params.url || params.imageName || 'Content Verification');
    setIsAnalyzing(true);
    setCreatedResult(null);

    const taskId = startLoading({
      title: `Fact-Checking ${params.contentType.toLowerCase()}`,
      message: 'Cross-referencing claims against regional & statutory registries...',
      type: 'VERIFICATION',
      step: 'Step 1/3: Ingesting & Segmenting Claim Content',
      progress: 20,
    });

    // Immediate User Feedback via ToastContext: Verification/AI Generation Initiated
    toast.info(
      'AI Analysis Started',
      `Evaluating ${params.contentType.toLowerCase()} submission against regional verification registries...`
    );

    try {
      updateLoading(taskId, {
        step: 'Step 2/3: Corroborating with Verified Sources',
        progress: 60,
      });

      const activeThreshold = aiSettingsService.getConfidenceThreshold();

      const result = await verificationService.verifyContent({
        userId: user.id,
        userName: user.name,
        userEmail: user.email || 'user@example.com',
        contentType: params.contentType,
        content: params.content,
        url: params.url,
        imageName: params.imageName,
        imageFile: params.imageFile,
        confidenceThreshold: activeThreshold,
      });

      if (!result) {
        throw new Error('No assessment data was returned by the verification API.');
      }

      updateLoading(taskId, {
        step: 'Step 3/3: Synthesizing Evidentiary Verdict',
        progress: 95,
      });

      // Record in recent searches for fast revisit
      const queryLabel = params.url || params.content.slice(0, 70) || params.imageName || 'Verification Request';
      recentSearchesService.addSearchQuery(queryLabel, {
        userId: user.id,
        targetResultId: result.id,
        classification: result.classification,
        score: result.score,
        type: 'verification',
      });

      // Persist in Recent Scans (last 5 scans in localStorage)
      recentScansService.addFromResult(result, user.id);

      setCreatedResult(result);
      stopLoading(taskId);
    } catch (err: any) {
      stopLoading(taskId);
      const errorMessage =
        err?.message || 'An unexpected error occurred while communicating with the verification service.';
      toast.error('Verification API Error', errorMessage);
      setIsAnalyzing(false);
    }
  };

  const handleAnalysisCompleted = () => {
    if (createdResult) {
      // Immediate User Feedback via ToastContext: Verification/AI Analysis Completed
      toast.success(
        'Verification Analysis Complete',
        `Evaluated as ${createdResult.classification} (Credibility: ${createdResult.score}/100). Full evidence breakdown ready.`
      );
      navigate(`/verify/result/${createdResult.id}`, {
        state: { result: createdResult },
      });
    } else {
      // If the backend API call is still completing, keep progress indicator or give user gentle guidance
      const fallbackTimer = setTimeout(() => {
        if (createdResult) {
          navigate(`/verify/result/${(createdResult as any).id}`, {
            state: { result: createdResult },
          });
        } else {
          setIsAnalyzing(false);
          toast.info('Verification Submitted', 'Your verification assessment has been queued and is processing.');
        }
      }, 1200);
      return () => clearTimeout(fallbackTimer);
    }
  };

  if (isAnalyzing) {
    return (
      <AnalysisProgress
        onComplete={handleAnalysisCompleted}
        submissionSummary={currentSubmissionSummary}
      />
    );
  }

  return (
    <div className="w-full space-y-6 text-left">
      {/* Tab Switcher: Standard Form vs AI Generator */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('STANDARD')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'STANDARD'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Standard Verification
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AI_ASSISTANT')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'AI_ASSISTANT'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          Automated Fact-Checker
        </button>
      </div>

      {activeTab === 'AI_ASSISTANT' ? (
        <AIFactCheckGenerator initialPrompt={prefilled || ''} />
      ) : (
        /* Header Banner & Standard Form */
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Verify Information</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Submit claims, web publications, or flyer screenshots to evaluate credibility.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 self-start sm:self-auto">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>AI Evidence Engine v2.4</span>
            </div>
          </div>

          {/* Input Mode Selector */}
          <div className="py-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5">
                Select Input Format:
              </label>
              <VerificationTypeSelector
                selectedType={selectedType}
                onChange={(type) => setSelectedType(type)}
              />
            </div>

            {/* Dynamic AI Confidence & Verification Mode Setting */}
            <AiConfidenceThresholdSlider variant="compact" />
          </div>

          {/* Active Verification Form */}
          <div className="pt-2">
            {selectedType === 'TEXT' && (
              <TextVerificationForm
                onSubmit={(content) =>
                  handleStartAnalysis({
                    contentType: 'TEXT',
                    content,
                  })
                }
              />
            )}

            {selectedType === 'ARTICLE_URL' && (
              <UrlVerificationForm
                onSubmit={(url, content) =>
                  handleStartAnalysis({
                    contentType: 'ARTICLE_URL',
                    content,
                    url,
                  })
                }
              />
            )}

            {selectedType === 'SCREENSHOT' && (
              <ScreenshotUploader
                onSubmit={({ name, textContent, file }) =>
                  handleStartAnalysis({
                    contentType: 'SCREENSHOT',
                    content: textContent,
                    imageName: name,
                    imageFile: file,
                  })
                }
              />
            )}
          </div>
        </div>
      )}

      {/* Media Literacy / How scoring works accordion/card */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 text-xs text-slate-600 flex items-start gap-3.5">
        <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900">How is this content evaluated?</h4>
          <p className="leading-relaxed">
            Our engine cross-checks historical domain credibility, linguistic tone indicators, and
            factual databases. Results include a 0–100 credibility index, source breakdown, and
            recommendations on whether the content is safe to share.
          </p>
        </div>
      </div>
    </div>
  );
};
