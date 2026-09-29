import { apiClient } from './api';
import { VerificationComment, CommentTag } from '../types/verification';

export interface CreateCommentPayload {
  verificationId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  avatarUrl?: string;
  content: string;
  tag?: CommentTag;
  sourceUrl?: string;
}

export interface CreateReplyPayload {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  content: string;
}

export const commentService = {
  /**
   * Fetch all comments for a verification ID
   */
  async getComments(verificationId: string): Promise<VerificationComment[]> {
    if (!verificationId) return [];
    try {
      const response = await apiClient.get(`/verifications/${verificationId}/comments`);
      const data = response.data?.data || response.data;
      return data.comments || (Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('[CommentService] Error fetching comments:', err);
      return [];
    }
  },

  /**
   * Post a new comment / context note to verification discussion
   */
  async postComment(
    verificationId: string,
    payload: CreateCommentPayload
  ): Promise<VerificationComment | null> {
    try {
      const response = await apiClient.post(`/verifications/${verificationId}/comments`, payload);
      const data = response.data?.data || response.data;
      return data.comment || data;
    } catch (err) {
      console.error('[CommentService] Error creating comment:', err);
      throw err;
    }
  },

  /**
   * Upvote / like a comment
   */
  async toggleLike(
    verificationId: string,
    commentId: string,
    userId?: string
  ): Promise<VerificationComment | null> {
    try {
      const response = await apiClient.post(
        `/verifications/${verificationId}/comments/${commentId}/like`,
        { userId }
      );
      const data = response.data?.data || response.data;
      return data.comment || data;
    } catch (err) {
      console.error('[CommentService] Error toggling like:', err);
      throw err;
    }
  },

  /**
   * Add a threaded reply to an existing comment
   */
  async postReply(
    verificationId: string,
    commentId: string,
    payload: CreateReplyPayload
  ): Promise<VerificationComment | null> {
    try {
      const response = await apiClient.post(
        `/verifications/${verificationId}/comments/${commentId}/replies`,
        payload
      );
      const data = response.data?.data || response.data;
      return data.comment || data;
    } catch (err) {
      console.error('[CommentService] Error replying to comment:', err);
      throw err;
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(verificationId: string, commentId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/verifications/${verificationId}/comments/${commentId}`);
      return true;
    } catch (err) {
      console.error('[CommentService] Error deleting comment:', err);
      throw err;
    }
  },
};
