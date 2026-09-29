import mongoose from 'mongoose';
import { isDatabaseConnected } from '../../config/database.js';
import { UserModel } from '../../models/User.js';
import { VerificationModel } from '../../models/Verification.js';
import { ReportModel } from '../../models/Report.js';
import { userStore } from '../../db/userStore.js';
import { SafeUser, UserRole, UserStatus } from '../../types/user.types.js';
import { AdminUserFilterOptions } from '../../types/admin/admin.types.js';
import { ApiError } from '../../utils/apiError.js';
import { adminAuditService } from './admin-audit.service.js';

export class AdminUserService {
  /**
   * Lists all users with pagination, search and filters
   */
  async listUsers(options: AdminUserFilterOptions): Promise<{
    items: SafeUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    if (isDatabaseConnected()) {
      try {
        const query: Record<string, any> = {};

        if (options.status) query.status = options.status;
        if (options.role) query.role = options.role;
        if (options.search) {
          const searchRegex = new RegExp(options.search.trim(), 'i');
          query.$or = [
            { name: searchRegex },
            { email: searchRegex },
            { organization: searchRegex },
            { roleTitle: searchRegex },
          ];
        }

        const sortOption: Record<string, any> = { createdAt: -1 };
        if (options.sort === 'name_asc') sortOption.name = 1;
        if (options.sort === 'name_desc') sortOption.name = -1;
        if (options.sort === 'oldest') sortOption.createdAt = 1;

        const total = await UserModel.countDocuments(query);
        const docs = await UserModel.find(query)
          .sort(sortOption)
          .skip(skip)
          .limit(limit);

        const items: SafeUser[] = docs.map((doc) => doc.toSafeObject());
        const totalPages = Math.ceil(total / limit) || 1;

        return { items, total, page, limit, totalPages };
      } catch (err) {
        console.warn('[AdminUserService] DB list users error:', err);
      }
    }

    let all = await userStore.getAll();
    let filtered = all.map((u) => ({
      id: u.id,
      name: u.full_name,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      status: u.status,
      organization: u.organization,
      roleTitle: u.role_title,
      bio: u.bio,
      phone: u.phone,
      createdAt: u.created_at,
      created_at: u.created_at,
      updatedAt: u.updated_at,
      updated_at: u.updated_at,
    }));

    if (options.status) filtered = filtered.filter((u) => u.status === options.status);
    if (options.role) filtered = filtered.filter((u) => u.role === options.role);
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.organization?.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return { items, total, page, limit, totalPages };
  }

  /**
   * Retrieves full details and activity summary for a target user
   */
  async getUserDetails(userId: string): Promise<{
    user: SafeUser;
    verificationStats: {
      total: number;
      breakdown: {
        verified: number;
        trusted: number;
        suspicious: number;
        fake: number;
        unverified: number;
      };
      averageScore: number;
    };
    recentVerifications: any[];
    reports: any[];
  }> {
    let user: SafeUser | null = null;

    if (isDatabaseConnected() && mongoose.isValidObjectId(userId)) {
      try {
        const doc = await UserModel.findById(userId);
        if (doc) user = doc.toSafeObject();
      } catch (err) {
        console.warn('[AdminUserService] DB get user error:', err);
      }
    }

    if (!user) {
      const storeUser = await userStore.findById(userId);
      if (storeUser) {
        user = {
          id: storeUser.id,
          name: storeUser.full_name,
          email: storeUser.email,
          role: storeUser.role,
          status: storeUser.status,
          organization: storeUser.organization,
          roleTitle: storeUser.role_title,
          bio: storeUser.bio,
          phone: storeUser.phone,
          createdAt: storeUser.created_at,
          updatedAt: storeUser.updated_at,
        };
      }
    }

    if (!user) {
      throw ApiError.notFound('User record not found.');
    }

    let recentVerifications: any[] = [];
    let reports: any[] = [];
    let totalVerifications = 0;
    const breakdown = { verified: 0, trusted: 0, suspicious: 0, fake: 0, unverified: 0 };
    let scoreSum = 0;
    let scoreCount = 0;

    if (isDatabaseConnected()) {
      try {
        const verDocs = await VerificationModel.find({
          $or: [{ userId }, { userId: userId.toString() }],
        })
          .sort({ createdAt: -1 })
          .limit(10);

        recentVerifications = verDocs.map((d) => (d.toJSON ? d.toJSON() : d));
        totalVerifications = await VerificationModel.countDocuments({
          $or: [{ userId }, { userId: userId.toString() }],
        });

        // Group classification counts
        const aggregations = await VerificationModel.aggregate([
          { $match: { $or: [{ userId }, { userId: userId.toString() }] } },
          {
            $group: {
              _id: '$automatedResult.classification',
              count: { $sum: 1 },
              avgScore: { $avg: '$automatedResult.credibilityScore' },
            },
          },
        ]);

        for (const grp of aggregations) {
          const cls = grp._id?.toLowerCase();
          if (cls === 'verified') breakdown.verified = grp.count;
          else if (cls === 'trusted') breakdown.trusted = grp.count;
          else if (cls === 'suspicious') breakdown.suspicious = grp.count;
          else if (cls === 'fake') breakdown.fake = grp.count;
          else if (cls === 'unverified') breakdown.unverified = grp.count;

          if (grp.avgScore) {
            scoreSum += grp.avgScore * grp.count;
            scoreCount += grp.count;
          }
        }

        const repDocs = await ReportModel.find({
          $or: [{ userId }, { userId: userId.toString() }],
        })
          .sort({ createdAt: -1 })
          .limit(10);
        reports = repDocs.map((d) => (d.toJSON ? d.toJSON() : d));
      } catch (err) {
        console.warn('[AdminUserService] DB fetch user details error:', err);
      }
    }

    const averageScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;

    return {
      user,
      verificationStats: {
        total: totalVerifications,
        breakdown,
        averageScore,
      },
      recentVerifications,
      reports,
    };
  }

