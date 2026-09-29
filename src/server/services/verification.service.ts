import mongoose from 'mongoose';
import {
  CreateVerificationDto,
  IVerification,
  VerificationFilterOptions,
  IVerificationSource,
} from '../types/verification.types.js';
import { isDatabaseConnected } from '../config/database.js';
import { VerificationModel } from '../models/Verification.js';
import { verificationStore } from '../db/verificationStore.js';
import { aiService } from './ai.service.js';
import { articleAnalyzerService } from './articleAnalyzer.service.js';
import { searchService } from './search.service.js';
import { sourceService } from './source.service.js';
import { evidenceService } from './evidence.service.js';
import { notificationService } from './notification.service.js';
import { ApiError } from '../utils/apiError.js';
import { extractAndNormalizeVerificationSources } from '../utils/sourceExtractor.js';
import { notifyStatsChanged } from './verificationStats.service.js';

export class VerificationService {
  /**
   * Orchestrates the complete automated verification pipeline
   */
  async createVerification(userId: string, data: CreateVerificationDto): Promise<IVerification> {
    const rawContent = data.content?.trim() || data.sourceUrl?.trim() || 'Screenshot image analysis';

    // 1. Initialize verification record (status: PENDING)
    const verificationRecord: IVerification = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      submissionType: data.submissionType,
      originalContent: data.content?.trim() || '',
      sourceUrl: data.sourceUrl?.trim() || '',
      imageUrl: data.imageUrl || '',
      status: 'PENDING',
      claims: [],
      evidence: [],
      sources: [],
      indicators: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let savedDoc: any = null;

    if (isDatabaseConnected()) {
      try {
        savedDoc = await VerificationModel.create({
          customId: verificationRecord.id,
          userId,
          submissionType: data.submissionType,
          originalContent: verificationRecord.originalContent,
          sourceUrl: verificationRecord.sourceUrl,
          imageUrl: verificationRecord.imageUrl,
          status: 'PENDING',
        });
        if (savedDoc._id) {
          verificationRecord.id = savedDoc._id.toString();
        }
      } catch (err) {
        console.warn('[VerificationService] DB init create error:', err);
      }
    }

    await verificationStore.create(verificationRecord);

    // 2. Execute verification pipeline
    try {
      // Set status to PROCESSING
      verificationRecord.status = 'PROCESSING';
      if (savedDoc) {
        savedDoc.status = 'PROCESSING';
        await savedDoc.save();
      }

      let assessment: any = null;
      let extractedClaims: any[] = [];
      let evidence: any[] = [];
      let sources: any[] = [];

      let directVerificationSources: IVerificationSource[] = [];

      try {
        // Try chief multimodal analyzer with Gemini 2.5 Flash and Google Search Grounding
        const analysis = await articleAnalyzerService.analyzeArticle({
          content: rawContent,
          sourceUrl: data.sourceUrl,
          imageUrl: data.imageUrl,
          submissionType: data.submissionType,
        });

        assessment = {
          classification: analysis.classification,
          credibilityScore: analysis.credibilityScore,
          confidence: analysis.confidence,
          confidenceLabel: analysis.confidenceLabel,
          explanation: analysis.explanation,
          recommendation: analysis.recommendation,
          warning: analysis.warning,
          summary: analysis.summary,
          contentCharacteristics: analysis.contentCharacteristics,
          sourceTrace: analysis.sourceTrace,
          claims: analysis.claims,
          indicators: analysis.indicators,
        };
        extractedClaims = analysis.claims;
        evidence = analysis.evidence;
        sources = analysis.sources;
        if (Array.isArray(analysis.verificationSources)) {
          directVerificationSources = analysis.verificationSources;
        }
      } catch (directAnalyzerErr) {
        console.warn('[VerificationService] Direct analyzer fallback to modular pipeline:', directAnalyzerErr);

        // Step A: Extract discrete atomic claims
        const claimExtraction = await aiService.extractClaims(rawContent, data.submissionType);
        extractedClaims = claimExtraction.claims;

        // Step B: Search for relevant coverage & records
        const searchResults = await searchService.searchMultipleClaims(
          extractedClaims.map((c) => c.text)
        );

        // Step C: Collect, classify and normalize evidence
        evidence = await evidenceService.collectEvidence(
          searchResults,
          extractedClaims.map((c) => ({
            ...c,
            classification: 'UNVERIFIED',
            confidence: 0.5,
            explanation: '',
          }))
        );

        // Step D: Extract & evaluate participating sources
        const sourceDomains = searchResults.map((r) => r.domain);
        if (data.sourceUrl) {
          sourceDomains.push(sourceService.extractDomain(data.sourceUrl));
        }
        sources = await sourceService.getSourcesForVerification(sourceDomains);

        // Step E: Synthesize automated assessment with AI decision-support
        assessment = await aiService.generateVerificationAssessment({
          submissionType: data.submissionType,
          content: rawContent,
          sourceUrl: data.sourceUrl,
          claims: extractedClaims,
          evidence,
          sources,
        });
      }

      // Step F: Package final verification result & evaluate Lifecycle State Machine
      const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' =
        assessment.classification === 'FAKE'
          ? 'HIGH'
          : assessment.classification === 'SUSPICIOUS'
          ? 'MEDIUM'
          : assessment.classification === 'UNVERIFIED'
          ? 'MEDIUM'
          : 'LOW';

      const needsReview = assessment.classification === 'FAKE' || riskLevel === 'HIGH';
      const finalStatus = needsReview ? 'PENDING_REVIEW' : 'COMPLETED';

      verificationRecord.status = finalStatus;
      verificationRecord.reviewStatus = needsReview ? 'PENDING' : undefined;
      verificationRecord.triggerReason = needsReview
        ? 'High-risk or fabricated claim detected by automated AI engine. Queued for human verification.'
        : undefined;

      verificationRecord.aiClassification = assessment.classification;
      verificationRecord.aiRiskLevel = riskLevel;
      verificationRecord.aiCredibilityScore = assessment.credibilityScore;
      verificationRecord.aiConfidenceScore = Math.round(assessment.confidence * 100);
      verificationRecord.aiExplanation = assessment.explanation;
      verificationRecord.sourceTrace = assessment.sourceTrace;

      const finalVerificationSources = directVerificationSources.length > 0
        ? directVerificationSources
        : extractAndNormalizeVerificationSources({
            modelSources: evidence.map((e) => ({
              sourceName: e.sourceName,
              url: e.sourceUrl,
              title: e.title,
              description: e.description,
              relationship: e.type,
            })),
            explanationText: assessment.explanation || '',
            comparisonAnalysis: '',
            summary: assessment.summary || '',
            verdictOrClassification: assessment.classification,
            sourceUrl: data.sourceUrl,
          });

      verificationRecord.verificationSources = finalVerificationSources;

      verificationRecord.automatedResult = {
        classification: assessment.classification,
        credibilityScore: assessment.credibilityScore,
        confidence: assessment.confidence,
        confidenceLabel: assessment.confidenceLabel,
        explanation: assessment.explanation,
        recommendation: assessment.recommendation,
        warning: assessment.warning,
        summary: assessment.summary,
        contentCharacteristics: assessment.contentCharacteristics,
        sourceTrace: assessment.sourceTrace,
        verificationSources: finalVerificationSources,
      };
      verificationRecord.claims = assessment.claims || extractedClaims;
      verificationRecord.evidence = evidence;
      verificationRecord.sources = sources;
      verificationRecord.indicators = assessment.indicators || [];
      verificationRecord.explanation = assessment.explanation;
      verificationRecord.recommendation = assessment.recommendation;
      verificationRecord.warning = assessment.warning;
      verificationRecord.updatedAt = new Date();

      if (savedDoc) {
        savedDoc.status = finalStatus;
        savedDoc.reviewStatus = verificationRecord.reviewStatus;
        savedDoc.triggerReason = verificationRecord.triggerReason;
        savedDoc.aiClassification = verificationRecord.aiClassification;
        savedDoc.aiRiskLevel = verificationRecord.aiRiskLevel;
        savedDoc.aiCredibilityScore = verificationRecord.aiCredibilityScore;
        savedDoc.aiConfidenceScore = verificationRecord.aiConfidenceScore;
        savedDoc.sourceTrace = verificationRecord.sourceTrace;
        savedDoc.verificationSources = finalVerificationSources;
        savedDoc.automatedResult = verificationRecord.automatedResult;
        savedDoc.claims = verificationRecord.claims;
        savedDoc.evidence = verificationRecord.evidence;
        savedDoc.sources = verificationRecord.sources;
        savedDoc.indicators = verificationRecord.indicators;
        savedDoc.explanation = verificationRecord.explanation;
        savedDoc.recommendation = verificationRecord.recommendation;
        savedDoc.warning = verificationRecord.warning;
        await savedDoc.save();
      }

      await verificationStore.update(verificationRecord.id, verificationRecord);

      // Step G: Dispatch user notification
      const notifType =
        assessment.classification === 'FAKE' || assessment.classification === 'SUSPICIOUS'
          ? 'WARNING'
          : assessment.confidence < 0.5
          ? 'LOW_CONFIDENCE'
          : 'VERIFICATION_COMPLETED';

      await notificationService.createNotification({
        userId,
        type: notifType,
        title: `Verification Completed: ${assessment.classification}`,
        message: `Your ${data.submissionType} submission scored ${assessment.credibilityScore}/100 credibility. ${assessment.recommendation}`,
        relatedVerificationId: verificationRecord.id,
      });

      notifyStatsChanged({
        userId,
        action: 'VERIFICATION_CREATED',
        verificationId: verificationRecord.id,
      });

      return verificationRecord;
    } catch (pipelineErr: any) {
      console.error('[VerificationService] Pipeline error caught, generating fail-safe completion result:', pipelineErr);
      
      const fallbackResult = {
        classification: 'UNVERIFIED' as const,
        credibilityScore: 50,
        confidence: 0.5,
        confidenceLabel: 'LOW' as const,
        explanation: 'The verification analysis engine could not complete the automated evaluation against external sources. You may retry with alternative text, a direct URL, or an uploaded document.',
        recommendation: 'Verify with primary official sources before sharing.',
        warning: 'Unable to reach external sources or process media format. Please check your URL/file and try again.',
      };

      verificationRecord.status = 'COMPLETED';
      verificationRecord.automatedResult = fallbackResult;
      verificationRecord.claims = [];
      verificationRecord.evidence = [];
      verificationRecord.sources = [];
      verificationRecord.indicators = [];
      verificationRecord.explanation = fallbackResult.explanation;
      verificationRecord.recommendation = fallbackResult.recommendation;
      verificationRecord.warning = fallbackResult.warning;
      verificationRecord.updatedAt = new Date();

      if (savedDoc) {
        try {
          savedDoc.status = 'COMPLETED';
          savedDoc.automatedResult = fallbackResult;
          savedDoc.claims = [];
          savedDoc.evidence = [];
          savedDoc.sources = [];
          savedDoc.indicators = [];
          savedDoc.explanation = fallbackResult.explanation;
          savedDoc.recommendation = fallbackResult.recommendation;
          savedDoc.warning = fallbackResult.warning;
          await savedDoc.save();
        } catch (saveErr) {
          console.warn('[VerificationService] Could not update savedDoc on fallback:', saveErr);
        }
      }

      await verificationStore.update(verificationRecord.id, verificationRecord);

      await notificationService.createNotification({
        userId,
        type: 'LOW_CONFIDENCE',
        title: 'Verification Incomplete',
        message: 'Your verification request could not be fully analyzed. Please check source URL or file and try again.',
        relatedVerificationId: verificationRecord.id,
      });

      return verificationRecord;
    }
  }

