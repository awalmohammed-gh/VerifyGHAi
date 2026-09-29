import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  FileText,
  X,
  Sparkles,
  Send,
  ShieldAlert,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { Button } from '../common/Button';
import { demoVerificationPresets } from '../../constants/verificationPresets';
import {
  validateUploadFile,
  MAX_UPLOAD_SIZE_MB,
  formatFileSize,
} from '../../constants/uploadConfig';

export interface ScreenshotUploaderProps {
  onSubmit: (fileInfo: { name: string; preview: string; textContent: string; file?: File }) => void;
  isLoading?: boolean;
}

export const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    sizeFormatted: string;
    preview: string;
    extractedText: string;
    isPdf: boolean;
    file?: File;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // Immediate client-side validation against environment synchronized MAX_UPLOAD_SIZE
    const validation = validateUploadFile(file);

    if (!validation.isValid) {
      setError(validation.error || 'Invalid file uploaded.');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const isPdf = validation.isPdf || false;
    const sizeFormatted = validation.sizeFormatted || formatFileSize(file.size);

    if (isPdf) {
      setSelectedFile({
        name: file.name,
        sizeFormatted,
        preview: '',
        extractedText: `Uploaded PDF Document: "${file.name}" (${sizeFormatted}). Full text and tabular contents ready for fact-checking extraction.`,
        isPdf: true,
        file,
      });
      setError('');
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedFile({
          name: file.name,
          sizeFormatted,
          preview: reader.result as string,
          extractedText: `Uploaded Screenshot / Graphic: "${file.name}" (${sizeFormatted}). Multimodal visual and OCR claims ready for deep verification.`,
          isPdf: false,
          file,
        });
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePresetSelect = (preset: typeof demoVerificationPresets[0]) => {
    setSelectedFile({
      name: preset.imageName || 'sample-flyer.png',
      sizeFormatted: '1.4 MB',
      preview:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="%23f1f5f9"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23475569">Sample Image: ' +
        encodeURIComponent(preset.title) +
        '</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="11" fill="%2394a3b8">Simulated OCR Extracted Text</text></svg>',
      extractedText: preset.content,
      isPdf: false,
    });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select or drop a screenshot or PDF document to analyze.');
      return;
    }
    onSubmit({
      name: selectedFile.name,
      preview: selectedFile.preview,
      textContent: selectedFile.extractedText,
      file: selectedFile.file,
    });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quick Demo Presets */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Quick Demo Sample:
        </span>
        {demoVerificationPresets
          .filter((p) => p.type === 'SCREENSHOT')
          .map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition-colors text-xs font-medium cursor-pointer"
            >
              {preset.title}
            </button>
          ))}
      </div>

      {!selectedFile ? (
        <div
          id="upload-dropzone-container"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <input
            type="file"
            id="file-upload-input"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 text-center">
            Drag & drop screenshot or document, or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
          </h5>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Supports PNG, JPG, WebP images & PDF documents (Up to {MAX_UPLOAD_SIZE_MB}MB)
          </p>
        </div>
      ) : (
        <div
          id="selected-file-preview-card"
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-center gap-3.5 overflow-hidden">
            <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {selectedFile.isPdf ? (
                <FileText className="w-7 h-7 text-red-500 dark:text-red-400" />
              ) : selectedFile.preview.startsWith('data:') ? (
                <img
                  src={selectedFile.preview}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {selectedFile.name}
                </p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex-shrink-0">
                  {selectedFile.sizeFormatted}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Ready for factual evaluation and claims extraction</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            id="remove-selected-file-button"
            onClick={handleRemoveFile}
            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer flex-shrink-0"
            aria-label="Remove uploaded file"
            title="Remove uploaded file"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Immediate Inline Alert for File Size or Format Validation Failures */}
      {error && (
        <div
          id="upload-error-inline-alert"
          className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Upload Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          Multimodal optical layout and contextual assertions are verified via regional truth registries.
        </p>

        <Button
          type="submit"
          id="submit-screenshot-verification-btn"
          size="lg"
          disabled={!selectedFile}
          isLoading={isLoading}
          rightIcon={<Send className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          {selectedFile?.isPdf ? 'Analyze Document' : 'Analyze Screenshot'}
        </Button>
      </div>
    </form>
  );
};

export default ScreenshotUploader;
