import mongoose from 'mongoose';
import { isDatabaseConnected } from '../../config/database.js';
import { VerificationModel } from '../../models/Verification.js';
import { UserModel } from '../../models/User.js';
import { userStore } from '../../db/userStore.js';
import { IVerification } from '../../types/verification.types.js';
import { AdminVerificationFilterOptions } from '../../types/admin/admin.types.js';
import { ApiError } from '../../utils/apiError.js';
import { adminAuditService } from './admin-audit.service.js';

export class AdminVerificationService {
  /**
   * Retrieves platform-wide verifications with advanced filtering & pagination
   */
  async listVerifications(options: AdminVerificationFilterOptions): Promise<{
    items: any[];
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

        if (options.status) {
          query.status = options.status;
        }

        if (options.classification) {
          query['automatedResult.classification'] = options.classification;
        }

        if (options.type) {
          query.submissionType = options.type;
        }

        if (options.confidence) {
          query['automatedResult.confidenceLabel'] = options.confidence;
        }

        if (options.search) {
          const searchRegex = new RegExp(options.search.trim(), 'i');
          query.$or = [
            { originalContent: searchRegex },
            { sourceUrl: searchRegex },
            { explanation: searchRegex },
            { 'claims.text': searchRegex },
          ];
        }

        if (options.from || options.to) {
          query.createdAt = {};
          if (options.from) query.createdAt.$gte = new Date(options.from);
          if (options.to) query.createdAt.$lte = new Date(options.to);
        }

        const total = await VerificationModel.countDocuments(query);
        const docs = await VerificationModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        const items = await Promise.all(
          docs.map(async (doc) => {
            const v = doc.toJSON ? doc.toJSON() : (doc as any);
            let userName = 'Unknown User';
            let userEmail = '';
            try {
              if (mongoose.isValidObjectId(v.userId)) {
                const u = await UserModel.findById(v.userId);
                if (u) {
                  userName = u.name;
                  userEmail = u.email;
                }
              }
            } catch {
              // fallback
            }
            return {
              ...v,
              user: {
                id: v.userId,
                name: userName,
                email: userEmail,
              },
            };
          })
        );

        const totalPages = Math.ceil(total / limit) || 1;
        return { items, total, page, limit, totalPages };
      } catch (err) {
        console.warn('[AdminVerificationService] DB list error:', err);
      }
    }

    // High-availability fallback
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    };
  }

  /**
   * Retrieves single verification with enriched user profile information
   */
  async getVerificationById(id: string): Promise<any> {
    let result: any = null;

    if (isDatabaseConnected()) {
      try {
        const doc = await VerificationModel.findById(id);
        if (doc) {
          result = doc.toJSON ? doc.toJSON() : (doc as any);
          let user: any = null;
          try {
            if (mongoose.isValidObjectId(result.userId)) {
              const u = await UserModel.findById(result.userId);
              if (u) {
                user = u.toSafeObject();
              }
            }
          } catch {
            // fallback
          }

          if (!user) {
            const su = await userStore.findById(result.userId);
            if (su) {
              user = {
                id: su.id,
                name: su.full_name,
                email: su.email,
                role: su.role,
              };
            }
          }

          result.user = user || { id: result.userId, name: 'Anonymous User', email: '' };
        }
      } catch (err) {
        console.warn('[AdminVerificationService] DB getById error:', err);
      }
    }

    if (!result) {
      throw ApiError.notFound('Verification submission record not found.');
    }

    return result;
  }

  /**
   * Admin-initiated deletion of verification record with audit logging
   */
  async deleteVerification(
    id: string,
    params: {
      adminId: string;
      adminEmail?: string;
      adminName?: string;
      reason?: string;
    }
  ): Promise<boolean> {
    let deleted = false;

    if (isDatabaseConnected()) {
      try {
        const doc = await VerificationModel.findByIdAndDelete(id);
        if (doc) deleted = true;
      } catch (err) {
        console.warn('[AdminVerificationService] DB delete error:', err);
      }
    }

    if (!deleted) {
      throw ApiError.notFound('Verification record not found or already removed.');
    }

    await adminAuditService.logAction({
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      adminName: params.adminName,
      action: 'VERIFICATION_DELETED',
      resourceType: 'VERIFICATION',
      resourceId: id,
      description: `Verification record #${id} removed by administrator. Reason: ${params.reason || 'Not specified'}`,
      metadata: { verificationId: id, reason: params.reason },
    });

    return true;
  }
}

export const adminVerificationService = new AdminVerificationService();
