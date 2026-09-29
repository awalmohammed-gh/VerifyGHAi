import { apiClient } from '../services/api';
import { VerificationResult, Submission, VerificationSource } from '../types';
import { mapBackendVerificationToSubmission, mapBackendVerificationToResult } from '../services/verificationService';

export interface CreateVerificationInput {
  text?: string;
  url?: string;
  type?: 'TEXT' | 'ARTICLE_URL' | 'SCREENSHOT';
  image?: File | Blob;
  imageBase64?: string;
  imageName?: string;
}

export const verificationApi = {
  /**
   * Submit content for AI verification
   */
  createVerification: async (input: CreateVerificationInput): Promise<VerificationResult> => {
    let response;
    if (input.image) {
      const formData = new FormData();
      formData.append('image', input.image);
      if (input.text) formData.append('text', input.text);
      if (input.type) formData.append('type', input.type);
      response = await apiClient.post('/verifications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      response = await apiClient.post('/verifications', {
        text: input.text,
        url: input.url,
        type: input.type || (input.url ? 'ARTICLE_URL' : 'TEXT'),
        imageBase64: input.imageBase64,
        imageName: input.imageName,
      });
    }
    const backendData = response.data?.data?.verification || response.data?.verification || response.data?.data || response.data;
    return mapBackendVerificationToResult(backendData);
  },

  /**
   * Fetch authenticated user's verification history
   */
  getUserVerifications: async (params?: { page?: number; limit?: number; search?: string }): Promise<Submission[]> => {
    const response = await apiClient.get('/verifications/me', { params }).catch(async () => {
      return apiClient.get('/verifications', { params });
    });
    const resData = response.data?.data || response.data;
    const list = resData.verifications || resData.items || (Array.isArray(resData) ? resData : []);
    return list.map(mapBackendVerificationToSubmission);
  },

  /**
   * Fetch single verification result by ID
   */
  getVerificationById: async (id: string): Promise<VerificationResult | null> => {
    const response = await apiClient.get(`/verifications/${id}`);
    const resData = response.data?.data?.verification || response.data?.verification || response.data?.data || response.data;
    if (!resData) return null;
    return mapBackendVerificationToResult(resData);
  },

  /**
   * Delete verification entry
   */
  deleteVerification: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/verifications/${id}`);
    return true;
  },

  /**
   * Cross-reference claims against trusted sources
   */
  searchVerificationSources: async (claim: string, domain?: string): Promise<VerificationSource[]> => {
    const response = await apiClient.post('/verifications/search-sources', { claim, domain });
    const resData = response.data?.data || response.data;
    return resData.sources || (Array.isArray(resData) ? resData : []);
  },

  /**
   * Fetch comments for verification
   */
  getComments: async (verificationId: string) => {
    const response = await apiClient.get(`/verifications/${verificationId}/comments`);
    const resData = response.data?.data || response.data;
    return resData.comments || (Array.isArray(resData) ? resData : []);
  },

  /**
   * Add comment to verification
   */
  addComment: async (verificationId: string, payload: any) => {
    const response = await apiClient.post(`/verifications/${verificationId}/comments`, payload);
    const resData = response.data?.data || response.data;
    return resData.comment || resData;
  },

  /**
   * Toggle comment like
   */
  toggleCommentLike: async (verificationId: string, commentId: string, userId?: string) => {
    const response = await apiClient.post(`/verifications/${verificationId}/comments/${commentId}/like`, { userId });
    const resData = response.data?.data || response.data;
    return resData.comment || resData;
  },
};
