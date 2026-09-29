export type SourceStatus = 'VERIFIED' | 'TRUSTED' | 'UNKNOWN' | 'SUSPICIOUS' | 'UNRELIABLE';

export interface ISource {
  _id?: string;
  id?: string;
  name: string;
  domain: string;
  description?: string;
  credibilityScore: number;
  status: SourceStatus;
  verificationStatus?: string;
  lastUpdated?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
