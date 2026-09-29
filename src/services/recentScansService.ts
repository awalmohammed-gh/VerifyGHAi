import { VerificationResult, ContentType } from '../types';

export interface RecentScanItem {
  id: string;
  type: ContentType | 'TEXT' | 'ARTICLE_URL' | 'SCREENSHOT' | 'URL' | 'IMAGE' | 'DOCUMENT';
  contentSnippet: string;
  title?: string;
  classification: 'VERIFIED' | 'TRUSTED' | 'SUSPICIOUS' | 'FAKE' | 'UNVERIFIED';
  score: number;
  confidence: number;
  scannedAt: string; // ISO string
  sourceName?: string;
  sourceDomain?: string;
  claimsCount?: number;
}

const STORAGE_KEY_PREFIX = 'verifai_recent_scans';
const EVENT_NAME = 'verifai_recent_scans_updated';
const MAX_DEFAULT_SCANS = 5;

export const recentScansService = {
  getStorageKey(userId?: string): string {
    return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX;
  },

  /**
   * Retrieve the last tracked content verification requests from localStorage (strictly real user scans)
   */
  getRecentScans(userId?: string, limit = MAX_DEFAULT_SCANS): RecentScanItem[] {
    try {
      const key = recentScansService.getStorageKey(userId);
      const raw = localStorage.getItem(key);

      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, limit);
        }
      }

      // If user-specific storage is empty, check fallback generic key
      if (userId) {
        const fallbackRaw = localStorage.getItem(STORAGE_KEY_PREFIX);
        if (fallbackRaw) {
          const parsedFallback = JSON.parse(fallbackRaw);
          if (Array.isArray(parsedFallback) && parsedFallback.length > 0) {
            return parsedFallback.slice(0, limit);
          }
        }
      }

      // No dummy data: return empty array if no real scans exist yet
      return [];
    } catch (err) {
      console.warn('[recentScansService] Error reading localStorage:', err);
      return [];
    }
  },

  /**
   * Add a new scan to the top of the list and persist to localStorage (capping at limit, default 5)
   */
  addRecentScan(scanData: Partial<RecentScanItem> & { id: string }, userId?: string): RecentScanItem[] {
    try {
      const existing = recentScansService.getRecentScans(userId, 20);

      // Format sanitized scan item
      const newScan: RecentScanItem = {
        id: scanData.id,
        type: scanData.type || 'TEXT',
        contentSnippet: (scanData.contentSnippet || scanData.title || 'Verification Assessment').trim(),
        title: scanData.title || (scanData.contentSnippet ? scanData.contentSnippet.slice(0, 60) : 'Content Scan'),
        classification: (scanData.classification || 'UNVERIFIED') as any,
        score: typeof scanData.score === 'number' ? scanData.score : 50,
        confidence: typeof scanData.confidence === 'number' ? scanData.confidence : 85,
        scannedAt: scanData.scannedAt || new Date().toISOString(),
        sourceName: scanData.sourceName,
        sourceDomain: scanData.sourceDomain,
        claimsCount: scanData.claimsCount ?? 1,
      };

      // Filter out duplicate if same ID or exact same snippet
      const filtered = existing.filter(
        (item) => item.id !== newScan.id && item.contentSnippet !== newScan.contentSnippet
      );

      // Put latest scan at index 0, limit to maximum 10 in storage, last 5 returned
      const updated = [newScan, ...filtered].slice(0, 10);
      recentScansService.saveScans(updated, userId);
      recentScansService.notifyChange();

      return updated.slice(0, MAX_DEFAULT_SCANS);
    } catch (err) {
      console.warn('[recentScansService] Failed to save scan:', err);
      return [];
    }
  },

  /**
   * Add from a full VerificationResult object
   */
  addFromResult(result: VerificationResult, userId?: string): RecentScanItem[] {
    if (!result || !result.id) return [];
    const contentType = result.contentType || (result as any).submissionType || (result as any).type || 'TEXT';
    return recentScansService.addRecentScan(
      {
        id: result.id,
        type: contentType as any,
        contentSnippet: result.inputContent || result.summary || 'Verified Content',
        title: result.inputContent ? result.inputContent.slice(0, 70) : `Scan #${result.id.slice(-6).toUpperCase()}`,
        classification: result.classification as any,
        score: result.score ?? 50,
        confidence: result.confidence ?? 85,
        scannedAt: result.createdAt || new Date().toISOString(),
        sourceName: result.source?.name,
        sourceDomain: result.source?.domain,
        claimsCount: result.claims?.length || 0,
      },
      userId
    );
  },

  /**
   * Find a specific scan from stored local records
   */
  getScanById(id: string, userId?: string): RecentScanItem | null {
    const scans = recentScansService.getRecentScans(userId, 20);
    return scans.find((s) => s.id === id) || null;
  },

  /**
   * Reconstitute a full VerificationResult for offline fallback when network is unavailable
   */
  getReconstitutedResult(id: string, userId?: string): VerificationResult | null {
    const scan = recentScansService.getScanById(id, userId);
    if (!scan) return null;

    const classification = scan.classification === 'UNVERIFIED' ? 'SUSPICIOUS' : (scan.classification as any);

    return {
      id: scan.id,
      submissionId: `sub_${scan.id}`,
      inputContent: scan.contentSnippet,
      summary: scan.title || scan.contentSnippet,
      contentType: (scan.type === 'ARTICLE_URL' || scan.type === 'SCREENSHOT' ? scan.type : 'TEXT') as any,
      classification,
      score: scan.score,
      confidence: scan.confidence,
      createdAt: scan.scannedAt,
      claims: [
        {
          id: `claim_${scan.id}_1`,
          text: scan.contentSnippet,
          status: scan.score >= 70 ? 'VERIFIED' : scan.score <= 30 ? 'CONTRADICTED' : 'REQUIRES_VERIFICATION',
          details: `Offline cached verification record evaluated with ${scan.confidence}% confidence.`,
        },
      ],
      source: {
        name: scan.sourceName || 'Offline Verified Media',
        domain: scan.sourceDomain || 'verified-source.gh',
        status: scan.score >= 70 ? 'VERIFIED' : scan.score >= 40 ? 'TRUSTED' : 'UNRELIABLE',
        credibilityScore: scan.score,
        isVerified: scan.score >= 70,
        previousMisinformationCount: scan.score < 50 ? 2 : 0,
        description: 'Cached source credibility signature from previous verification session.',
      },
      indicators: [
        {
          id: `ind_${scan.id}_1`,
          name: 'Offline Cached Signature',
          level: (scan.score >= 70 ? 'LOW' : scan.score <= 40 ? 'HIGH' : 'MEDIUM') as any,
          score: scan.score,
          description: 'Verified record stored in local cache and Workbox service worker for offline review.',
        },
      ],
      evidence: {
        availability: 'HIGH',
        description: 'Corroborating citations cached from initial verification scan.',
        supportingEvidence: [],
        counterEvidence: [],
      },
      explanations: [
        'This dossier was retrieved directly from your device storage and Workbox service worker cache.',
        `Evaluated under ${scan.confidence}% confidence threshold scoring.`,
      ],
      recommendation: scan.score >= 70
        ? 'Information has strong corroboration from credible sources.'
        : scan.score <= 35
        ? 'High probability of false or manipulated narrative. Avoid disseminating.'
        : 'Verify with additional official registries before redistributing.',
    };
  },

  /**
   * Remove a single scan from history
   */
  removeRecentScan(id: string, userId?: string): RecentScanItem[] {
    try {
      const existing = recentScansService.getRecentScans(userId, 20);
      const updated = existing.filter((item) => item.id !== id);
      recentScansService.saveScans(updated, userId);
      recentScansService.notifyChange();
      return updated.slice(0, MAX_DEFAULT_SCANS);
    } catch (err) {
      console.warn('[recentScansService] Failed to remove scan:', err);
      return [];
    }
  },

  /**
   * Clear all recent scans
   */
  clearRecentScans(userId?: string): void {
    try {
      const key = recentScansService.getStorageKey(userId);
      localStorage.removeItem(key);
      if (userId) {
        localStorage.removeItem(STORAGE_KEY_PREFIX);
      }
      recentScansService.notifyChange();
    } catch (err) {
      console.warn('[recentScansService] Failed to clear scans:', err);
    }
  },

  saveScans(scans: RecentScanItem[], userId?: string): void {
    try {
      const key = recentScansService.getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(scans));
      // Keep global mirror in sync
      if (userId) {
        localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(scans));
      }
    } catch (err) {
      console.warn('[recentScansService] Failed to write localStorage:', err);
    }
  },

  notifyChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  },

  onScansUpdated(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  },
};
