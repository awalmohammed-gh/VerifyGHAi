import { isDatabaseConnected } from '../../config/database.js';
import { SourceModel } from '../../models/Source.js';
import { ISource, SourceStatus } from '../../types/source.types.js';
import { ApiError } from '../../utils/apiError.js';
import { adminAuditService } from './admin-audit.service.js';

function formatSourceDoc(doc: any): ISource {
  const json = doc.toJSON ? doc.toJSON() : doc;
  return {
    ...json,
    _id: json._id?.toString() || json.id || '',
    id: json.id || json._id?.toString() || '',
  };
}

export class AdminSourceService {
  private inMemorySources: ISource[] = [
    {
      id: 'src_1',
      name: 'Ghana News Agency (GNA)',
      domain: 'gna.org.gh',
      description: 'Official national news agency of Ghana with high editorial verification standards.',
      credibilityScore: 92,
      status: 'VERIFIED',
      verificationStatus: 'REGISTRY_VERIFIED',
      lastUpdated: new Date(),
    },
    {
      id: 'src_2',
      name: 'Daily Graphic Online',
      domain: 'graphic.com.gh',
      description: 'Primary national daily newspaper publication in Ghana.',
      credibilityScore: 88,
      status: 'TRUSTED',
      verificationStatus: 'REGISTRY_VERIFIED',
      lastUpdated: new Date(),
    },
    {
      id: 'src_3',
      name: 'Citi Newsroom',
      domain: 'citinewsroom.com',
      description: 'Independent Ghanaian multimedia news platform.',
      credibilityScore: 85,
      status: 'TRUSTED',
      verificationStatus: 'REGISTRY_VERIFIED',
      lastUpdated: new Date(),
    },
    {
      id: 'src_4',
      name: 'Joy Online',
      domain: 'myjoyonline.com',
      description: 'Major Ghanaian commercial broadcast and digital news organization.',
      credibilityScore: 86,
      status: 'TRUSTED',
      verificationStatus: 'REGISTRY_VERIFIED',
      lastUpdated: new Date(),
    },
  ];

