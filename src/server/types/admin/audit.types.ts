export type AuditAction =
  | 'USER_SUSPENDED'
  | 'USER_REACTIVATED'
  | 'ROLE_CHANGED'
  | 'USER_DELETED'
  | 'VERIFICATION_REVIEWED'
  | 'VERIFICATION_CLASSIFICATION_CHANGED'
  | 'VERIFICATION_DELETED'
  | 'SOURCE_CREATED'
  | 'SOURCE_UPDATED'
  | 'SOURCE_DELETED'
  | 'FACT_CHECK_CREATED'
  | 'FACT_CHECK_UPDATED'
  | 'FACT_CHECK_DELETED'
  | 'FLAG_RESOLVED'
  | 'FLAG_REJECTED'
  | 'ALERT_RESOLVED'
  | 'ALERT_INVESTIGATED';

export type AuditResourceType =
  | 'USER'
  | 'VERIFICATION'
  | 'SOURCE'
  | 'FACT_CHECK'
  | 'FLAG'
  | 'ALERT'
  | 'SYSTEM';

export interface IAuditLog {
  _id?: string;
  id: string;
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
  createdAt: Date | string;
}

export interface AuditLogFilterOptions {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  resourceId?: string;
  search?: string;
  from?: string;
  to?: string;
}