  /**
   * Retrieves paginated verification history for the authenticated user
   */
  async getUserVerifications(options: VerificationFilterOptions): Promise<{
    items: IVerification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    if (isDatabaseConnected()) {
      try {
        const andConditions: any[] = [];
        if (options.userId && options.userId !== 'all') {
          andConditions.push({
            $or: [{ userId: options.userId }, { userId: options.userId.toString() }],
          });
        }

        const query: Record<string, any> = {};

        if (options.classification) {
          query['automatedResult.classification'] = options.classification;
        }

        if (options.type) {
          query.submissionType = options.type;
        }

        if (options.search) {
          const searchRegex = new RegExp(options.search.trim(), 'i');
          andConditions.push({
            $or: [
              { originalContent: searchRegex },
              { sourceUrl: searchRegex },
              { explanation: searchRegex },
              { customId: searchRegex },
              { 'automatedResult.summary': searchRegex },
            ],
          });
        }

        if (options.from || options.to) {
          query.createdAt = {};
          if (options.from) query.createdAt.$gte = new Date(options.from);
          if (options.to) query.createdAt.$lte = new Date(options.to);
        }

        if (andConditions.length > 0) {
          query.$and = andConditions;
        }

        const total = await VerificationModel.countDocuments(query);
        const docs = await VerificationModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        const items: IVerification[] = docs.map((d) => {
          const json = d.toJSON ? d.toJSON() : (d as any);
          const id = json.id || json.customId || json._id?.toString() || d._id?.toString();
          return {
            ...json,
            id,
            _id: id,
          };
        });
        const totalPages = Math.ceil(total / limit) || 1;

        return { items, total, page, limit, totalPages };
      } catch (err) {
        console.warn('[VerificationService] DB list error:', err);
      }
    }

    return verificationStore.query(options);
  }