  /**
   * Retrieves paginated source registry
   */
  async listSources(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: SourceStatus;
  }): Promise<{
    items: ISource[];
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

        if (options.status) query.status = options.status;
        if (options.search) {
          const searchRegex = new RegExp(options.search.trim(), 'i');
          query.$or = [
            { name: searchRegex },
            { domain: searchRegex },
            { description: searchRegex },
          ];
        }

        const total = await SourceModel.countDocuments(query);
        const docs = await SourceModel.find(query)
          .sort({ credibilityScore: -1, name: 1 })
          .skip(skip)
          .limit(limit);

        const items = docs.map((d) => formatSourceDoc(d));
        const totalPages = Math.ceil(total / limit) || 1;

        return { items, total, page, limit, totalPages };
      } catch (err) {
        console.warn('[AdminSourceService] DB list error:', err);
      }
    }

    let filtered = [...this.inMemorySources];
    if (options.status) filtered = filtered.filter((s) => s.status === options.status);
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.domain.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return { items, total, page, limit, totalPages };
  }

  /**
   * Retrieves single source record by ID
   */
  async getSourceById(id: string): Promise<ISource> {
    if (isDatabaseConnected()) {
      try {
        const doc = await SourceModel.findById(id);
        if (doc) return formatSourceDoc(doc);
      } catch (err) {
        console.warn('[AdminSourceService] DB getById error:', err);
      }
    }

    const found = this.inMemorySources.find((s) => s.id === id || s._id === id);
    if (!found) {
      throw ApiError.notFound('Source registry entry not found.');
    }
    return found;
  }

  /**
   * Creates a new source registry entry
   */
  async createSource(
    data: {
      name: string;
      domain: string;
      description?: string;
      credibilityScore: number;
      status: SourceStatus;
      verificationStatus?: string;
      reason?: string;
    },
    admin: { id: string; email?: string; name?: string }
  ): Promise<ISource> {
    const domain = data.domain.toLowerCase().trim();

    if (isDatabaseConnected()) {
      const existing = await SourceModel.findOne({ domain });
      if (existing) {
        throw ApiError.conflict(`A source record for domain '${domain}' already exists.`);
      }

      const doc = await SourceModel.create({
        name: data.name,
        domain,
        description: data.description || '',
        credibilityScore: data.credibilityScore,
        status: data.status,
        verificationStatus: data.verificationStatus || 'VERIFIED_BY_ADMIN',
        lastUpdated: new Date(),
      });

      await adminAuditService.logAction({
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.name,
        action: 'SOURCE_CREATED',
        resourceType: 'SOURCE',
        resourceId: doc._id.toString(),
        description: `Created new source registry entry: ${data.name} (${domain}) with score ${data.credibilityScore}.`,
        metadata: { source: doc.toJSON() },
      });

      return formatSourceDoc(doc);
    }

    const newSource: ISource = {
      id: `src_${Date.now()}`,
      name: data.name,
      domain,
      description: data.description || '',
      credibilityScore: data.credibilityScore,
      status: data.status,
      verificationStatus: data.verificationStatus || 'VERIFIED_BY_ADMIN',
      lastUpdated: new Date(),
    };
    this.inMemorySources.push(newSource);

    await adminAuditService.logAction({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: 'SOURCE_CREATED',
      resourceType: 'SOURCE',
      resourceId: newSource.id!,
      description: `Created source registry entry: ${data.name} (${domain})`,
      metadata: { source: newSource },
    });

    return newSource;
  }

  /**
   * Updates an existing source and logs credibility score history
   */
  async updateSource(
    id: string,
    data: {
      name?: string;
      domain?: string;
      description?: string;
      credibilityScore?: number;
      status?: SourceStatus;
      verificationStatus?: string;
      reason?: string;
    },
    admin: { id: string; email?: string; name?: string }
  ): Promise<ISource> {
    const existing = await this.getSourceById(id);
    const oldScore = existing.credibilityScore;
    const newScore = data.credibilityScore !== undefined ? data.credibilityScore : oldScore;

    if (isDatabaseConnected()) {
      const doc = await SourceModel.findByIdAndUpdate(
        id,
        {
          ...(data.name ? { name: data.name } : {}),
          ...(data.domain ? { domain: data.domain.toLowerCase().trim() } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.credibilityScore !== undefined ? { credibilityScore: data.credibilityScore } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.verificationStatus ? { verificationStatus: data.verificationStatus } : {}),
          lastUpdated: new Date(),
        },
        { new: true }
      );

      if (!doc) {
        throw ApiError.notFound('Source record not found.');
      }

      await adminAuditService.logAction({
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.name,
        action: 'SOURCE_UPDATED',
        resourceType: 'SOURCE',
        resourceId: id,
        description: `Updated source ${doc.name} (${doc.domain}). Score: ${oldScore} -> ${newScore}. Reason: ${data.reason || 'Routine review'}`,
        metadata: {
          oldScore,
          newScore,
          oldStatus: existing.status,
          newStatus: data.status || existing.status,
          reason: data.reason,
        },
      });

      return formatSourceDoc(doc);
    }

    Object.assign(existing, {
      ...data,
      lastUpdated: new Date(),
    });

    await adminAuditService.logAction({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: 'SOURCE_UPDATED',
      resourceType: 'SOURCE',
      resourceId: id,
      description: `Updated source ${existing.name}. Score: ${oldScore} -> ${newScore}.`,
      metadata: { oldScore, newScore, reason: data.reason },
    });

    return existing;
  }

  /**
   * Deletes a source registry record
   */
  async deleteSource(
    id: string,
    admin: { id: string; email?: string; name?: string }
  ): Promise<boolean> {
    const existing = await this.getSourceById(id);

    if (isDatabaseConnected()) {
      await SourceModel.findByIdAndDelete(id);
    } else {
      const idx = this.inMemorySources.findIndex((s) => s.id === id || s._id === id);
      if (idx !== -1) this.inMemorySources.splice(idx, 1);
    }

    await adminAuditService.logAction({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: 'SOURCE_DELETED',
      resourceType: 'SOURCE',
      resourceId: id,
      description: `Removed source record: ${existing.name} (${existing.domain})`,
      metadata: { deletedSource: existing },
    });

    return true;
  }
}

export const adminSourceService = new AdminSourceService();
