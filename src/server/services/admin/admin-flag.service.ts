import { isDatabaseConnected } from '../../config/database.js';
import { FlagModel } from '../../models/Flag.js';
import {
  FlagFilterOptions,
  FlagReason,
  FlagStatus,
  IFlag,
} from '../../types/admin/flag.types.js';
import { ApiError } from '../../utils/apiError.js';
import { adminAuditService } from './admin-audit.service.js';

function formatFlagDoc(doc: any): IFlag {
  const json = doc.toJSON ? doc.toJSON() : doc;
  return {
    ...json,
    id: json.id || json._id?.toString() || '',
  };
}

export class AdminFlagService {
  private inMemoryFlags: IFlag[] = [];

  /**
   * Retrieves paginated content flags
   */
  async getFlags(options: FlagFilterOptions): Promise<{
    items: IFlag[];
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
        const query: Record<string, any> = {};

        if (options.status) query.status = options.status;
        if (options.reason) query.reason = options.reason;
        if (options.verificationId) query.verificationId = options.verificationId;
        if (options.search) {
          const searchRegex = new RegExp(options.search.trim(), 'i');
          query.$or = [
            { description: searchRegex },
            { reporterName: searchRegex },
            { verificationId: searchRegex },
          ];
        }

        const total = await FlagModel.countDocuments(query);
        const pendingCount = await FlagModel.countDocuments({ status: 'PENDING' });
        const docs = await FlagModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        const items = docs.map((d) => formatFlagDoc(d));
        const totalPages = Math.ceil(total / limit) || 1;

        return { items, total, page, limit, totalPages, pendingCount };
      } catch (err) {
        console.warn('[AdminFlagService] DB list error:', err);
      }
    }

    let filtered = [...this.inMemoryFlags];

    if (options.status) filtered = filtered.filter((f) => f.status === options.status);
    if (options.reason) filtered = filtered.filter((f) => f.reason === options.reason);
    if (options.verificationId) filtered = filtered.filter((f) => f.verificationId === options.verificationId);
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.description.toLowerCase().includes(q) ||
          f.reporterName?.toLowerCase().includes(q) ||
          f.verificationId.toLowerCase().includes(q)
      );
    }

    const pendingCount = this.inMemoryFlags.filter((f) => f.status === 'PENDING').length;
    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return { items, total, page, limit, totalPages, pendingCount };
  }

  /**
   * Creates a new content flag / incorrect verdict report
   */
  async createFlag(params: {
    verificationId: string;
    reportedBy: string;
    reporterName?: string;
    reason: FlagReason;
    description: string;
  }): Promise<IFlag> {
    const flagData = {
      verificationId: params.verificationId,
      reportedBy: params.reportedBy,
      reporterName: params.reporterName || 'User',
      reason: params.reason || 'INCORRECT_RESULT',
      description: params.description,
      status: 'PENDING' as FlagStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isDatabaseConnected()) {
      try {
        const doc = await FlagModel.create(flagData);
        return formatFlagDoc(doc);
      } catch (err) {
        console.warn('[AdminFlagService] DB create flag error:', err);
      }
    }

    const inMemFlag: IFlag = {
      id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...flagData,
    };
    this.inMemoryFlags.unshift(inMemFlag);
    return inMemFlag;
  }

  /**
   * Retrieves single flag by ID
   */
  async getFlagById(id: string): Promise<IFlag> {
    if (isDatabaseConnected()) {
      try {
        const doc = await FlagModel.findById(id);
        if (doc) return formatFlagDoc(doc);
      } catch (err) {
        console.warn('[AdminFlagService] DB getById error:', err);
      }
    }

    const flag = this.inMemoryFlags.find((f) => f.id === id);
    if (!flag) {
      throw ApiError.notFound('Content flag record not found.');
    }
    return flag;
  }

  /**
   * Updates flag resolution status
   */
  async updateFlagStatus(
    id: string,
    params: {
      status: FlagStatus;
      resolutionNotes?: string;
      adminId: string;
      adminEmail?: string;
      adminName?: string;
    }
  ): Promise<IFlag> {
    let flag = await this.getFlagById(id);

    const isResolved = params.status === 'RESOLVED' || params.status === 'REJECTED';
    const resolvedAt = isResolved ? new Date() : undefined;

    if (isDatabaseConnected()) {
      try {
        const doc = await FlagModel.findByIdAndUpdate(
          id,
          {
            status: params.status,
            resolutionNotes: params.resolutionNotes || '',
            resolvedBy: params.adminId,
            resolverName: params.adminName || params.adminEmail || 'Admin',
            resolvedAt,
          },
          { new: true }
        );
        if (doc) {
          flag = formatFlagDoc(doc);
        }
      } catch (err) {
        console.warn('[AdminFlagService] DB update error:', err);
      }
    } else {
      flag.status = params.status;
      if (params.resolutionNotes) flag.resolutionNotes = params.resolutionNotes;
      flag.resolvedBy = params.adminId;
      flag.resolverName = params.adminName || params.adminEmail || 'Admin';
      flag.resolvedAt = resolvedAt;
      flag.updatedAt = new Date();
    }

    await adminAuditService.logAction({
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      adminName: params.adminName,
      action: params.status === 'RESOLVED' ? 'FLAG_RESOLVED' : 'FLAG_REJECTED',
      resourceType: 'FLAG',
      resourceId: id,
      description: `Flag status updated to ${params.status}. Notes: ${params.resolutionNotes || 'None'}`,
      metadata: { newStatus: params.status, notes: params.resolutionNotes },
    });

    return flag;
  }
}

export const adminFlagService = new AdminFlagService();
