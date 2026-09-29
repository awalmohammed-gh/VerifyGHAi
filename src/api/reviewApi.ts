import { apiClient } from '../services/api';
import { AdminReview, Classification } from '../types';
import { mapBackendVerificationToSubmission } from '../services/verificationService';

export const reviewApi = {
  /**
   * Fetch human review queue items
   */
  getReviewQueue: async (params?: {
    priority?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminReview[]> => {
    const response = await apiClient.get('/admin/reviews', { params });
    const resData = response.data?.data || response.data;
    const list = resData.reviews || resData.items || (Array.isArray(resData) ? resData : []);
    return list.map((item: any) => ({
      id: item.id || item._id,
      submissionId: item.verificationId || item.submissionId || item.id,
      submissionSnippet: item.originalContent || item.submissionSnippet || 'Claim Review Item',
      autoClassification: item.automatedResult?.classification || item.autoClassification || 'SUSPICIOUS',
      autoScore: item.automatedResult?.credibilityScore ?? item.autoScore ?? 50,
      confidence: item.automatedResult?.confidence ?? item.confidence ?? 0.75,
      priority: item.priority || 'MEDIUM',
      flagReason: item.flagReason || item.reason || 'Automated anomaly detected or flagged for oversight.',
      dateSubmitted: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      reviewedBy: item.humanReview?.reviewedBy || item.reviewedBy,
      reviewDate: item.humanReview?.reviewedAt || item.reviewDate,
      decision: item.humanReview?.decision || item.decision,
      finalClassification: item.humanReview?.finalClassification || item.finalClassification,
      adminNotes: item.humanReview?.adminNotes || item.adminNotes,
      status: item.status === 'REVIEWED' || item.status === 'RESOLVED' ? 'RESOLVED' : 'PENDING',
      assignedTo: item.assignedTo,
    }));
  },

  /**
   * Fetch single review item details with verification submission
   */
  getReviewById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/admin/reviews/${id}`);
    const resData = response.data?.data || response.data;
    const item = resData.review || resData;
    const reviewObj: AdminReview = {
      id: item.id || item._id,
      submissionId: item.verificationId || item.submissionId || item.id,
      submissionSnippet: item.originalContent || item.submissionSnippet || 'Claim Review Item',
      autoClassification: item.automatedResult?.classification || item.autoClassification || 'SUSPICIOUS',
      autoScore: item.automatedResult?.credibilityScore ?? item.autoScore ?? 50,
      confidence: item.automatedResult?.confidence ?? item.confidence ?? 0.75,
      priority: item.priority || 'MEDIUM',
      flagReason: item.flagReason || item.reason || 'Automated anomaly detected or flagged for oversight.',
      dateSubmitted: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      reviewedBy: item.humanReview?.reviewedBy || item.reviewedBy,
      reviewDate: item.humanReview?.reviewedAt || item.reviewDate,
      decision: item.humanReview?.decision || item.decision,
      finalClassification: item.humanReview?.finalClassification || item.finalClassification,
      adminNotes: item.humanReview?.adminNotes || item.adminNotes,
      status: item.status === 'REVIEWED' || item.status === 'RESOLVED' ? 'RESOLVED' : 'PENDING',
    };

    const submission = resData.submission || item.submission;
    return {
      ...reviewObj,
      review: reviewObj,
      submission: submission ? mapBackendVerificationToSubmission(submission) : null,
    };
  },

  /**
   * Submit human review adjudication decision
   */
  submitReview: async (params: {
    verificationId: string;
    decision: string;
    finalClassification?: Classification | string;
    adminNotes?: string;
    reviewerName?: string;
  }): Promise<boolean> => {
    await apiClient.post(`/admin/reviews/${params.verificationId}`, {
      decision: params.decision,
      finalClassification: params.finalClassification,
      adminNotes: params.adminNotes,
      reviewerName: params.reviewerName,
    });
    return true;
  },

  /**
   * Direct override for verification
   */
  overrideVerification: async (
    verificationId: string,
    data: {
      adminClassification: string;
      adminRiskLevel?: string;
      adminCredibilityScore?: number;
      adminNotes?: string;
      reason?: string;
    }
  ): Promise<boolean> => {
    await apiClient.post(`/admin/verifications/${verificationId}/override`, data);
    return true;
  },
};
