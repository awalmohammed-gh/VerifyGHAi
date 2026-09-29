import mongoose from 'mongoose';
import { isDatabaseConnected } from '../../config/database.js';
import { VerificationModel } from '../../models/Verification.js';
import { UserModel } from '../../models/User.js';
import { env } from '../../config/environment.js';
import {
  CreateReviewDto,
  IHumanReview,
  IReviewQueueItem,
  ReviewStatus,
  UpdateReviewDto,
} from '../../types/admin/review.types.js';
import { ApiError } from '../../utils/apiError.js';
import { adminAuditService } from './admin-audit.service.js';
import { notifyStatsChanged } from '../verificationStats.service.js';

export class AdminReviewService {
  /**
   * Lists items in the human review queue
   */
  async getReviewQueue(options: {
    page?: number;
    limit?: number;
    status?: ReviewStatus;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    search?: string;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    pendingCount: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    if (isDatabaseConnected()) {
      try {
        const query: Record<string, any> = {
          $or: [
            { status: 'PENDING_REVIEW' },
            { status: 'REVIEWED' },
            { reviewStatus: { $in: ['PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED'] } },
            { 'automatedResult.confidence': { $lt: env.AI_CONFIDENCE_THRESHOLD } },
            { 'automatedResult.classification': 'SUSPICIOUS' },
          ],
        };

        if (options.status) {
          query.reviewStatus = options.status;
        }

        if (options.search) {
          const searchRegex = new RegExp(options.search.trim(), 'i');
          query.$and = [
            {
              $or: [
                { originalContent: searchRegex },
                { sourceUrl: searchRegex },
                { explanation: searchRegex },
              ],
            },
          ];
        }

        const total = await VerificationModel.countDocuments(query);
        const pendingCount = await VerificationModel.countDocuments({
          $or: [{ status: 'PENDING_REVIEW' }, { reviewStatus: 'PENDING' }],
        });

        const docs = await VerificationModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        const items = await Promise.all(
          docs.map(async (d) => {
            const v = d.toJSON ? d.toJSON() : (d as any);
            let userName = 'Unknown User';
            try {
              if (mongoose.isValidObjectId(v.userId)) {
                const u = await UserModel.findById(v.userId);
                if (u) userName = u.name;
              }
            } catch {
              // fallback
            }

            // Calculate priority
            let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
            let triggerReason = 'Standard verification queue item';

            if (v.automatedResult) {
              if (v.automatedResult.confidence < 0.4 || v.automatedResult.classification === 'FAKE') {
                priority = 'CRITICAL';
                triggerReason = 'Critical low confidence or high-risk fake classification';
              } else if (v.automatedResult.confidence < env.AI_CONFIDENCE_THRESHOLD) {
                priority = 'HIGH';
                triggerReason = `AI confidence (${v.automatedResult.confidence.toFixed(2)}) below required threshold (${env.AI_CONFIDENCE_THRESHOLD})`;
              } else if (v.automatedResult.classification === 'SUSPICIOUS') {
                priority = 'MEDIUM';
                triggerReason = 'Suspicious classification flagged for human cross-examination';
              }
            }

            return {
              id: v.id,
              verificationId: v.id,
              userId: v.userId,
              userName,
              submissionType: v.submissionType,
              originalContent: v.originalContent,
              sourceUrl: v.sourceUrl,
              imageUrl: v.imageUrl,
              automatedResult: v.automatedResult,
              humanReview: v.humanReview,
              reviewStatus: v.reviewStatus || (v.humanReview ? 'COMPLETED' : 'PENDING'),
              priority,
              triggerReason: v.triggerReason || triggerReason,
              assignedReviewerId: v.assignedReviewerId,
              assignedReviewerName: v.assignedReviewerName,
              assignedAt: v.assignedAt,
              claims: v.claims || [],
              evidence: v.evidence || [],
              sources: v.sources || [],
              indicators: v.indicators || [],
              createdAt: v.createdAt,
              updatedAt: v.updatedAt,
            };
          })
        );

        const totalPages = Math.ceil(total / limit) || 1;
        return { items, total, page, limit, totalPages, pendingCount };
      } catch (err) {
        console.warn('[AdminReviewService] DB queue list error:', err);
      }
    }

    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
      pendingCount: 0,
    };
  }

  /**
   * Retrieves single review item details by verification ID
   */
  async getReviewById(id: string): Promise<any> {
    if (isDatabaseConnected()) {
      try {
        const doc = await VerificationModel.findById(id);
        if (doc) {
          const v = doc.toJSON ? doc.toJSON() : (doc as any);
          let user: any = null;
          try {
            if (mongoose.isValidObjectId(v.userId)) {
              const u = await UserModel.findById(v.userId);
              if (u) user = u.toSafeObject();
            }
          } catch {
            // fallback
          }

          return {
            ...v,
            user: user || { id: v.userId, name: 'Anonymous User' },
          };
        }
      } catch (err) {
        console.warn('[AdminReviewService] DB getReviewById error:', err);
      }
    }

    throw ApiError.notFound('Review item not found.');
  }

