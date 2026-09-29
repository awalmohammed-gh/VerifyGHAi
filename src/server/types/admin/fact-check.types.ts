import { ClassificationType, IEvidence } from '../verification.types.js';
import { ISource } from '../source.types.js';

export type FactCheckStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface IFactCheck {
  _id?: string;
  id: string;
  title: string;
  claim: string;
  classification: ClassificationType;
  summary: string;
  evidence: Array<string | IEvidence>;
  sources: Array<string | ISource>;
  publishedDate: Date | string;
  createdBy: string;
  creatorName?: string;
  updatedBy: string;
  status: FactCheckStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateFactCheckDto {
  title: string;
  claim: string;
  classification: ClassificationType;
  summary: string;
  evidence?: Array<string | IEvidence>;
  sources?: Array<string | ISource>;
  publishedDate?: string | Date;
  status?: FactCheckStatus;
}

export interface UpdateFactCheckDto {
  title?: string;
  claim?: string;
  classification?: ClassificationType;
  summary?: string;
  evidence?: Array<string | IEvidence>;
  sources?: Array<string | ISource>;
  publishedDate?: string | Date;
  status?: FactCheckStatus;
}

export interface FactCheckFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  classification?: ClassificationType;
  status?: FactCheckStatus;
  from?: string;
  to?: string;
}
