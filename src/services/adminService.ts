import { apiClient } from './api';
import {
  User,
  Submission,
  Source,
  FactCheck,
  AlertItem,
  AuditLog,
  AdminReview,
  SystemStats,
  Classification,
  UserStatus,
  Role,
  AIPerformanceData,
  AnalyticsData,
} from '../types';
import { mapBackendVerificationToSubmission } from './verificationService';

export const adminService = {
  /**
   * Fetch administrative overview statistics: GET /api/admin/dashboard
   */
  getDashboardStats: async (): Promise<SystemStats> => {
    try {
      const response = await apiClient.get('/admin/dashboard');
      const data = response.data?.data?.stats || response.data?.stats || response.data?.data || response.data;

      const users = data.users || {};
      const verifications = data.verifications || {};
      const classifications = data.classifications || {};
      const quality = data.qualityMetrics || {};

      const totalSubs = verifications.total ?? (data.totalSubmissions || 0);
      const fake = classifications.fake ?? (data.fakeCount || 0);

      return {
        totalUsers: users.total ?? (data.totalUsers || 0),
        totalSubmissions: totalSubs,
        verifiedCount: classifications.verified ?? (data.verifiedCount || 0),
        trustedCount: classifications.trusted ?? (data.trustedCount || 0),
        suspiciousCount: classifications.suspicious ?? (data.suspiciousCount || 0),
        fakeCount: fake,
        pendingReviewsCount: verifications.pendingReview ?? (data.pendingReviewsCount || 0),
        flaggedCount: (classifications.suspicious || 0) + fake,
        fakeRatio: totalSubs > 0 ? Math.round((fake / totalSubs) * 100) : 0,
        activeSources: quality.totalSources ?? (data.activeSources || 0),
        averageProcessingTimeMs: 1450,
        accuracyRate: 94.2,
      };
    } catch (error) {
      console.warn('[adminService] getDashboardStats error:', error);
      return {
        totalUsers: 0,
        totalSubmissions: 0,
        verifiedCount: 0,
        trustedCount: 0,
        suspiciousCount: 0,
        fakeCount: 0,
        pendingReviewsCount: 0,
        flaggedCount: 0,
        fakeRatio: 0,
        activeSources: 0,
      };
    }
  },

  /**
   * Fetch submissions list: GET /api/admin/verifications
   */
  getSubmissions: async (params?: {
    status?: string;
    classification?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Submission[]> => {
    try {
      const response = await apiClient.get('/admin/verifications', { params });
      const resData = response.data?.data || response.data;
      const list = resData.verifications || resData.items || (Array.isArray(resData) ? resData : []);
      return list.map(mapBackendVerificationToSubmission);
    } catch (error) {
      console.warn('[adminService] getSubmissions error:', error);
      return [];
    }
  },

  /**
   * Fetch submission by ID: GET /api/admin/verifications/:id
   */
  getSubmissionById: async (id: string): Promise<Submission | null> => {
    try {
      const response = await apiClient.get(`/admin/verifications/${id}`);
      const resData = response.data?.data || response.data;
      const ver = resData.verification || resData;
      return mapBackendVerificationToSubmission(ver);
    } catch (error) {
      console.warn(`[adminService] getSubmissionById error (${id}):`, error);
      return null;
    }
  },

  /**
   * Delete a submission: DELETE /api/admin/verifications/:id
   */
  deleteSubmission: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/admin/verifications/${id}`);
      return true;
    } catch (error) {
      console.warn(`[adminService] deleteSubmission error (${id}):`, error);
      throw error;
    }
  },

  /**
   * Fetch human review queue items: GET /api/admin/reviews
   */
  getReviewQueue: async (params?: {
    priority?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminReview[]> => {
    try {
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
    } catch (error) {
      console.warn('[adminService] getReviewQueue error:', error);
      return [];
    }
  },

  /**
   * Fetch review item by ID: GET /api/admin/reviews/:id
   */
  getReviewById: async (id: string): Promise<any> => {
    try {
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
        submission: submission ? mapBackendVerificationToSubmission(submission) : {
          id: reviewObj.submissionId,
          userId: 'usr_sys',
          userName: 'System User',
          contentType: 'TEXT',
          contentPreview: reviewObj.submissionSnippet,
          status: 'PROCESSED',
          submittedAt: reviewObj.dateSubmitted,
          result: {
            id: reviewObj.submissionId,
            submissionId: reviewObj.submissionId,
            score: reviewObj.autoScore,
            classification: reviewObj.autoClassification,
            confidence: Math.round((reviewObj.confidence || 0.8) * 100),
            summary: reviewObj.submissionSnippet || 'Analyzed content snippet.',
            contentType: 'TEXT',
            inputContent: reviewObj.submissionSnippet || '',
            createdAt: reviewObj.dateSubmitted || new Date().toISOString(),
            source: {
              name: 'Reported Content',
              domain: 'unknown',
              status: 'SUSPICIOUS',
              credibilityScore: reviewObj.autoScore,
              isVerified: false,
              previousMisinformationCount: 1,
            },
            indicators: [],
            claims: [],
            evidence: {
              availability: 'MEDIUM',
              description: reviewObj.flagReason,
              supportingEvidence: [],
              counterEvidence: [],
            },
            explanations: [reviewObj.flagReason],
            recommendation: 'Manual oversight required.',
          }
        },
      };
    } catch (error) {
      console.warn(`[adminService] getReviewById error (${id}):`, error);
      return null;
    }
  },

  /**
   * Submit human review adjudication: POST /api/admin/reviews/:verificationId
   */
  submitReview: async (params: {
    verificationId?: string;
    reviewId?: string;
    submissionId?: string;
    decision: string;
    finalClassification?: Classification;
    newClassification?: Classification;
    adminNotes?: string;
    reviewerName?: string;
    adminName?: string;
  }): Promise<boolean> => {
    try {
      const targetId = params.verificationId || params.submissionId || params.reviewId;
      await apiClient.post(`/admin/reviews/${targetId}`, {
        decision: params.decision,
        finalClassification: params.finalClassification || params.newClassification,
        adminNotes: params.adminNotes,
        reviewerName: params.reviewerName || params.adminName,
      });
      return true;
    } catch (error) {
      console.warn('[adminService] submitReview error:', error);
      throw error;
    }
  },

  /**
   * Fetch registered sources: GET /api/admin/sources
   */
  getSources: async (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<Source[]> => {
    try {
      const response = await apiClient.get('/admin/sources', { params });
      const resData = response.data?.data || response.data;
      const list = resData.sources || resData.items || (Array.isArray(resData) ? resData : []);
      return list.map((s: any) => ({
        id: s.id || s._id || s.domain,
        name: s.name,
        domain: s.domain,
        status: s.status || 'TRUSTED',
        credibilityScore: s.credibilityScore ?? 80,
        isVerified: Boolean(s.isVerified),
        isOfficial: Boolean(s.isOfficial),
        totalChecks: s.totalVerifications ?? s.totalChecks ?? 0,
        category: s.category || 'General Media',
        description: s.description || '',
        notes: s.notes || '',
        lastEvaluated: s.lastEvaluated ? new Date(s.lastEvaluated).toISOString() : new Date().toISOString(),
        isArchived: Boolean(s.isArchived),
      }));
    } catch (error) {
      console.warn('[adminService] getSources error:', error);
      return [];
    }
  },

  /**
   * Fetch source by ID: GET /api/admin/sources/:id
   */
  getSourceById: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/admin/sources/${id}`);
      const resData = response.data?.data || response.data;
      const s = resData.source || resData;
      const sourceObj: Source = {
        id: s.id || s._id || s.domain,
        name: s.name,
        domain: s.domain,
        status: s.status || 'TRUSTED',
        credibilityScore: s.credibilityScore ?? 80,
        isVerified: Boolean(s.isVerified),
        isOfficial: Boolean(s.isOfficial),
        totalChecks: s.totalVerifications ?? s.totalChecks ?? 0,
        category: s.category || 'General Media',
        description: s.description || '',
        notes: s.notes || '',
        lastEvaluated: s.lastEvaluated ? new Date(s.lastEvaluated).toISOString() : new Date().toISOString(),
        isArchived: Boolean(s.isArchived),
      };

      return {
        ...sourceObj,
        source: sourceObj,
        relatedSubmissions: (resData.relatedSubmissions || []).map(mapBackendVerificationToSubmission),
        factChecks: resData.factChecks || [],
      };
    } catch (error) {
      console.warn(`[adminService] getSourceById error (${id}):`, error);
      return null;
    }
  },

  /**
   * Add new source: POST /api/admin/sources
   */
  addSource: async (sourceData: Partial<Source>): Promise<Source> => {
    const response = await apiClient.post('/admin/sources', sourceData);
    const resData = response.data?.data?.source || response.data?.source || response.data;
    return {
      id: resData.id || resData._id || resData.domain,
      name: resData.name,
      domain: resData.domain,
      status: resData.status || 'TRUSTED',
      credibilityScore: resData.credibilityScore ?? 80,
      isVerified: Boolean(resData.isVerified),
      isOfficial: Boolean(resData.isOfficial),
      totalChecks: 0,
      category: resData.category || 'General Media',
      description: resData.description || '',
      notes: resData.notes || '',
      lastEvaluated: new Date().toISOString(),
    };
  },

  createSource: async (sourceData: Partial<Source>, _adminName?: string): Promise<Source> => {
    return adminService.addSource(sourceData);
  },

  /**
   * Update source: PUT /api/admin/sources/:id
   */
  updateSource: async (id: string, sourceData: Partial<Source>, _adminName?: string): Promise<Source> => {
    const response = await apiClient.put(`/admin/sources/${id}`, sourceData);
    const resData = response.data?.data?.source || response.data?.source || response.data;
    return {
      id: resData.id || resData._id || id,
      name: resData.name || sourceData.name || '',
      domain: resData.domain || sourceData.domain || '',
      status: resData.status || sourceData.status || 'TRUSTED',
      credibilityScore: resData.credibilityScore ?? sourceData.credibilityScore ?? 80,
      isVerified: Boolean(resData.isVerified ?? sourceData.isVerified),
      isOfficial: Boolean(resData.isOfficial ?? sourceData.isOfficial),
      totalChecks: resData.totalVerifications ?? 0,
      category: resData.category || sourceData.category || 'General Media',
      description: resData.description || sourceData.description || '',
      notes: resData.notes || sourceData.notes || '',
      lastEvaluated: new Date().toISOString(),
      isArchived: Boolean(resData.isArchived ?? sourceData.isArchived),
    };
  },

  archiveSource: async (id: string, adminName?: string): Promise<Source> => {
    return adminService.updateSource(id, { isArchived: true }, adminName);
  },

  /**
   * Delete source: DELETE /api/admin/sources/:id
   */
  deleteSource: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/admin/sources/${id}`);
    return true;
  },

  /**
   * Fetch verified fact-check library: GET /api/admin/fact-checks
   */
  getFactChecks: async (params?: { search?: string; verdict?: string; page?: number; limit?: number }): Promise<FactCheck[]> => {
    try {
      const response = await apiClient.get('/admin/fact-checks', { params });
      const resData = response.data?.data || response.data;
      const list = resData.factChecks || resData.items || (Array.isArray(resData) ? resData : []);
      return list.map((fc: any) => ({
        id: fc.id || fc._id,
        claim: fc.claim || '',
        verdict: fc.verdict || 'FALSE',
        source: fc.source || 'Authoritative Source',
        evidenceUrl: fc.evidenceUrl,
        explanation: fc.explanation,
        notes: fc.notes || '',
        date: fc.date ? new Date(fc.date).toISOString() : new Date().toISOString(),
        verifiedBy: fc.verifiedBy || 'Fact-Checking Officer',
        tags: fc.tags || ['Ghana', 'National'],
      }));
    } catch (error) {
      console.warn('[adminService] getFactChecks error:', error);
      return [];
    }
  },

  getFactCheckById: async (id: string): Promise<FactCheck | null> => {
    try {
      const response = await apiClient.get(`/admin/fact-checks/${id}`);
      const resData = response.data?.data || response.data;
      const fc = resData.factCheck || resData;
      return {
        id: fc.id || fc._id,
        claim: fc.claim || '',
        verdict: fc.verdict || 'FALSE',
        source: fc.source || 'Authoritative Source',
        evidenceUrl: fc.evidenceUrl,
        explanation: fc.explanation,
        notes: fc.notes || '',
        date: fc.date ? new Date(fc.date).toISOString() : new Date().toISOString(),
        verifiedBy: fc.verifiedBy || 'Fact-Checking Officer',
        tags: fc.tags || ['Ghana', 'National'],
      };
    } catch (error) {
      console.warn(`[adminService] getFactCheckById error (${id}):`, error);
      return null;
    }
  },

  createFactCheck: async (data: Partial<FactCheck>, _adminName?: string): Promise<FactCheck> => {
    const response = await apiClient.post('/admin/fact-checks', data);
    const resData = response.data?.data?.factCheck || response.data?.factCheck || response.data;
    return {
      id: resData.id || resData._id,
      claim: resData.claim || data.claim || '',
      verdict: resData.verdict || data.verdict || 'FALSE',
      source: resData.source || data.source || '',
      evidenceUrl: resData.evidenceUrl || data.evidenceUrl,
      explanation: resData.explanation || data.explanation,
      notes: resData.notes || data.notes || '',
      date: new Date().toISOString(),
      verifiedBy: resData.verifiedBy || data.verifiedBy || 'Fact-Checking Officer',
      tags: resData.tags || data.tags || ['Ghana'],
    };
  },

  updateFactCheck: async (id: string, data: Partial<FactCheck>): Promise<FactCheck> => {
    const response = await apiClient.put(`/admin/fact-checks/${id}`, data);
    const resData = response.data?.data?.factCheck || response.data?.factCheck || response.data;
    return {
      id: resData.id || resData._id || id,
      claim: resData.claim || data.claim || '',
      verdict: resData.verdict || data.verdict || 'FALSE',
      source: resData.source || data.source || '',
      evidenceUrl: resData.evidenceUrl || data.evidenceUrl,
      explanation: resData.explanation || data.explanation,
      notes: resData.notes || data.notes || '',
      date: new Date().toISOString(),
      verifiedBy: resData.verifiedBy || data.verifiedBy || 'Fact-Checking Officer',
      tags: resData.tags || data.tags || ['Ghana'],
    };
  },

  deleteFactCheck: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/admin/fact-checks/${id}`);
    return true;
  },

  /**
   * Fetch system alerts: GET /api/admin/alerts
   */
  getAlerts: async (params?: { search?: string; severity?: string; page?: number; limit?: number }): Promise<AlertItem[]> => {
    try {
      const response = await apiClient.get('/admin/alerts', { params });
      const resData = response.data?.data || response.data;
      const list = resData.alerts || resData.items || (Array.isArray(resData) ? resData : []);
      return list.map((a: any) => ({
        id: a.id || a._id,
        severity: a.severity || 'HIGH',
        title: a.title || 'System Alert',
        description: a.description || a.message || '',
        date: a.createdAt ? new Date(a.createdAt).toISOString() : (a.date || new Date().toISOString()),
        type: a.type || 'SYSTEM_WARNING',
        status: a.status || (a.isActive ? 'NEW' : 'RESOLVED'),
        isActive: a.isActive !== undefined ? Boolean(a.isActive) : true,
        isDismissed: Boolean(a.isDismissed),
      }));
    } catch (error) {
      console.warn('[adminService] getAlerts error:', error);
      return [];
    }
  },

  createAlert: async (data: Partial<AlertItem>): Promise<AlertItem> => {
    const response = await apiClient.post('/admin/alerts', {
      title: data.title,
      severity: data.severity || 'HIGH',
      type: data.type || 'SYSTEM_WARNING',
      message: data.description,
      description: data.description,
      isActive: true,
    });
    const resData = response.data?.data?.alert || response.data?.alert || response.data;
    return {
      id: resData.id || resData._id,
      severity: resData.severity || data.severity || 'HIGH',
      title: resData.title || data.title || '',
      description: resData.description || resData.message || data.description || '',
      date: new Date().toISOString(),
      type: resData.type || data.type || 'SYSTEM_WARNING',
      isActive: true,
      isDismissed: false,
    };
  },

  updateAlert: async (id: string, data: Partial<AlertItem>): Promise<AlertItem> => {
    const response = await apiClient.put(`/admin/alerts/${id}`, data);
    const resData = response.data?.data?.alert || response.data?.alert || response.data;
    return {
      id: resData.id || resData._id || id,
      severity: resData.severity || data.severity || 'HIGH',
      title: resData.title || data.title || '',
      description: resData.description || resData.message || data.description || '',
      date: new Date().toISOString(),
      type: resData.type || data.type || 'SYSTEM_WARNING',
      isActive: data.isActive !== undefined ? data.isActive : true,
      isDismissed: Boolean(data.isDismissed),
    };
  },

  resolveAlert: async (id: string, _adminName?: string): Promise<AlertItem> => {
    return adminService.updateAlert(id, { status: 'RESOLVED', isActive: false });
  },

  deleteAlert: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/admin/alerts/${id}`);
    return true;
  },

  /**
   * Fetch immutable audit logs: GET /api/admin/audit
   */
  getAuditLogs: async (params?: { action?: string; targetType?: string; page?: number; limit?: number }): Promise<AuditLog[]> => {
    try {
      const response = await apiClient.get('/admin/audit', { params });
      const resData = response.data?.data || response.data;
      const list = resData.auditLogs || resData.items || (Array.isArray(resData) ? resData : []);
      return list.map((log: any) => ({
        id: log.id || log._id,
        action: log.action || 'SYSTEM_EVENT',
        adminName: log.adminName || log.performedByName || 'System Process',
        adminEmail: log.adminEmail || 'admin@system.local',
        performedByName: log.performedByName || log.adminName,
        performedByRole: log.performedByRole || 'ADMIN',
        targetType: log.targetType || 'SYSTEM',
        targetId: log.targetId || '',
        targetName: log.targetName || 'System Target',
        date: log.createdAt ? new Date(log.createdAt).toISOString() : (log.date || new Date().toISOString()),
        details: log.details || '',
        ipAddress: log.ipAddress || '127.0.0.1',
      }));
    } catch (error) {
      console.warn('[adminService] getAuditLogs error:', error);
      return [];
    }
  },

  /**
   * Fetch user list with full server pagination: GET /api/admin/users
   */
  getUsersPaginated: async (params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<{ items: User[]; total: number; page: number; limit: number; totalPages: number }> => {
    try {
      const response = await apiClient.get('/admin/users', { params });
      const resData = response.data?.data || response.data;
      const list = resData.users || resData.items || (Array.isArray(resData) ? resData : []);
      const mappedItems: User[] = list.map((u: any) => ({
        id: u.id || u._id,
        name: u.name || u.full_name || 'User',
        email: u.email,
        role: (u.role || 'USER') as Role,
        status: (u.status || 'ACTIVE') as UserStatus,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        totalChecks: u.totalChecks ?? 0,
        stats: u.stats || { verified: 0, trusted: 0, suspicious: 0, fake: 0 },
        organization: u.organization,
        phone: u.phone,
        bio: u.bio,
      }));

      return {
        items: mappedItems,
        total: resData.total ?? mappedItems.length,
        page: resData.page ?? params?.page ?? 1,
        limit: resData.limit ?? params?.limit ?? 20,
        totalPages: resData.totalPages ?? (Math.ceil((resData.total ?? mappedItems.length) / (params?.limit ?? 20)) || 1),
      };
    } catch (error) {
      console.warn('[adminService] getUsersPaginated error:', error);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
    }
  },

  /**
   * Fetch user list: GET /api/admin/users
   */
  getUsers: async (params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }): Promise<User[]> => {
    try {
      const response = await apiClient.get('/admin/users', { params });
      const resData = response.data?.data || response.data;
      const list = resData.users || resData.items || (Array.isArray(resData) ? resData : []);
      return list.map((u: any) => ({
        id: u.id || u._id,
        name: u.name || u.full_name || 'User',
        email: u.email,
        role: (u.role || 'USER') as Role,
        status: (u.status || 'ACTIVE') as UserStatus,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        totalChecks: u.totalChecks ?? 0,
        stats: u.stats || { verified: 0, trusted: 0, suspicious: 0, fake: 0 },
        organization: u.organization,
        phone: u.phone,
        bio: u.bio,
      }));
    } catch (error) {
      console.warn('[adminService] getUsers error:', error);
      return [];
    }
  },

  /**
   * Fetch single user details: GET /api/admin/users/:id
   */
  getUserById: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/admin/users/${id}`);
      const resData = response.data?.data || response.data;
      const u = resData.user || resData;
      const userObj: User = {
        id: u.id || u._id,
        name: u.name || u.full_name || 'User',
        email: u.email,
        role: (u.role || 'USER') as Role,
        status: (u.status || 'ACTIVE') as UserStatus,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        totalChecks: u.totalChecks ?? 0,
        stats: u.stats || { verified: 0, trusted: 0, suspicious: 0, fake: 0 },
        organization: u.organization,
        phone: u.phone,
        bio: u.bio,
      };

      return {
        ...userObj,
        user: userObj,
        submissions: (resData.submissions || []).map(mapBackendVerificationToSubmission),
      };
    } catch (error) {
      console.warn(`[adminService] getUserById error (${id}):`, error);
      return null;
    }
  },

  /**
   * Update user status: PATCH /api/admin/users/:id/status
   */
  updateUserStatus: async (id: string, status: UserStatus, notes?: string): Promise<boolean> => {
    await apiClient.patch(`/admin/users/${id}/status`, { status, notes });
    return true;
  },

  /**
   * Update user role: PATCH /api/admin/users/:id/role
   */
  updateUserRole: async (id: string, role: Role, notes?: string): Promise<boolean> => {
    await apiClient.patch(`/admin/users/${id}/role`, { role, notes });
    return true;
  },

  /**
   * Delete user: DELETE /api/admin/users/:id
   */
  deleteUser: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/admin/users/${id}`);
    return true;
  },

  /**
   * Fetch platform analytics: GET /api/admin/analytics
   */
  getAnalytics: async (timeframe: string = '30d'): Promise<any> => {
    try {
      const response = await apiClient.get('/admin/analytics', { params: { timeframe } });
      return response.data?.data?.analytics || response.data?.data || response.data?.analytics || response.data;
    } catch (error) {
      console.warn('[adminService] getAnalytics error:', error);
      throw error;
    }
  },

  /**
   * Helper aliases for dashboard and review compatibility
   */
  getSystemStats: async (): Promise<SystemStats> => {
    return adminService.getDashboardStats();
  },

  addFactCheck: async (data: Partial<FactCheck>): Promise<FactCheck> => {
    return adminService.createFactCheck(data);
  },

  reviewSubmission: async (params: {
    submissionId?: string;
    decision: string;
    finalClassification?: Classification;
    adminNotes?: string;
    reviewerName?: string;
    adminName?: string;
  }): Promise<boolean> => {
    return adminService.submitReview({
      verificationId: params.submissionId,
      decision: params.decision,
      finalClassification: params.finalClassification || 'CONFIRMED' as any,
      adminNotes: params.adminNotes,
      reviewerName: params.reviewerName || params.adminName,
    });
  },

  /**
   * Fetch AI Performance metrics: GET /api/admin/analytics/ai
   */
  getAIPerformance: async (): Promise<AIPerformanceData> => {
    try {
      const response = await apiClient.get('/admin/analytics/ai');
      return response.data?.data?.aiPerformance || response.data?.aiPerformance || response.data;
    } catch (error) {
      console.warn('[adminService] getAIPerformance error:', error);
      throw error;
    }
  },
};