  /**
   * Submits a human review decision, preserving the original AI result intact
   */
  async submitReview(
    verificationId: string,
    data: CreateReviewDto,
    admin: { id: string; email?: string; name?: string }
  ): Promise<any> {
    if (!isDatabaseConnected()) {
      throw ApiError.badRequest('Database connection required for human review persistence.');
    }

    const doc = await VerificationModel.findById(verificationId);
    if (!doc) {
      throw ApiError.notFound('Verification record not found.');
    }

    const automatedClassification = doc.automatedResult?.classification || 'UNVERIFIED';
    const isOverride = automatedClassification !== data.finalClassification;

    const humanReview: IHumanReview = {
      reviewerId: admin.id,
      reviewerName: admin.name || admin.email || 'Admin Reviewer',
      finalClassification: data.finalClassification,
      finalCredibilityScore: data.finalCredibilityScore,
      reviewReason: data.reviewReason,
      reviewNotes: data.reviewNotes || '',
      reviewedAt: new Date(),
      reviewStatus: data.reviewStatus || 'COMPLETED',
    };

    // Update doc: keep automatedResult intact, attach humanReview, set reviewStatus and status
    doc.humanReview = humanReview as any;
    doc.adminClassification = data.finalClassification;
    doc.adminCredibilityScore = data.finalCredibilityScore;
    doc.adminNotes = data.reviewNotes || data.reviewReason;
    doc.reviewedBy = admin.name || admin.email || 'Admin Reviewer';
    doc.reviewedAt = new Date();
    doc.reviewStatus = data.reviewStatus || 'COMPLETED';
    doc.status = 'REVIEWED';
    await doc.save();

    // Broadcast stats revalidation so all dashboards update immediately
    notifyStatsChanged({
      userId: doc.userId?.toString(),
      action: 'ADMIN_OVERRIDE_REVIEW',
      verificationId,
    });

    // Log the review action in immutable audit log
    await adminAuditService.logAction({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: isOverride ? 'VERIFICATION_CLASSIFICATION_CHANGED' : 'VERIFICATION_REVIEWED',
      resourceType: 'VERIFICATION',
      resourceId: verificationId,
      description: isOverride
        ? `Overrode AI classification from ${automatedClassification} to ${data.finalClassification}. Reason: ${data.reviewReason}`
        : `Confirmed verification result as ${data.finalClassification}. Notes: ${data.reviewReason}`,
      metadata: {
        verificationId,
        aiClassification: automatedClassification,
        humanClassification: data.finalClassification,
        aiScore: doc.automatedResult?.credibilityScore,
        finalScore: data.finalCredibilityScore,
        reason: data.reviewReason,
        notes: data.reviewNotes,
        isOverride,
      },
    });

    return doc.toJSON ? doc.toJSON() : doc;
  }

  /**
   * Updates an existing review or assigns reviewer
   */
  async updateReview(
    id: string,
    data: UpdateReviewDto,
    admin: { id: string; email?: string; name?: string }
  ): Promise<any> {
    if (!isDatabaseConnected()) {
      throw ApiError.badRequest('Database connection required.');
    }

    const doc = await VerificationModel.findById(id);
    if (!doc) {
      throw ApiError.notFound('Review item not found.');
    }

    if (data.assignedReviewerId) {
      doc.assignedReviewerId = data.assignedReviewerId;
      doc.assignedAt = new Date();
      doc.reviewStatus = 'IN_REVIEW';
    }

    if (data.finalClassification && data.finalCredibilityScore !== undefined && data.reviewReason) {
      doc.humanReview = {
        reviewerId: admin.id,
        reviewerName: admin.name || admin.email || 'Admin Reviewer',
        finalClassification: data.finalClassification,
        finalCredibilityScore: data.finalCredibilityScore,
        reviewReason: data.reviewReason,
        reviewNotes: data.reviewNotes || '',
        reviewedAt: new Date(),
        reviewStatus: data.reviewStatus || 'COMPLETED',
      } as any;
      doc.status = 'REVIEWED';
      doc.reviewStatus = data.reviewStatus || 'COMPLETED';
    }

    await doc.save();

    await adminAuditService.logAction({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: 'VERIFICATION_REVIEWED',
      resourceType: 'VERIFICATION',
      resourceId: id,
      description: `Updated review for verification #${id}`,
      metadata: { reviewId: id, changes: data },
    });

    return doc.toJSON ? doc.toJSON() : doc;
  }
}

export const adminReviewService = new AdminReviewService();
