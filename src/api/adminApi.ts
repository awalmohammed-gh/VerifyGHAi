import { apiClient } from '../services/api';
import { User, Submission, SystemStats, Role, UserStatus } from '../types';
import { mapBackendVerificationToSubmission } from '../services/verificationService';

export const adminApi = {
  /**
   * Fetch administrative system statistics & telemetry
   */
  getStats: async (): Promise<SystemStats> => {
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
  },

  /**
   * Fetch paginated verifications
   */
  getVerifications: async (params?: {
    status?: string;
    classification?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Submission[]> => {
    const response = await apiClient.get('/admin/verifications', { params });
    const resData = response.data?.data || response.data;
    const list = resData.verifications || resData.items || (Array.isArray(resData) ? resData : []);
    return list.map(mapBackendVerificationToSubmission);
  },

  /**
   * Fetch single verification details
   */
  getVerificationById: async (id: string): Promise<Submission | null> => {
    const response = await apiClient.get(`/admin/verifications/${id}`);
    const resData = response.data?.data || response.data;
    const ver = resData.verification || resData;
    if (!ver) return null;
    return mapBackendVerificationToSubmission(ver);
  },

  /**
   * Override a verification classification (Human-in-the-loop Adjudication)
   */
  overrideVerification: async (
    id: string,
    data: {
      adminClassification: string;
      adminRiskLevel?: string;
      adminCredibilityScore?: number;
      adminNotes?: string;
      reason?: string;
    }
  ): Promise<boolean> => {
    await apiClient.post(`/admin/verifications/${id}/override`, data);
    return true;
  },

  /**
   * Delete verification entry
   */
  deleteVerification: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/admin/verifications/${id}`);
    return true;
  },

  /**
   * Fetch paginated user accounts
   */
  getUsers: async (params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: User[]; total: number }> => {
    const response = await apiClient.get('/admin/users', { params });
    const resData = response.data?.data || response.data;
    const list = resData.users || resData.items || (Array.isArray(resData) ? resData : []);
    const items: User[] = list.map((u: any) => ({
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
      items,
      total: resData.total ?? items.length,
    };
  },

  /**
   * Fetch single user details
   */
  getUserById: async (id: string): Promise<{ user: User; submissions: Submission[] } | null> => {
    const response = await apiClient.get(`/admin/users/${id}`);
    const resData = response.data?.data || response.data;
    const u = resData.user || resData;
    if (!u) return null;
    return {
      user: {
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
      },
      submissions: (resData.submissions || []).map(mapBackendVerificationToSubmission),
    };
  },

  /**
   * Update user status (ACTIVE, SUSPENDED, DEACTIVATED)
   */
  updateUserStatus: async (id: string, status: UserStatus, notes?: string): Promise<boolean> => {
    await apiClient.patch(`/admin/users/${id}/status`, { status, notes });
    return true;
  },

  /**
   * Update user role (USER, ADMIN)
   */
  updateUserRole: async (id: string, role: Role, notes?: string): Promise<boolean> => {
    await apiClient.patch(`/admin/users/${id}/role`, { role, notes });
    return true;
  },
};
