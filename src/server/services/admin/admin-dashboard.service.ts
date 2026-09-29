import { isDatabaseConnected } from '../../config/database.js';
import { UserModel } from '../../models/User.js';
import { VerificationModel } from '../../models/Verification.js';
import { SourceModel } from '../../models/Source.js';
import { FactCheckModel } from '../../models/FactCheck.js';
import { userStore } from '../../db/userStore.js';
import { env } from '../../config/environment.js';
import { AdminDashboardStats } from '../../types/admin/admin.types.js';
import { adminAlertService } from './admin-alert.service.js';
import { adminAuditService } from './admin-audit.service.js';
import { getVerificationStats } from '../verificationStats.service.js';

export class AdminDashboardService {
  /**
   * Aggregates real-time comprehensive administrative dashboard stats
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    // 1. Fetch centralized, unified verification statistics
    const statsResult = await getVerificationStats({});

    let totalUsers = statsResult.totalUsers || 0;
    let activeUsers = statsResult.activeUsers || 0;
    let suspendedUsers = statsResult.suspendedUsers || 0;
    let adminUsers = statsResult.adminUsers || 0;

    let totalSources = 0;
    let totalFactChecks = 0;

    let recentVerifications: any[] = [];
    let pendingReviewItems: any[] = [];

    if (isDatabaseConnected()) {
      try {
        if (!totalUsers) {
          totalUsers = await UserModel.countDocuments();
          activeUsers = await UserModel.countDocuments({ status: 'ACTIVE' });
          suspendedUsers = await UserModel.countDocuments({ status: 'SUSPENDED' });
          adminUsers = await UserModel.countDocuments({ role: 'ADMIN' });
        }

        totalSources = await SourceModel.countDocuments();
        totalFactChecks = await FactCheckModel.countDocuments();

        // Recent 5 verifications
        const recents = await VerificationModel.find()
          .sort({ createdAt: -1 })
          .limit(5);
        recentVerifications = recents.map((r) => (r.toJSON ? r.toJSON() : r));

        // Pending review queue top 5
        const pendingQueue = await VerificationModel.find({
          $or: [{ status: 'PENDING_REVIEW' }, { reviewStatus: 'PENDING' }],
        })
          .sort({ createdAt: -1 })
          .limit(5);
        pendingReviewItems = pendingQueue.map((r) => (r.toJSON ? r.toJSON() : r));
      } catch (err) {
        console.warn('[AdminDashboardService] DB aggregate error:', err);
      }
    } else {
      const allUsers = await userStore.getAll();
      totalUsers = allUsers.length;
      activeUsers = allUsers.filter((u) => u.status === 'ACTIVE').length;
      suspendedUsers = allUsers.filter((u) => u.status === 'SUSPENDED').length;
      adminUsers = allUsers.filter((u) => u.role === 'ADMIN').length;
    }

    // Fetch open alerts and recent audit logs
    const alertsRes = await adminAlertService.getAlerts({ limit: 5 });
    const auditRes = await adminAuditService.getAuditLogs({ limit: 5 });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        admins: adminUsers,
      },
      verifications: {
        total: statsResult.totalVerifications,
        completed: statsResult.completed,
        processing: statsResult.processing,
        failed: statsResult.failed,
        pendingReview: statsResult.pendingReview,
        reviewed: statsResult.reviewed,
      },
      classifications: {
        verified: statsResult.verified,
        trusted: statsResult.trusted,
        suspicious: statsResult.suspicious,
        fake: statsResult.fake,
        unverified: statsResult.unverified,
      },
      qualityMetrics: {
        averageCredibilityScore: statsResult.averageCredibilityScore,
        averageConfidence: statsResult.averageConfidence,
        lowConfidenceCount: statsResult.lowConfidenceCount,
        humanOverrideCount: statsResult.overrideCount,
        totalSources,
        totalFactChecks,
      },
      systemHealth: {
        databaseConnected: isDatabaseConnected(),
        aiServiceOnline: true,
        searchApiOnline: true,
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        environment: env.NODE_ENV,
      },
      recentVerifications,
      pendingReviews: pendingReviewItems,
      recentAlerts: alertsRes.items,
      recentAuditLogs: auditRes.items,
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