  /**
   * Retrieves single verification report, strictly enforcing ownership security
   */
  async getVerificationById(id: string, userId: string): Promise<IVerification> {
    let result: IVerification | null = null;

    if (isDatabaseConnected()) {
      try {
        const isObjectId = mongoose.isValidObjectId(id);
        const idQuery = isObjectId
          ? { $or: [{ _id: id }, { customId: id }, { id }] }
          : { $or: [{ customId: id }, { id }] };

        let doc = null;
        if (userId && userId !== 'guest_user') {
          doc = await VerificationModel.findOne({
            $and: [
              idQuery,
              { $or: [{ userId }, { userId: userId.toString() }] },
            ],
          });
        }

        // If not found with user restriction, allow finding by id for shared/public verification view
        if (!doc) {
          doc = await VerificationModel.findOne(idQuery);
        }

        if (doc) {
          const json = doc.toJSON ? doc.toJSON() : (doc as any);
          const primaryId = json.id || json.customId || json._id?.toString() || doc._id?.toString();
          result = {
            ...json,
            id: primaryId,
            _id: primaryId,
          };
        }
      } catch (err) {
        console.warn('[VerificationService] DB getById error:', err);
      }
    }

    if (!result) {
      const stored = await verificationStore.findById(id);
      if (stored) {
        result = stored;
      }
    }

    if (!result) {
      throw ApiError.notFound(
        'Verification record not found or you do not have permission to view it.'
      );
    }

    return result;
  }

  /**
   * Deletes a verification record, strictly checking ownership
   */
  async deleteVerification(id: string, userId: string): Promise<boolean> {
    let deleted = false;

    if (isDatabaseConnected()) {
      try {
        const isObjectId = mongoose.isValidObjectId(id);
        const query: any = isObjectId
          ? {
              $and: [
                { $or: [{ _id: id }, { customId: id }, { id }] },
                { $or: [{ userId }, { userId: userId.toString() }] },
              ],
            }
          : {
              $and: [
                { $or: [{ customId: id }, { id }] },
                { $or: [{ userId }, { userId: userId.toString() }] },
              ],
            };

        const doc = await VerificationModel.findOneAndDelete(query);
        if (doc) {
          deleted = true;
        }
      } catch (err) {
        console.warn('[VerificationService] DB delete error:', err);
      }
    }

    const storeDeleted = await verificationStore.delete(id);
    if (deleted || storeDeleted) {
      notifyStatsChanged({ userId, action: 'VERIFICATION_DELETED', verificationId: id });
      return true;
    }

    throw ApiError.notFound(
      'Verification record not found or you do not have permission to delete it.'
    );
  }
}

export const verificationService = new VerificationService();
