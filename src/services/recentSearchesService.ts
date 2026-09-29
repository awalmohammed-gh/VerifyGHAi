import { Submission } from '../types';
import { verificationService } from './verificationService';

export interface RecentSearchQuery {
  id: string;
  query: string;
  timestamp: string;
  category?: string;
  type?: 'search' | 'verification';
  targetResultId?: string;
  classification?: string;
  score?: number;
}

const STORAGE_KEY_PREFIX = 'verifai_recent_searches_';

export const recentSearchesService = {
  getStorageKey: (userId?: string): string => {
    return `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
  },

  getRecentSearches: (userId?: string, limit: number = 8): RecentSearchQuery[] => {
    try {
      const key = recentSearchesService.getStorageKey(userId);
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed: RecentSearchQuery[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(0, limit);
    } catch (err) {
      console.warn('[recentSearchesService] Failed to read recent searches:', err);
      return [];
    }
  },

  addSearchQuery: (
    query: string,
    options?: {
      category?: string;
      targetResultId?: string;
      classification?: string;
      score?: number;
      type?: 'search' | 'verification';
      userId?: string;
    }
  ): RecentSearchQuery[] => {
    const trimmed = query.trim();
    if (!trimmed) return recentSearchesService.getRecentSearches(options?.userId);

    try {
      const key = recentSearchesService.getStorageKey(options?.userId);
      const existing = recentSearchesService.getRecentSearches(options?.userId, 20);

      // Filter out duplicates with the same query or same target result
      const filtered = existing.filter(
        (item) =>
          item.query.toLowerCase() !== trimmed.toLowerCase() &&
          (!options?.targetResultId || item.targetResultId !== options.targetResultId)
      );

      const newItem: RecentSearchQuery = {
        id: `srch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        query: trimmed,
        timestamp: new Date().toISOString(),
        category: options?.category,
        type: options?.type || 'search',
        targetResultId: options?.targetResultId,
        classification: options?.classification,
        score: options?.score,
      };

      const updated = [newItem, ...filtered].slice(0, 15);
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('[recentSearchesService] Failed to save search query:', err);
      return [];
    }
  },

  removeSearchQuery: (id: string, userId?: string): RecentSearchQuery[] => {
    try {
      const key = recentSearchesService.getStorageKey(userId);
      const existing = recentSearchesService.getRecentSearches(userId, 20);
      const updated = existing.filter((item) => item.id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('[recentSearchesService] Failed to remove search item:', err);
      return [];
    }
  },

  clearRecentSearches: (userId?: string): void => {
    try {
      const key = recentSearchesService.getStorageKey(userId);
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('[recentSearchesService] Failed to clear searches:', err);
    }
  },

  /**
   * Fetches recent verification results for quick preview & filter
   */
  getRecentVerifications: async (userId?: string, limit = 6): Promise<Submission[]> => {
    try {
      const submissions = await verificationService.getUserSubmissions(userId);
      return submissions.slice(0, limit);
    } catch (err) {
      console.warn('[recentSearchesService] Failed to fetch submissions:', err);
      return [];
    }
  },
};
