import { useState, useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext.js';
import { useLoading } from '../context/LoadingContext.js';
import {
  aiClientService,
  AIGenerateRequestOptions,
  AIGenerateResponseData,
} from '../services/aiClientService.js';

export interface UseAIGenerationReturn {
  generate: (
    options: AIGenerateRequestOptions,
    customMessages?: {
      startTitle?: string;
      startMessage?: string;
      successTitle?: string;
      successMessage?: string;
    }
  ) => Promise<AIGenerateResponseData | null>;
  generateStream: (
    options: AIGenerateRequestOptions,
    callbacks?: {
      onChunk?: (chunk: string, accumulatedText: string) => void;
      onComplete?: (totalText: string) => void;
      onError?: (error: Error) => void;
    },
    customMessages?: {
      startTitle?: string;
      startMessage?: string;
      successTitle?: string;
      successMessage?: string;
    }
  ) => Promise<void>;
  cancelStream: () => void;
  isGenerating: boolean;
  generatedText: string;
  responseData: AIGenerateResponseData | null;
  error: string | null;
  reset: () => void;
}

export function useAIGeneration(): UseAIGenerationReturn {
  const { toast } = useToast();
  const { startLoading, updateLoading, stopLoading } = useLoading();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [responseData, setResponseData] = useState<AIGenerateResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortStreamRef = useRef<(() => void) | null>(null);
  const activeTaskIdRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setGeneratedText('');
    setResponseData(null);
    setError(null);
    if (activeTaskIdRef.current) {
      stopLoading(activeTaskIdRef.current);
      activeTaskIdRef.current = null;
    }
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
    }
  }, [stopLoading]);

  const cancelStream = useCallback(() => {
    if (activeTaskIdRef.current) {
      stopLoading(activeTaskIdRef.current);
      activeTaskIdRef.current = null;
    }
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
      setIsGenerating(false);
      toast.info('AI Generation Cancelled', 'The generation stream was halted.');
    }
  }, [toast, stopLoading]);

  /**
   * Synchronous Generation with ToastContext and LoadingContext feedback
   */
  const generate = useCallback(
    async (
      options: AIGenerateRequestOptions,
      customMessages?: {
        startTitle?: string;
        startMessage?: string;
        successTitle?: string;
        successMessage?: string;
      }
    ): Promise<AIGenerateResponseData | null> => {
      setIsGenerating(true);
      setError(null);
      setGeneratedText('');
      setResponseData(null);

      const startTitle = customMessages?.startTitle || 'Fact-Checking Started';
      const startMessage =
        customMessages?.startMessage ||
        'Cross-referencing claim with verified news wires and official registries...';

      const taskId = startLoading({
        title: startTitle,
        message: startMessage,
        type: 'AI_GENERATION',
        step: 'Querying Deep Search & Grounding Engine...',
        progress: 30,
        cancelable: true,
        onCancel: () => cancelStream(),
      });
      activeTaskIdRef.current = taskId;

      // Immediate User Feedback: Generation Initiated
      toast.info(startTitle, startMessage);

      try {
        updateLoading(taskId, {
          step: 'Synthesizing evidence and generating analysis...',
          progress: 75,
        });

        const data = await aiClientService.generateContent(options);
        setResponseData(data);
        setGeneratedText(data.text);

        const successTitle = customMessages?.successTitle || 'Verification Complete';
        const successMessage =
          customMessages?.successMessage ||
          `Content successfully verified and cross-referenced with accredited sources.`;

        // Immediate User Feedback: Generation Complete
        toast.success(successTitle, successMessage);

        // Feedback if confidence evaluation fails threshold
        if (data.confidenceEvaluation && !data.confidenceEvaluation.meetsThreshold) {
          toast.warning(
            'Confidence Advisory',
            data.confidenceEvaluation.warning ||
              'Confidence score is below target threshold. Additional verification recommended.'
          );
        }

        return data;
      } catch (err: any) {
        console.error('[useAIGeneration] Error:', err);
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          'An unexpected error occurred while communicating with the AI service.';

        setError(errorMessage);

        // Immediate User Feedback: Error Handling
        toast.error('AI Generation Failed', errorMessage);
        return null;
      } finally {
        if (activeTaskIdRef.current) {
          stopLoading(activeTaskIdRef.current);
          activeTaskIdRef.current = null;
        }
        setIsGenerating(false);
      }
    },
    [toast, startLoading, updateLoading, stopLoading, cancelStream]
  );

  /**
   * Streaming Generation with ToastContext and LoadingContext feedback
   */
  const generateStream = useCallback(
    async (
      options: AIGenerateRequestOptions,
      callbacks?: {
        onChunk?: (chunk: string, accumulatedText: string) => void;
        onComplete?: (totalText: string) => void;
        onError?: (error: Error) => void;
      },
      customMessages?: {
        startTitle?: string;
        startMessage?: string;
        successTitle?: string;
        successMessage?: string;
      }
    ): Promise<void> => {
      setIsGenerating(true);
      setError(null);
      setGeneratedText('');
      setResponseData(null);

      const startTitle = customMessages?.startTitle || 'Investigation Started';
      const startMessage =
        customMessages?.startMessage ||
        'Cross-referencing claim with verified news wires and official registries...';

      const taskId = startLoading({
        title: startTitle,
        message: startMessage,
        type: 'AI_GENERATION',
        step: 'Streaming Live Cross-Examinations...',
        progress: 25,
        cancelable: true,
        onCancel: () => cancelStream(),
      });
      activeTaskIdRef.current = taskId;

      // Immediate User Feedback: Stream Initiated
      toast.info(startTitle, startMessage);

      const cancelFn = await aiClientService.streamContent(options, {
        onChunk: (chunk, accumulated) => {
          setGeneratedText(accumulated);
          updateLoading(taskId, {
            step: `Streaming fact analysis (${accumulated.length} characters)`,
            progress: Math.min(90, 30 + Math.floor(accumulated.length / 30)),
          });
          callbacks?.onChunk?.(chunk, accumulated);
        },
        onComplete: (total) => {
          setIsGenerating(false);
          setGeneratedText(total);
          abortStreamRef.current = null;
          if (activeTaskIdRef.current) {
            stopLoading(activeTaskIdRef.current);
            activeTaskIdRef.current = null;
          }

          const successTitle = customMessages?.successTitle || 'Verification Complete';
          const successMessage =
            customMessages?.successMessage || 'Cross-referencing and verification completed successfully.';

          // Immediate User Feedback: Stream Complete
          toast.success(successTitle, successMessage);
          callbacks?.onComplete?.(total);
        },
        onError: (err) => {
          setIsGenerating(false);
          abortStreamRef.current = null;
          if (activeTaskIdRef.current) {
            stopLoading(activeTaskIdRef.current);
            activeTaskIdRef.current = null;
          }
          const errorMessage =
            err?.message || 'An unexpected error occurred during AI streaming generation.';
          setError(errorMessage);

          // Immediate User Feedback: Stream Error
          toast.error('AI Generation Stream Error', errorMessage);
          callbacks?.onError?.(err);
        },
      });

      abortStreamRef.current = cancelFn;
    },
    [toast, startLoading, updateLoading, stopLoading, cancelStream]
  );

  return {
    generate,
    generateStream,
    cancelStream,
    isGenerating,
    generatedText,
    responseData,
    error,
    reset,
  };
}
