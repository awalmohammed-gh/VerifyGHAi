import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link2,
  FileText,
  FileUp,
  ClipboardPaste,
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  Upload,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';
import { useAuth } from '../../context/AuthContext';
import { verificationService } from '../../services/verificationService';
import { ContentType } from '../../types';

export interface QuickActionsBarProps {
  className?: string;
  onVerificationStarted?: () => void;
}

type QuickActionType = 'VERIFY_URL' | 'SCAN_TEXT' | 'UPLOAD_DOCUMENT' | 'PASTE_CLIPBOARD' | null;

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  className = '',
  onVerificationStarted,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startLoading, updateLoading, stopLoading } = useLoading();
  const { currentUser } = useAuth();

  const [activeModalAction, setActiveModalAction] = useState<QuickActionType>(null);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Direct Navigation or Modal open
  const handleActionClick = (action: QuickActionType) => {
    if (action === 'PASTE_CLIPBOARD') {
      handleReadClipboard();
      return;
    }
    setActiveModalAction(action);
  };

  // Clipboard auto-detection handler
  const handleReadClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        toast.info('Clipboard Access', 'Opening verification tool for direct paste.');
        navigate('/verify', { state: { initialType: 'TEXT' } });
        return;
      }

      const text = await navigator.clipboard.readText();
      if (!text || text.trim().length === 0) {
        toast.info('Clipboard Empty', 'No text found in clipboard. Please enter content to check.');
        setActiveModalAction('SCAN_TEXT');
        return;
      }

      const clean = text.trim();
      const isUrl = /^https?:\/\//i.test(clean);

      if (isUrl) {
        setUrlInput(clean);
        setActiveModalAction('VERIFY_URL');
        toast.success('URL Detected from Clipboard', 'Loaded link ready for one-click verification.');
      } else {
        setTextInput(clean);
        setActiveModalAction('SCAN_TEXT');
        toast.success('Text Detected from Clipboard', 'Loaded text snippet ready for verification.');
      }
    } catch (err) {
      toast.info('Direct Verification', 'Opening verification studio.');
      navigate('/verify', { state: { initialType: 'TEXT' } });
    }
  };

  // Execute verification directly from quick modal
  const handleExecuteQuickCheck = async (type: ContentType) => {
    const user = currentUser || {
      id: 'guest_user',
      name: 'Guest Citizen',
      email: 'guest@verifai.gh',
    };

    let contentToVerify = '';
    let targetUrl: string | undefined = undefined;
    let targetImageName: string | undefined = undefined;

    if (type === 'ARTICLE_URL') {
      if (!urlInput.trim()) {
        toast.error('Missing URL', 'Please provide a valid web article or page URL.');
        return;
      }
      targetUrl = urlInput.trim();
      contentToVerify = `URL Verification for: ${targetUrl}`;
    } else if (type === 'TEXT') {
      if (!textInput.trim()) {
        toast.error('Missing Text', 'Please enter or paste the text claim you want to verify.');
        return;
      }
      contentToVerify = textInput.trim();
    } else if (type === 'SCREENSHOT') {
      if (!uploadedFileName && !textInput.trim()) {
        toast.error('Missing File', 'Please upload a document or screenshot image to proceed.');
        return;
      }
      targetImageName = uploadedFileName || 'uploaded_document.pdf';
      contentToVerify = textInput.trim() || `Document OCR & Content Analysis for: ${targetImageName}`;
    }

    const taskId = startLoading({
      title: `Rapid Verification: ${type.replace('_', ' ')}`,
      message: 'Submitting claim to VerifAI validation pipelines...',
      type: 'VERIFICATION',
      progress: 35,
    });

    try {
      setIsSubmitting(true);
      if (onVerificationStarted) onVerificationStarted();

      updateLoading(taskId, {
        step: 'Corroborating data points...',
        progress: 75,
      });

      const result = await verificationService.verifyContent({
        userId: user.id,
        userName: user.name,
        userEmail: user.email || 'user@example.com',
        contentType: type,
        content: contentToVerify,
        url: targetUrl,
        imageName: targetImageName,
      });

      stopLoading(taskId);
      setIsSubmitting(false);
      setActiveModalAction(null);
      setUrlInput('');
      setTextInput('');
      setUploadedFileName('');

      toast.success(
        'Verification Complete',
        `Assessed as ${result.classification} with a score of ${result.score}/100.`
      );

      navigate(`/verify/result/${result.id}`, { state: { result } });
    } catch (error: any) {
      stopLoading(taskId);
      setIsSubmitting(false);
      toast.error('Verification Failed', error?.message || 'Could not complete rapid verification.');
    }
  };

  // Redirect to full verify studio with preset type
  const handleOpenFullStudio = (type: ContentType) => {
    setActiveModalAction(null);
    navigate('/verify', {
      state: {
        initialType: type,
        prefilledText: type === 'ARTICLE_URL' ? urlInput : textInput,
      },
    });
  };

  // Simulated file upload for document / screenshot
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      if (!textInput) {
        setTextInput(`[Uploaded Document: ${file.name} (${Math.round(file.size / 1024)} KB)]`);
      }
      toast.success('Document Attached', `Selected "${file.name}" for verification.`);
    }
  };

  return (
    <div
      className={`rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4 text-left ${className}`}
    >
      {/* Header with Title and Fast Workflow Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500">
              One-click tools for immediate source verification and rapid fact-checking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReadClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200/80"
            title="Paste & scan current clipboard contents"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-blue-600" />
            <span>Paste from Clipboard</span>
          </button>
        </div>
      </div>

      {/* Primary 3 Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Action 1: Verify URL */}
        <button
          type="button"
          onClick={() => handleActionClick('VERIFY_URL')}
          className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-emerald-50/40 hover:border-emerald-300 hover:shadow-xs transition-all text-left cursor-pointer relative overflow-hidden"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                Link Check
              </span>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-900 transition-colors flex items-center gap-1.5">
                Verify URL
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Analyze online articles, news publications, and domain reputation.
              </p>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-emerald-700">
            <span>Instant domain lookup</span>
            <span className="text-[10px] opacity-70">1-Click</span>
          </div>
        </button>

        {/* Action 2: Scan Text */}
        <button
          type="button"
          onClick={() => handleActionClick('SCAN_TEXT')}
          className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-blue-50/40 hover:border-blue-300 hover:shadow-xs transition-all text-left cursor-pointer relative overflow-hidden"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                Text Scan
              </span>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-900 transition-colors flex items-center gap-1.5">
                Scan Text
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Check WhatsApp forwards, quotes, social claims, and viral excerpts.
              </p>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-blue-700">
            <span>Claim & rumor analysis</span>
            <span className="text-[10px] opacity-70">1-Click</span>
          </div>
        </button>

        {/* Action 3: Upload Document */}
        <button
          type="button"
          onClick={() => handleActionClick('UPLOAD_DOCUMENT')}
          className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-purple-50/40 hover:border-purple-300 hover:shadow-xs transition-all text-left cursor-pointer relative overflow-hidden"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                Document / OCR
              </span>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-purple-900 transition-colors flex items-center gap-1.5">
                Upload Document
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-purple-600" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Inspect official press statements, PDFs, flyers, and screenshots.
              </p>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-purple-700">
            <span>OCR & visual text parsing</span>
            <span className="text-[10px] opacity-70">1-Click</span>
          </div>
        </button>
      </div>

      {/* Fast Action Interactive Modal: VERIFY URL */}
      <Modal
        isOpen={activeModalAction === 'VERIFY_URL'}
        onClose={() => {
          if (!isSubmitting) setActiveModalAction(null);
        }}
        title="Quick URL Verification"
        subtitle="Paste an article link or website domain for instantaneous fact-check assessment."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => handleOpenFullStudio('ARTICLE_URL')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Full Studio</span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="neutral"
                size="sm"
                onClick={() => setActiveModalAction(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExecuteQuickCheck('ARTICLE_URL')}
                isLoading={isSubmitting}
                disabled={!urlInput.trim() || isSubmitting}
                leftIcon={<Globe className="w-4 h-4" />}
              >
                Verify URL Now
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 py-1 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Article or Web Page URL
            </label>
            <Input
              placeholder="https://example-news.com/article/headline-report"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              leftIcon={<Globe className="w-4 h-4 text-slate-400" />}
              autoFocus
            />
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>
              The verification engine will check domain reputation, known journalistic registries, fact-checking archives, and publication credibility metrics.
            </p>
          </div>
        </div>
      </Modal>

      {/* Fast Action Interactive Modal: SCAN TEXT */}
      <Modal
        isOpen={activeModalAction === 'SCAN_TEXT'}
        onClose={() => {
          if (!isSubmitting) setActiveModalAction(null);
        }}
        title="Quick Text Claim Scanner"
        subtitle="Paste any forwarded message, quote, or claim to evaluate credibility."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => handleOpenFullStudio('TEXT')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Full Studio</span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="neutral"
                size="sm"
                onClick={() => setActiveModalAction(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExecuteQuickCheck('TEXT')}
                isLoading={isSubmitting}
                disabled={!textInput.trim() || isSubmitting}
                leftIcon={<FileText className="w-4 h-4" />}
              >
                Scan Text Now
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 py-1 text-left">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Text Claim or Statement
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {textInput.length} chars
              </span>
            </div>
            <Textarea
              placeholder="Paste WhatsApp forward, social media statement, or controversial excerpt here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              AI-assisted cross-referencing compares your claim against real-time verified registries, official announcements, and counter-evidence databases.
            </p>
          </div>
        </div>
      </Modal>

      {/* Fast Action Interactive Modal: UPLOAD DOCUMENT */}
      <Modal
        isOpen={activeModalAction === 'UPLOAD_DOCUMENT'}
        onClose={() => {
          if (!isSubmitting) setActiveModalAction(null);
        }}
        title="Quick Document & Flyer Scanner"
        subtitle="Upload press releases, official circulars, PDFs, or visual infographics for OCR analysis."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => handleOpenFullStudio('SCREENSHOT')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Full Studio</span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="neutral"
                size="sm"
                onClick={() => setActiveModalAction(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExecuteQuickCheck('SCREENSHOT')}
                isLoading={isSubmitting}
                disabled={(!uploadedFileName && !textInput.trim()) || isSubmitting}
                leftIcon={<FileUp className="w-4 h-4" />}
              >
                Analyze Document
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 py-1 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Document or Screenshot
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-purple-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                {uploadedFileName ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-purple-900">{uploadedFileName}</p>
                    <p className="text-[11px] text-slate-500">Click or drop to replace file</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      Click to choose file or drag & drop here
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports PDF, PNG, JPG, JPEG, DOCX (Max 15MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Optional Context / Notes
            </label>
            <Textarea
              placeholder="Add any specific context or question about this document..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
