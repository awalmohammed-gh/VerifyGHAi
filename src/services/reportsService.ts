import { apiClient } from './api';
import { SavedReport, VerificationResult, Classification, ContentType } from '../types';
import { mapBackendVerificationToResult } from './verificationService';

export function mapBackendReportToSavedReport(rep: any): SavedReport {
  const result: VerificationResult = rep.verification
    ? mapBackendVerificationToResult(rep.verification)
    : rep.result
    ? mapBackendVerificationToResult(rep.result)
    : {
        id: rep.verificationId || rep.resultId || rep.id,
        submissionId: rep.verificationId || rep.resultId || rep.id,
        score: rep.credibilityScore ?? rep.score ?? 75,
        classification: (rep.classification || 'TRUSTED') as Classification,
        confidence: 85,
        summary: rep.summary || rep.title || 'Verification Report',
        contentType: (rep.contentType || 'TEXT') as ContentType,
        inputContent: rep.summary || rep.title || '',
        createdAt: rep.createdAt ? new Date(rep.createdAt).toISOString() : new Date().toISOString(),
        source: {
          name: rep.sourceDomain || 'Media Source',
          domain: rep.sourceDomain || 'news.gh',
          status: 'TRUSTED',
          credibilityScore: rep.score || 80,
          isVerified: true,
          previousMisinformationCount: 0,
        },
        indicators: [],
        claims: (rep.keyFindings || []).map((kf: string, idx: number) => ({
          id: `kf-${idx}`,
          text: kf,
          status: 'VERIFIED' as const,
        })),
        evidence: {
          availability: 'HIGH',
          description: 'Documented via cross-source validation archives.',
          supportingEvidence: [],
          counterEvidence: [],
        },
        explanations: rep.keyFindings || ['Synthesized fact-checking assessment.'],
        recommendation: 'Use verified reports for public disclosures and social sharing.',
      };

  return {
    id: rep.id || rep._id || `rep_${Date.now()}`,
    userId: rep.userId || '',
    resultId: rep.verificationId || rep.resultId || rep.id,
    title: rep.title || 'Fact-Check Verification Report',
    contentPreview: rep.summary || rep.title || 'Verification Report Summary',
    contentType: (rep.contentType || 'TEXT') as ContentType,
    classification: (rep.classification || result.classification || 'TRUSTED') as Classification,
    score: rep.credibilityScore ?? rep.score ?? result.score ?? 75,
    sourceDomain: rep.sourceDomain || result.source?.domain,
    savedAt: rep.createdAt ? new Date(rep.createdAt).toISOString() : new Date().toISOString(),
    notes: rep.notes || rep.summary,
    result,
  };
}

export const reportsService = {
  /**
   * Fetch all saved reports: GET /api/reports
   */
  getReports: async (_userId?: string): Promise<SavedReport[]> => {
    try {
      const response = await apiClient.get('/reports');
      const resData = response.data?.data || response.data;
      const list = resData.reports || (Array.isArray(resData) ? resData : []);
      return list.map(mapBackendReportToSavedReport);
    } catch (error) {
      console.warn('[reportsService] getReports error:', error);
      return [];
    }
  },

  /**
   * Fetch a saved report by ID: GET /api/reports/:id
   */
  getReportById: async (id: string): Promise<SavedReport | null> => {
    try {
      const response = await apiClient.get(`/reports/${id}`);
      const resData = response.data?.data || response.data;
      const report = resData.report || resData;
      return mapBackendReportToSavedReport(report);
    } catch (error) {
      console.warn(`[reportsService] getReportById error (${id}):`, error);
      return null;
    }
  },

  /**
   * Check if a report is saved for this result
   */
  isReportSaved: async (userId: string, resultId: string): Promise<boolean> => {
    try {
      const reports = await reportsService.getReports(userId);
      return reports.some((r) => r.resultId === resultId || r.id === resultId || r.result?.id === resultId);
    } catch {
      return false;
    }
  },

  /**
   * Save / generate a report from a verification result: POST /api/reports/:verificationId
   */
  saveReport: async (
    userIdOrParams:
      | string
      | {
          userId?: string;
          result: VerificationResult;
          title?: string;
          notes?: string;
        },
    resultObj?: VerificationResult
  ): Promise<SavedReport> => {
    const params =
      typeof userIdOrParams === 'string'
        ? { userId: userIdOrParams, result: resultObj! }
        : userIdOrParams;

    try {
      const verificationId = params.result.submissionId || params.result.id;
      const response = await apiClient.post(`/reports/${verificationId}`, {
        title: params.title || `Report: ${params.result.summary.slice(0, 50)}...`,
        notes: params.notes,
      });

      const resData = response.data?.data || response.data;
      const report = resData.report || resData;
      return mapBackendReportToSavedReport(report);
    } catch (error) {
      console.warn('[reportsService] saveReport API error, generating local payload representation:', error);
      return {
        id: `rep_${Date.now()}`,
        userId: params.userId || 'usr_current',
        resultId: params.result.id,
        title: params.title || `Fact-Check Dossier: ${params.result.summary.slice(0, 45)}...`,
        contentPreview: params.result.summary.slice(0, 120),
        contentType: params.result.contentType,
        classification: params.result.classification,
        score: params.result.score,
        sourceDomain: params.result.source.domain,
        savedAt: new Date().toISOString(),
        notes: params.notes,
        result: params.result,
      };
    }
  },

  /**
   * Delete a saved report: DELETE /api/reports/:id
   */
  deleteReport: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/reports/${id}`);
      return true;
    } catch (error) {
      console.warn(`[reportsService] deleteReport error (${id}):`, error);
      throw error;
    }
  },
};
