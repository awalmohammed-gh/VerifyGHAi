import { isDatabaseConnected } from '../../config/database.js';
import { AlertModel } from '../../models/Alert.js';
import {
  AlertFilterOptions,
  AlertSeverity,
  AlertStatus,
  AlertType,
  IAlert,
} from '../../types/admin/alert.types.js';
import { ApiError } from '../../utils/apiError.js';
import { adminAuditService } from './admin-audit.service.js';

function formatAlertDoc(doc: any): IAlert {
  const json = doc.toJSON ? doc.toJSON() : doc;
  return {
    ...json,
    id: json.id || json._id?.toString() || '',
  };
}

export class AdminAlertService {
  private inMemoryAlerts: IAlert[] = [];

  /**
   * Generates a new administrative alert
   */
  async createAlert(params: {
    type: AlertType;
    title: string;
    message: string;
    severity?: AlertSeverity;
    relatedVerificationId?: string;
    relatedUserId?: string;
  }): Promise<IAlert> {
    const alert: IAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: params.type,
      title: params.title,
      message: params.message,
      severity: params.severity || 'MEDIUM',
      status: 'OPEN',
      relatedVerificationId: params.relatedVerificationId,
      relatedUserId: params.relatedUserId,
      createdAt: new Date(),
    };

    if (isDatabaseConnected()) {
      try {
        const doc = await AlertModel.create({
          type: alert.type,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          status: alert.status,
          relatedVerificationId: alert.relatedVerificationId,
          relatedUserId: alert.relatedUserId,
        });
        return formatAlertDoc(doc);
      } catch (err) {
        console.warn('[AdminAlertService] DB create error:', err);
      }
    }

    this.inMemoryAlerts.unshift(alert);
    return alert;
  }

  /**
   * Retrieves paginated alerts with filters
   */
  async getAlerts(options: AlertFilterOptions): Promise<{
    items: IAlert[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    openCount: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    if (isDatabaseConnected()) {
      try {
        const query: Record<string, any> = {};

        if (options.type) query.type = options.type;
        if (options.severity) query.severity = options.severity;
        if (options.status) query.status = options.status;
        if (options.search) {
          const searchRegex = new RegExp(options.search.trim(), 'i');
          query.$or = [{ title: searchRegex }, { message: searchRegex }];
        }

        const total = await AlertModel.countDocuments(query);
        const openCount = await AlertModel.countDocuments({ status: 'OPEN' });
        const docs = await AlertModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        const items = docs.map((d) => formatAlertDoc(d));
        const totalPages = Math.ceil(total / limit) || 1;

        return { items, total, page, limit, totalPages, openCount };
      } catch (err) {
        console.warn('[AdminAlertService] DB list error:', err);
      }
    }

    let filtered = [...this.inMemoryAlerts];

    if (options.type) filtered = filtered.filter((a) => a.type === options.type);
    if (options.severity) filtered = filtered.filter((a) => a.severity === options.severity);
    if (options.status) filtered = filtered.filter((a) => a.status === options.status);
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (a) => a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q)
      );
    }

    const openCount = this.inMemoryAlerts.filter((a) => a.status === 'OPEN').length;
    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return { items, total, page, limit, totalPages, openCount };
  }

  /**
   * Retrieves single alert by ID
   */
  async getAlertById(id: string): Promise<IAlert> {
    if (isDatabaseConnected()) {
      try {
        const doc = await AlertModel.findById(id);
        if (doc) return formatAlertDoc(doc);
      } catch (err) {
        console.warn('[AdminAlertService] DB getById error:', err);
      }
    }

    const alert = this.inMemoryAlerts.find((a) => a.id === id);
    if (!alert) {
      throw ApiError.notFound('Alert not found.');
    }
    return alert;
  }

  /**
   * Updates status of an alert (e.g. RESOLVED, INVESTIGATING)
   */
  async updateAlertStatus(
    id: string,
    params: {
      status: AlertStatus;
      resolutionNotes?: string;
      adminId: string;
      adminEmail?: string;
      adminName?: string;
    }
  ): Promise<IAlert> {
    let alert = await this.getAlertById(id);

    const isResolved = params.status === 'RESOLVED' || params.status === 'DISMISSED';
    const resolvedAt = isResolved ? new Date() : undefined;

    if (isDatabaseConnected()) {
      try {
        const doc = await AlertModel.findByIdAndUpdate(
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
          alert = formatAlertDoc(doc);
        }
      } catch (err) {
        console.warn('[AdminAlertService] DB update error:', err);
      }
    } else {
      alert.status = params.status;
      if (params.resolutionNotes) alert.resolutionNotes = params.resolutionNotes;
      alert.resolvedBy = params.adminId;
      alert.resolverName = params.adminName || params.adminEmail || 'Admin';
      alert.resolvedAt = resolvedAt;
    }

    // Log the audit event
    await adminAuditService.logAction({
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      adminName: params.adminName,
      action: 'ALERT_RESOLVED',
      resourceType: 'ALERT',
      resourceId: id,
      description: `Alert marked as ${params.status}. Notes: ${params.resolutionNotes || 'None'}`,
      metadata: { newStatus: params.status, notes: params.resolutionNotes },
    });

    return alert;
  }
}

export const adminAlertService = new AdminAlertService();
