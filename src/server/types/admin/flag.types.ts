export type FlagReason =
  | 'INCORRECT_RESULT'
  | 'MISLEADING_INFORMATION'
  | 'INSUFFICIENT_EVIDENCE'
  | 'WRONG_SOURCE'
  | 'OTHER';

export type FlagStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';

export interface IFlag {
  _id?: string;
  id: string;
  verificationId: string;
  reportedBy: string;
  reporterName?: string;
  reason: FlagReason;
  description: string;
  status: FlagStatus;
  resolvedBy?: string;
  resolverName?: string;
  resolvedAt?: Date | string;
  resolutionNotes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FlagFilterOptions {
  page?: number;
  limit?: number;
  status?: FlagStatus;
  reason?: FlagReason;
  verificationId?: string;
  search?: string;
}
