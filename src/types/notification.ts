import { Classification } from './verification';

export type NotificationType =
  | 'VERIFICATION_COMPLETED'
  | 'SUSPICIOUS_RESULT'
  | 'LOW_CREDIBILITY_SOURCE'
  | 'SYSTEM_ALERT'
  | 'REPORT_SAVED';

export interface UserNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedResultId?: string;
  classification?: Classification;
}