  /**
   * Updates user status (ACTIVE | SUSPENDED)
   */
  async updateUserStatus(
    targetUserId: string,
    params: {
      status: UserStatus;
      reason?: string;
      adminId: string;
      adminEmail?: string;
      adminName?: string;
    }
  ): Promise<SafeUser> {
    if (params.adminId === targetUserId && params.status === 'SUSPENDED') {
      throw ApiError.badRequest('You cannot suspend your own active administrative account.');
    }

    let updatedUser: SafeUser | null = null;

    if (isDatabaseConnected() && mongoose.isValidObjectId(targetUserId)) {
      try {
        const doc = await UserModel.findByIdAndUpdate(
          targetUserId,
          {
            status: params.status,
            ...(params.status === 'SUSPENDED' ? { refresh_tokens: [] } : {}),
          },
          { new: true }
        );
        if (doc) updatedUser = doc.toSafeObject();
      } catch (err) {
        console.warn('[AdminUserService] DB status update error:', err);
      }
    }

    if (!updatedUser) {
      const storeUser = await userStore.findById(targetUserId);
      if (storeUser) {
        const updated = await userStore.update(targetUserId, {
          status: params.status,
          ...(params.status === 'SUSPENDED' ? { refresh_tokens: [] } : {}),
        });
        if (updated) {
          updatedUser = {
            id: updated.id,
            name: updated.full_name,
            email: updated.email,
            role: updated.role,
            status: updated.status,
            organization: updated.organization,
            roleTitle: updated.role_title,
            bio: updated.bio,
            phone: updated.phone,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
          };
        }
      }
    }

    if (!updatedUser) {
      throw ApiError.notFound('Target user not found.');
    }

    await adminAuditService.logAction({
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      adminName: params.adminName,
      action: params.status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      resourceType: 'USER',
      resourceId: targetUserId,
      description: `User ${updatedUser.email} status changed to ${params.status}. Reason: ${params.reason || 'No reason provided'}`,
      metadata: { targetUserEmail: updatedUser.email, newStatus: params.status, reason: params.reason },
    });

    return updatedUser;
  }

  /**
   * Updates user role (USER | ADMIN)
   */
  async updateUserRole(
    targetUserId: string,
    params: {
      role: UserRole;
      reason?: string;
      adminId: string;
      adminEmail?: string;
      adminName?: string;
    }
  ): Promise<SafeUser> {
    if (params.adminId === targetUserId && params.role === 'USER') {
      throw ApiError.badRequest('Cannot revoke your own administrative privileges.');
    }

    // Protect against removing the last admin
    if (params.role === 'USER') {
      if (isDatabaseConnected()) {
        const adminCount = await UserModel.countDocuments({ role: 'ADMIN', status: 'ACTIVE' });
        if (adminCount <= 1) {
          throw ApiError.badRequest('Cannot demote the last remaining active administrator.');
        }
      } else {
        const all = await userStore.getAll();
        const adminCount = all.filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE').length;
        if (adminCount <= 1) {
          throw ApiError.badRequest('Cannot demote the last remaining active administrator.');
        }
      }
    }

    let updatedUser: SafeUser | null = null;

    if (isDatabaseConnected() && mongoose.isValidObjectId(targetUserId)) {
      try {
        const doc = await UserModel.findByIdAndUpdate(
          targetUserId,
          { role: params.role },
          { new: true }
        );
        if (doc) updatedUser = doc.toSafeObject();
      } catch (err) {
        console.warn('[AdminUserService] DB role update error:', err);
      }
    }

    if (!updatedUser) {
      const storeUser = await userStore.findById(targetUserId);
      if (storeUser) {
        const updated = await userStore.update(targetUserId, { role: params.role });
        if (updated) {
          updatedUser = {
            id: updated.id,
            name: updated.full_name,
            email: updated.email,
            role: updated.role,
            status: updated.status,
            organization: updated.organization,
            roleTitle: updated.role_title,
            bio: updated.bio,
            phone: updated.phone,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
          };
        }
      }
    }

    if (!updatedUser) {
      throw ApiError.notFound('Target user not found.');
    }

    await adminAuditService.logAction({
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      adminName: params.adminName,
      action: 'ROLE_CHANGED',
      resourceType: 'USER',
      resourceId: targetUserId,
      description: `User ${updatedUser.email} role changed to ${params.role}. Reason: ${params.reason || 'No reason provided'}`,
      metadata: { targetUserEmail: updatedUser.email, newRole: params.role, reason: params.reason },
    });

    return updatedUser;
  }

  /**
   * Soft-deletes / suspends user account while preserving historical audit records
   */
  async deleteUser(
    targetUserId: string,
    params: {
      adminId: string;
      adminEmail?: string;
      adminName?: string;
      reason?: string;
    }
  ): Promise<boolean> {
    if (params.adminId === targetUserId) {
      throw ApiError.badRequest('You cannot delete your own active administrative account.');
    }

    const user = await this.updateUserStatus(targetUserId, {
      status: 'SUSPENDED',
      reason: `Account deactivated by administrator deletion request. ${params.reason || ''}`,
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      adminName: params.adminName,
    });

    await adminAuditService.logAction({
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      adminName: params.adminName,
      action: 'USER_DELETED',
      resourceType: 'USER',
      resourceId: targetUserId,
      description: `User ${user.email} marked for deletion/suspension.`,
      metadata: { targetUserEmail: user.email, reason: params.reason },
    });

    return true;
  }
}

export const adminUserService = new AdminUserService();
