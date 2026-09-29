import { isDatabaseConnected } from '../../config/database.js';
import { AuditLogModel } from '../../models/AuditLog.js';
import {
  AuditAction,
  AuditLogFilterOptions,
  AuditResourceType,
  IAuditLog,
} from '../../types/admin/audit.types.js';
import { ApiError } from '../../utils/apiError.js';

function formatAuditDoc(doc: any): IAuditLog {
  const json = doc.toJSON ? doc.toJSON() : doc;
  return {
    ...json,
    id: json.id || json._id?.toString() || '',
  };
}

export class AdminAuditService {
  private inMemoryAuditLogs: IAuditLog[] = [
    {
      id: 'audit_init_1',
      adminId: 'usr_admin_dion_001',
      adminEmail: 'dion12@gmail.com',
      adminName: 'Dion Malik Deh',
      action: 'ALERT_RESOLVED',
      resourceType: 'SYSTEM',
      resourceId: 'verifai_core',
      description: 'System initialization and administrative audit log pipeline activated by Lead Administrator Dion Malik Deh.',
      metadata: { event: 'INITIALIZATION', environment: 'production-ready' },
      ipAddress: '127.0.0.1',
      userAgent: 'VerifAI-Core/1.0',
      createdAt: new Date(Date.now() - 3600000 * 24),
    },
  ];

  /**
   * Appends an immutable audit log entry
   */
  async logAction(params: {
    adminId: string;
    adminEmail?: string;
    adminName?: string;
    action: AuditAction;
    resourceType: AuditResourceType;
    resourceId: string;
    description: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<IAuditLog> {
    const entry: IAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      adminId: params.adminId,
      adminEmail: params.adminEmail || '',
      adminName: params.adminName || '',
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      description: params.description,
      metadata: params.metadata || {},
      ipAddress: params.ipAddress || '',
      userAgent: params.userAgent || '',
      createdAt: new Date(),
    };

    if (isDatabaseConnected()) {
      try {
        const doc = await AuditLogModel.create({
          adminId: params.adminId,
          adminEmail: params.adminEmail,
          adminName: params.adminName,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          description: params.description,
          metadata: params.metadata,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        });
        return formatAuditDoc(doc);
      } catch (err) {
        console.warn('[AdminAuditService] DB create error:', err);
      }
    }

    this.inMemoryAuditLogs.unshift(entry);
    return entry;
  }

  /**
   * Retrieves paginated audit logs with search and filtering
   */
  async getAuditLogs(options: AuditLogFilterOptions): Promise<{
    items: IAuditLog[];
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

        if (options.adminId) {
          query.adminId = options.adminId;
        }
        if (options.action) {
          query.action = options.action;
        }
        if (options.resourceType) {
          query.resourceType = options.resourceType;
        }
        if (options.resourceId) {
          query.resourceId = options.resourceId;
        }
        if (options.search) {
          const searchRegex = new RegExp(options.search.trim(), 'i');
          query.$or = [
            { description: searchRegex },
            { adminEmail: searchRegex },
            { adminName: searchRegex },
            { action: searchRegex },
            { resourceId: searchRegex },
          ];
        }
        if (options.from || options.to) {
          query.createdAt = {};
          if (options.from) query.createdAt.$gte = new Date(options.from);
          if (options.to) query.createdAt.$lte = new Date(options.to);
        }

        const total = await AuditLogModel.countDocuments(query);
        const docs = await AuditLogModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        const items = docs.map((d) => formatAuditDoc(d));
        const totalPages = Math.ceil(total / limit) || 1;

        return { items, total, page, limit, totalPages };
      } catch (err) {
        console.warn('[AdminAuditService] DB list error:', err);
      }
    }

    let filtered = [...this.inMemoryAuditLogs];

    if (options.adminId) {
      filtered = filtered.filter((l) => l.adminId === options.adminId);
    }
    if (options.action) {
      filtered = filtered.filter((l) => l.action === options.action);
    }
    if (options.resourceType) {
      filtered = filtered.filter((l) => l.resourceType === options.resourceType);
    }
    if (options.resourceId) {
      filtered = filtered.filter((l) => l.resourceId === options.resourceId);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.description?.toLowerCase().includes(q) ||
          l.adminEmail?.toLowerCase().includes(q) ||
          l.adminName?.toLowerCase().includes(q) ||
          l.action?.toLowerCase().includes(q) ||
          l.resourceId?.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return { items, total, page, limit, totalPages };
  }

  /**
   * Retrieves single audit log entry by ID
   */
  async getAuditLogById(id: string): Promise<IAuditLog> {
    if (isDatabaseConnected()) {
      try {
        const doc = await AuditLogModel.findById(id);
        if (doc) return formatAuditDoc(doc);
      } catch (err) {
        console.warn('[AdminAuditService] DB getById error:', err);
      }
    }

    const entry = this.inMemoryAuditLogs.find((l) => l.id === id);
    if (!entry) {
      throw ApiError.notFound('Audit log entry not found.');
    }
    return entry;
  }
}

export const adminAuditService = new AdminAuditService();
