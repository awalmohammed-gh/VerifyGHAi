import { isDatabaseConnected } from '../../config/database.js';
import { FactCheckModel } from '../../models/FactCheck.js';
import {
  CreateFactCheckDto,
  FactCheckFilterOptions,
  IFactCheck,
  UpdateFactCheckDto,
} from '../../types/admin/fact-check.types.js';
import { ApiError } from '../../utils/apiError.js';
import { adminAuditService } from './admin-audit.service.js';

function formatFactCheckDoc(doc: any): IFactCheck {
  const json = doc.toJSON ? doc.toJSON() : doc;
  return {
    ...json,
    id: json.id || json._id?.toString() || '',
  };
}

export class AdminFactCheckService {
  private inMemoryFactChecks: IFactCheck[] = [
    {
      id: 'fc_1',
      title: 'Fact Check: False Viral Claims of New 1000 Cedi Banknote in Ghana',
      claim: 'Bank of Ghana introduces new 1000 Cedi note into circulation.',
      classification: 'FAKE',
      summary: 'The Bank of Ghana (BoG) has officially refuted viral social media graphics alleging the imminent release of a 1,000 Ghana Cedi banknote denomination, designating the claims as false fabrications.',
      evidence: [
        {
          title: 'Bank of Ghana Official Public Notice',
          description: 'BoG confirms no plans or approvals exist for higher denomination currency beyond current existing legal tenders.',
          type: 'CONTRADICTING',
          credibility: 98,
        },
      ],
      sources: [
        {
          name: 'Bank of Ghana (BoG)',
          domain: 'bog.gov.gh',
          credibilityScore: 98,
          status: 'VERIFIED',
        },
      ],
      publishedDate: new Date(Date.now() - 3600000 * 24 * 3),
      createdBy: 'admin_root',
      creatorName: 'Senior Fact-Checker',
      updatedBy: 'admin_root',
      status: 'PUBLISHED',
      createdAt: new Date(Date.now() - 3600000 * 24 * 3),
      updatedAt: new Date(Date.now() - 3600000 * 24 * 3),
    },
  ];

