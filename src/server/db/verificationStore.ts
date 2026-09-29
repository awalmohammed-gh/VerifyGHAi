import { IVerification, VerificationFilterOptions } from '../types/verification.types.js';

// Clean verification store without dummy / pre-seeded records.
// All data originates from real user submissions and live search.
const INITIAL_VERIFICATIONS: IVerification[] = [];

class VerificationStore {
  private verifications: Map<string, IVerification> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    for (const item of INITIAL_VERIFICATIONS) {
      this.verifications.set(item.id, { ...item });
    }
  }

  public async findById(id: string): Promise<IVerification | null> {
    if (!id) return null;
    const direct = this.verifications.get(id);
    if (direct) return { ...direct };

    for (const item of this.verifications.values()) {
      if (item.id === id || (item as any)._id?.toString() === id || (item as any).customId === id) {
        return { ...item };
      }
    }
    return null;
  }

  public async findByUserId(userId: string): Promise<IVerification[]> {
    const target = userId.toString();
    return Array.from(this.verifications.values())
      .filter((v) => v.userId === target || v.userId?.toString() === target)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async query(options: VerificationFilterOptions): Promise<{
    items: IVerification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    let list = Array.from(this.verifications.values());

    if (options.userId) {
      const u = options.userId.toString();
      list = list.filter((v) => v.userId === u || v.userId?.toString() === u);
    }

    if (options.classification) {
      list = list.filter((v) => v.automatedResult?.classification === options.classification);
    }

    if (options.type) {
      list = list.filter((v) => v.submissionType === options.type);
    }

    if (options.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.originalContent?.toLowerCase().includes(q) ||
          v.sourceUrl?.toLowerCase().includes(q) ||
          v.explanation?.toLowerCase().includes(q)
      );
    }

    if (options.from) {
      const fromTime = new Date(options.from).getTime();
      list = list.filter((v) => new Date(v.createdAt).getTime() >= fromTime);
    }

    if (options.to) {
      const toTime = new Date(options.to).getTime();
      list = list.filter((v) => new Date(v.createdAt).getTime() <= toTime);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const items = list.slice(skip, skip + limit).map((v) => ({ ...v }));
    const totalPages = Math.ceil(total / limit) || 1;

    return { items, total, page, limit, totalPages };
  }

  public async create(verification: IVerification): Promise<IVerification> {
    const item = { ...verification };
    this.verifications.set(item.id, item);
    return { ...item };
  }

  public async update(id: string, updates: Partial<IVerification>): Promise<IVerification | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date(),
    };

    this.verifications.set(existing.id, updated);
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (existing) {
      return this.verifications.delete(existing.id);
    }
    return false;
  }

  public async count(): Promise<number> {
    return this.verifications.size;
  }

  public async getAll(): Promise<IVerification[]> {
    return Array.from(this.verifications.values())
      .map((v) => ({ ...v }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const verificationStore = new VerificationStore();
