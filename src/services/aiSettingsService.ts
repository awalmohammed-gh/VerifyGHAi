import { useState, useEffect } from 'react';

export type VerificationMode = 'STRICT' | 'BALANCED' | 'LENIENT' | 'CUSTOM';

export interface AiVerificationSettings {
  confidenceThreshold: number; // Decimal (0.50 to 0.95)
  mode: VerificationMode;
  requireHumanReviewBelowThreshold: boolean;
  enableDeepWebGrounding: boolean;
  strictDisinformationAlerts: boolean;
}

const STORAGE_KEY = 'verifai_ai_confidence_threshold';
const SETTINGS_STORAGE_KEY = 'verifai_ai_engine_settings';
const EVENT_NAME = 'verifai_ai_settings_updated';

export const THRESHOLD_PRESETS = {
  STRICT: 0.90,   // 90%
  BALANCED: 0.75, // 75% default
  LENIENT: 0.60,  // 60%
};

const DEFAULT_SETTINGS: AiVerificationSettings = {
  confidenceThreshold: 0.75,
  mode: 'BALANCED',
  requireHumanReviewBelowThreshold: true,
  enableDeepWebGrounding: true,
  strictDisinformationAlerts: true,
};

export const aiSettingsService = {
  /**
   * Get current confidence threshold as a decimal (e.g. 0.75)
   */
  getConfidenceThreshold(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= 0.5 && val <= 0.99) {
          return val;
        }
      }
      return DEFAULT_SETTINGS.confidenceThreshold;
    } catch (e) {
      return DEFAULT_SETTINGS.confidenceThreshold;
    }
  },

  /**
   * Get current settings object
   */
  getSettings(): AiVerificationSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const threshold = aiSettingsService.getConfidenceThreshold();
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          confidenceThreshold: threshold,
          mode: aiSettingsService.getVerificationMode(threshold),
        };
      }
      return {
        ...DEFAULT_SETTINGS,
        confidenceThreshold: threshold,
        mode: aiSettingsService.getVerificationMode(threshold),
      };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Set new confidence threshold (accepts decimal e.g. 0.75 or percentage e.g. 75)
   */
  setConfidenceThreshold(value: number): number {
    let normalized = value > 1 ? value / 100 : value;
    normalized = Math.min(0.95, Math.max(0.50, Number(normalized.toFixed(2))));

    try {
      localStorage.setItem(STORAGE_KEY, normalized.toString());
      const currentSettings = aiSettingsService.getSettings();
      const updatedSettings: AiVerificationSettings = {
        ...currentSettings,
        confidenceThreshold: normalized,
        mode: aiSettingsService.getVerificationMode(normalized),
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      aiSettingsService.notifyChange();
    } catch (e) {
      console.warn('[aiSettingsService] Failed to persist threshold:', e);
    }
    return normalized;
  },

  /**
   * Determine verification mode based on threshold value
   */
  getVerificationMode(threshold?: number): VerificationMode {
    const t = threshold ?? aiSettingsService.getConfidenceThreshold();
    if (Math.abs(t - THRESHOLD_PRESETS.STRICT) < 0.03 || t >= 0.88) {
      return 'STRICT';
    }
    if (Math.abs(t - THRESHOLD_PRESETS.BALANCED) < 0.04 || (t >= 0.70 && t < 0.88)) {
      return 'BALANCED';
    }
    if (Math.abs(t - THRESHOLD_PRESETS.LENIENT) < 0.04 || (t >= 0.50 && t < 0.70)) {
      return 'LENIENT';
    }
    return 'CUSTOM';
  },

  /**
   * Set threshold by mode preset
   */
  setVerificationMode(mode: 'STRICT' | 'BALANCED' | 'LENIENT'): number {
    const target = THRESHOLD_PRESETS[mode] || 0.75;
    return aiSettingsService.setConfidenceThreshold(target);
  },

  /**
   * Reset to balanced default
   */
  resetDefault(): number {
    return aiSettingsService.setConfidenceThreshold(DEFAULT_SETTINGS.confidenceThreshold);
  },

  notifyChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  },

  onSettingsUpdated(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  },
};

/**
 * Custom React Hook for real-time reactivity with the AI Confidence Threshold
 */
export function useAiConfidenceThreshold() {
  const [threshold, setThresholdState] = useState<number>(() =>
    aiSettingsService.getConfidenceThreshold()
  );
  const [mode, setModeState] = useState<VerificationMode>(() =>
    aiSettingsService.getVerificationMode(threshold)
  );

  useEffect(() => {
    const sync = () => {
      const current = aiSettingsService.getConfidenceThreshold();
      setThresholdState(current);
      setModeState(aiSettingsService.getVerificationMode(current));
    };

    const unsubscribe = aiSettingsService.onSettingsUpdated(sync);
    sync();
    return unsubscribe;
  }, []);

  const setThreshold = (value: number) => {
    const updated = aiSettingsService.setConfidenceThreshold(value);
    setThresholdState(updated);
    setModeState(aiSettingsService.getVerificationMode(updated));
  };

  const setMode = (newMode: 'STRICT' | 'BALANCED' | 'LENIENT') => {
    const updated = aiSettingsService.setVerificationMode(newMode);
    setThresholdState(updated);
    setModeState(newMode);
  };

  const resetDefault = () => {
    const updated = aiSettingsService.resetDefault();
    setThresholdState(updated);
    setModeState('BALANCED');
  };

  const percentage = Math.round(threshold * 100);

  return {
    threshold,
    percentage,
    mode,
    setThreshold,
    setMode,
    resetDefault,
    isStrict: mode === 'STRICT',
    isBalanced: mode === 'BALANCED',
    isLenient: mode === 'LENIENT',
  };
}