  /**
   * Lists fact-checks with search, filters and pagination
   */
  async listFactChecks(options: FactCheckFilterOptions): Promise<{
    items: IFactCheck[];
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

        if (options.classification) query.classification = options.classification;
        if (options.status) query.status = options.status;
        if (options.search) {
          const searchRegex = new RegExp(options.search.trim(), 'i');
          query.$or = [
            { title: searchRegex },
            { claim: searchRegex },
            { summary: searchRegex },
          ];
        }
        if (options.from || options.to) {
          query.createdAt = {};
          if (options.from) query.createdAt.$gte = new Date(options.from);
          if (options.to) query.createdAt.$lte = new Date(options.to);
        }

        const total = await FactCheckModel.countDocuments(query);
        const docs = await FactCheckModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        const items = docs.map((d) => formatFactCheckDoc(d));
        const totalPages = Math.ceil(total / limit) || 1;

        return { items, total, page, limit, totalPages };
      } catch (err) {
        console.warn('[AdminFactCheckService] DB list error:', err);
      }
    }

    let filtered = [...this.inMemoryFactChecks];

    if (options.classification) filtered = filtered.filter((f) => f.classification === options.classification);
    if (options.status) filtered = filtered.filter((f) => f.status === options.status);
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.claim.toLowerCase().includes(q) ||
          f.summary.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return { items, total, page, limit, totalPages };
  }

  /**
   * Retrieves single fact check by ID
   */
  async getFactCheckById(id: string): Promise<IFactCheck> {
    if (isDatabaseConnected()) {
      try {
        const doc = await FactCheckModel.findById(id);
        if (doc) return formatFactCheckDoc(doc);
      } catch (err) {
        console.warn('[AdminFactCheckService] DB getById error:', err);
      }
    }

    const found = this.inMemoryFactChecks.find((f) => f.id === id || f._id === id);
    if (!found) {
      throw ApiError.notFound('Fact-check article not found.');
    }
    return found;
  }

  /**
   * Creates a new verified fact-check dossier
   */
  async createFactCheck(
    data: CreateFactCheckDto,
    admin: { id: string; email?: string; name?: string }
  ): Promise<IFactCheck> {
    if (isDatabaseConnected()) {
      const doc = await FactCheckModel.create({
        title: data.title,
        claim: data.claim,
        classification: data.classification,
        summary: data.summary,
        evidence: data.evidence || [],
        sources: data.sources || [],
        publishedDate: data.publishedDate ? new Date(data.publishedDate) : new Date(),
        createdBy: admin.id,
        creatorName: admin.name || admin.email || 'Fact-Checker',
        updatedBy: admin.id,
        status: data.status || 'PUBLISHED',
      });

      await adminAuditService.logAction({
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.name,
        action: 'FACT_CHECK_CREATED',
        resourceType: 'FACT_CHECK',
        resourceId: doc._id.toString(),
        description: `Published new Fact-Check: "${data.title}" [${data.classification}]`,
        metadata: { factCheck: doc.toJSON() },
      });

      return formatFactCheckDoc(doc);
    }

    const newFc: IFactCheck = {
      id: `fc_${Date.now()}`,
      title: data.title,
      claim: data.claim,
      classification: data.classification,
      summary: data.summary,
      evidence: data.evidence || [],
      sources: data.sources || [],
      publishedDate: data.publishedDate ? new Date(data.publishedDate) : new Date(),
      createdBy: admin.id,
      creatorName: admin.name || admin.email || 'Fact-Checker',
      updatedBy: admin.id,
      status: data.status || 'PUBLISHED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inMemoryFactChecks.unshift(newFc);

    await adminAuditService.logAction({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: 'FACT_CHECK_CREATED',
      resourceType: 'FACT_CHECK',
      resourceId: newFc.id,
      description: `Created fact-check: "${data.title}"`,
      metadata: { factCheck: newFc },
    });

    return newFc;
  }

  /**
   * Updates an existing fact-check dossier
   */
  async updateFactCheck(
    id: string,
    data: UpdateFactCheckDto,
    admin: { id: string; email?: string; name?: string }
  ): Promise<IFactCheck> {
    if (isDatabaseConnected()) {
      const doc = await FactCheckModel.findByIdAndUpdate(
        id,
        {
          ...(data.title ? { title: data.title } : {}),
          ...(data.claim ? { claim: data.claim } : {}),
          ...(data.classification ? { classification: data.classification } : {}),
          ...(data.summary ? { summary: data.summary } : {}),
          ...(data.evidence ? { evidence: data.evidence } : {}),
          ...(data.sources ? { sources: data.sources } : {}),
          ...(data.publishedDate ? { publishedDate: new Date(data.publishedDate) } : {}),
          ...(data.status ? { status: data.status } : {}),
          updatedBy: admin.id,
        },
        { new: true }
      );

      if (!doc) {
        throw ApiError.notFound('Fact-check article not found.');
      }

      await adminAuditService.logAction({
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.name,
        action: 'FACT_CHECK_UPDATED',
        resourceType: 'FACT_CHECK',
        resourceId: id,
        description: `Updated Fact-Check: "${doc.title}"`,
        metadata: { changes: data },
      });

      return formatFactCheckDoc(doc);
    }

    const existing = await this.getFactCheckById(id);
    Object.assign(existing, {
      ...data,
      updatedBy: admin.id,
      updatedAt: new Date(),
    });

    await adminAuditService.logAction({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: 'FACT_CHECK_UPDATED',
      resourceType: 'FACT_CHECK',
      resourceId: id,
      description: `Updated fact-check: "${existing.title}"`,
      metadata: { changes: data },
    });

    return existing;
  }

  /**
   * Deletes a fact check
   */
  async deleteFactCheck(
    id: string,
    admin: { id: string; email?: string; name?: string }
  ): Promise<boolean> {
    const existing = await this.getFactCheckById(id);

    if (isDatabaseConnected()) {
      await FactCheckModel.findByIdAndDelete(id);
    } else {
      const idx = this.inMemoryFactChecks.findIndex((f) => f.id === id || f._id === id);
      if (idx !== -1) this.inMemoryFactChecks.splice(idx, 1);
    }

    await adminAuditService.logAction({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: 'FACT_CHECK_DELETED',
      resourceType: 'FACT_CHECK',
      resourceId: id,
      description: `Deleted Fact-Check: "${existing.title}"`,
      metadata: { deletedFactCheck: existing },
    });

    return true;
  }
}

export const adminFactCheckService = new AdminFactCheckService();
