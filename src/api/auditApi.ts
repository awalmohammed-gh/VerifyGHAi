import { apiClient } from '../services/api';
import { AuditLog } from '../types';

export const auditApi = {
  /**
   * Fetch paginated audit logs
   */
  getAuditLogs: async (params?: {
    action?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLog[]> => {
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
  },

  /**
   * Fetch single audit log by ID
   */
  getAuditLogById: async (id: string): Promise<AuditLog | null> => {
    const response = await apiClient.get(`/admin/audit/${id}`);
    const resData = response.data?.data || response.data;
    const log = resData.auditLog || resData;
    if (!log) return null;
    return {
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
    };
  },
};
