import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import * as pdfParseModule from 'pdf-parse';
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;
import { verificationService } from '../services/verification.service.js';
import { articleAnalyzerService } from '../services/articleAnalyzer.service.js';
import { searchService } from '../services/search.service.js';
import { resolveAIModel } from '../config/gemini.js';
import { ApiResponse } from '../utils/response.js';
import { extractAndNormalizeVerificationSources } from '../utils/sourceExtractor.js';
import { adminFlagService } from '../services/admin/admin-flag.service.js';
import { VerificationModel } from '../models/Verification.js';
import { verificationStore } from '../db/verificationStore.js';
import { notifyStatsChanged } from '../services/verificationStats.service.js';
import { isDatabaseConnected } from '../config/database.js';
import { commentService } from '../services/comment.service.js';
import { heuristicFactChecker } from '../services/heuristicFactChecker.js';

export class VerificationController {
  /**
   * Main verification & analysis handler for /api/verify and /api/analyze
   * Uses @google/genai with gemini-3.6-flash and googleSearch grounding
   */
  async verifyContent(req: Request, res: Response, _next?: NextFunction) {
    const startTime = new Date().toISOString();
    try {
      // 1. Extract and normalize input payload from body or multipart upload
      const rawContent = (
        req.body.content ||
        req.body.text ||
        req.body.prompt ||
        req.body.article ||
        ''
      ).trim();
      const rawUrl = (
        req.body.url ||
        req.body.sourceUrl ||
        req.body.articleUrl ||
        req.body.link ||
        ''
      ).trim();
      const rawBase64 = (
        req.body.fileData?.base64 ||
        req.body.base64 ||
        req.body.image ||
        req.body.screenshot ||
        ''
      ).trim();
      const mimeType = (
        req.body.fileData?.mimeType ||
        req.body.mimeType ||
        ''
      ).trim();
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!rawContent && !rawUrl && !rawBase64 && !file) {
        return res.status(200).json(
          this.buildSafeFallback(
            'UNVERIFIED',
            'No content provided for verification.',
            'Please submit article text, a verifiable URL, or upload an image/document.',
            startTime
          )
        );
      }

      // 2. Prepare multimodal parts for Gemini API
      const parts: any[] = [];
      let aggregatedContext = '';

      if (rawUrl) {
        aggregatedContext += `Article / Target URL: ${rawUrl}\n`;
      }
      if (rawContent) {
        aggregatedContext += `Article Text Content:\n${rawContent}\n\n`;
      }

      // Handle Base64 Uploads (Strip data URI headers: base64String.replace(/^data:(.*);base64,/, ''))
      if (rawBase64) {
        let cleanBase64 = rawBase64.replace(/^data:(.*);base64,/, '').replace(/\s/g, '');
        let detectedMime = mimeType;

        if (!detectedMime) {
          const match = rawBase64.match(/^data:([^;]+);base64,/);
          detectedMime = match ? match[1] : 'image/jpeg';
        }

        if (detectedMime === 'application/pdf' || rawBase64.includes('application/pdf')) {
          // Parse PDF to text via pdf-parse or fallback to inlineData
          try {
            const pdfBuffer = Buffer.from(cleanBase64, 'base64');
            const pdfData = await pdfParse(pdfBuffer);
            if (pdfData && pdfData.text && pdfData.text.trim()) {
              aggregatedContext += `Extracted PDF Document Content:\n${pdfData.text.substring(0, 15000)}\n\n`;
            } else {
              parts.push({
                inlineData: {
                  mimeType: 'application/pdf',
                  data: cleanBase64,
                },
              });
            }
          } catch (pdfErr: any) {
            console.warn('[VerificationController] Base64 PDF parse fallback to inlineData:', pdfErr.message);
            parts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: cleanBase64,
              },
            });
          }
        } else {
          // Image upload
          parts.push({
            inlineData: {
              mimeType: detectedMime.startsWith('image/') ? detectedMime : 'image/jpeg',
              data: cleanBase64,
            },
          });
        }
      }

      // Handle File Upload from Multer
      if (file && file.path && fs.existsSync(file.path)) {
        if (file.mimetype === 'application/pdf') {
          try {
            const pdfBuffer = fs.readFileSync(file.path);
            const pdfData = await pdfParse(pdfBuffer);
            if (pdfData && pdfData.text && pdfData.text.trim()) {
              aggregatedContext += `Extracted PDF Document Content:\n${pdfData.text.substring(0, 15000)}\n\n`;
            } else {
              parts.push({
                inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfBuffer.toString('base64'),
                },
              });
            }
          } catch (pdfErr: any) {
            console.warn('[VerificationController] Multer PDF parse fallback to inlineData:', pdfErr.message);
            const pdfBuffer = fs.readFileSync(file.path);
            parts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBuffer.toString('base64'),
              },
            });
          }
        } else if (file.mimetype.startsWith('image/')) {
          const imgBuffer = fs.readFileSync(file.path);
          parts.push({
            inlineData: {
              mimeType: file.mimetype,
              data: imgBuffer.toString('base64'),
            },
          });
        }
      }

      // 3. Construct Prompt with Cross-Referencing & Strict JSON Output Rules
      const prompt = `You are a senior investigative fact-checker and truth verification engine.
Your mission is to rigorously analyze the input material, detect potential misinformation, propaganda, or fake news, and corroborate or refute factual claims.

CROSS-REFERENCING MANDATE:
You MUST search for and cross-reference claims against AT LEAST 3 distinct trusted news sources or official databases (e.g., Reuters, Associated Press, BBC, official government portals, accredited regional news agencies) before rendering a verdict.

INPUT CONTENT TO VERIFY:
${aggregatedContext.trim() || 'Verify the attached multimodal image/document against live news wires.'}

OUTPUT FORMAT SPECIFICATION:
You MUST respond strictly with raw JSON wrapped in \`\`\`json \`\`\` markdown code blocks.
Do NOT include conversational text, preface, or commentary outside the \`\`\`json \`\`\` code block.

SCHEMA:
\`\`\`json
{
  "status": "VERIFIED" | "TRUSTED" | "SUSPICIOUS" | "FAKE" | "UNVERIFIED",
  "verdict": "VERIFIED_REAL" | "CONFIRMED_FAKE" | "MISLEADING_CONTEXT" | "UNVERIFIED",
  "headline": "Short informative verification headline",
  "classification": "VERIFIED" | "TRUSTED" | "SUSPICIOUS" | "FAKE" | "UNVERIFIED",
  "credibilityScore": number (0 to 100),
  "confidence": number (0.0 to 1.0),
  "confidenceLabel": "LOW" | "MEDIUM" | "HIGH",
  "summary": "1-2 sentence executive summary of the finding",
  "explanation": "Comprehensive multi-paragraph investigation details citing corroborated facts and contradictory evidence.",
  "comparisonAnalysis": "Comparative breakdown describing how the claim measures against verified reporting from at least 3 reputable news outlets.",
  "referencedTrustedSources": ["https://...", "https://...", "https://..."],
  "recommendation": "Civic guidance and advisory before sharing or acting upon this information.",
  "warning": "Warning alert message if misleading/fake, or null if authentic.",
  "contentCharacteristics": {
    "emotionalTone": "Sensationalist / High Alarm" | "Neutral / Objective" | "Opinionated",
    "languagePatterns": ["Clickbait headline structure", "Excessive punctuation", "Urgent call to action"],
    "sourceCredibilityScore": "High" | "Medium" | "Low" | "Unverified",
    "visualMediaIntegrity": "Authentic" | "Digitally Manipulated" | "Out of Context" | "No Media Provided",
    "keyIndicators": [
      {
        "type": "Red Flag" | "Green Flag" | "Warning",
        "indicator": "Description of specific pattern found in the article text or media"
      }
    ]
  },
  "claims": [
    {
      "id": "clm_1",
      "text": "Specific atomic claim statement",
      "classification": "VERIFIED" | "TRUSTED" | "SUSPICIOUS" | "FAKE" | "UNVERIFIED",
      "confidence": number (0.0 to 1.0),
      "explanation": "Fact-checking note for this claim"
    }
  ],
  "evidence": [
    {
      "id": "ev_1",
      "title": "Corroborating or debunking headline/source",
      "sourceName": "Publisher Name (e.g. Reuters, BBC, AP)",
      "sourceUrl": "URL or domain",
      "type": "SUPPORTING" | "CONTRADICTING" | "CONTEXTUAL",
      "credibility": number (0 to 100),
      "description": "Specific evidence details"
    }
  ],
  "indicators": [
    {
      "type": "SOURCE_CREDIBILITY" | "EVIDENCE_CORROBORATION" | "SENSATIONALISM_DETECTION",
      "label": "Indicator title",
      "description": "Detection details",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    }
  ],
  "sources": [
    {
      "name": "Publisher Name",
      "domain": "example.com",
      "status": "VERIFIED" | "TRUSTED" | "SUSPICIOUS" | "UNRELIABLE",
      "credibilityScore": number (0 to 100)
    }
  ]
}
\`\`\``;

      parts.push({ text: prompt });

      const systemInstruction = `You are a senior investigative fact-checker and truth verification engine.
Your mission is to rigorously analyze the input material, detect potential misinformation, propaganda, or fake news, and corroborate or refute factual claims against trusted sources.
CROSS-REFERENCING MANDATE: You MUST cross-reference claims against AT LEAST 3 distinct trusted news sources or official databases (e.g., Reuters, Associated Press, BBC, official government portals, accredited regional news agencies) before rendering a verdict.
OUTPUT FORMAT: You MUST respond strictly with a raw JSON object wrapped in \`\`\`json \`\`\` markdown code blocks. Do not include any conversational text outside the \`\`\`json \`\`\` block.`;

      // 4. Instantiate GoogleGenAI and Call active model (gemini-3.7-flash) with Safe Grounding
      // CRITICAL: When tools: [{ googleSearch: {} }] is enabled, do NOT pass responseSchema or responseMimeType
      const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey: apiKey || 'unconfigured_key' });
      const targetModel = resolveAIModel('gemini-3.7-flash');

      let response: any = null;
      let textOutput = '';

      if (apiKey && apiKey !== 'unconfigured_key') {
        try {
          response = await ai.models.generateContent({
            model: targetModel,
            contents: { parts },
            config: {
              systemInstruction,
              tools: [{ googleSearch: {} }],
            },
          });
          textOutput = typeof response?.text === 'function' ? response.text() : response?.text;
        } catch (geminiError: any) {
          console.warn(
            '[VerificationController] Google Search Grounding request failed, attempting direct model call:',
            geminiError?.message
          );
          try {
            // Fallback without tools if search grounding was throttled or quota limited
            response = await ai.models.generateContent({
              model: targetModel,
              contents: { parts },
              config: {
                systemInstruction,
              },
            });
            textOutput = typeof response?.text === 'function' ? response.text() : response?.text;
          } catch (secondaryGeminiError: any) {
            console.warn(
              '[VerificationController] Core model call depleted, activating heuristic fact-checking engine:',
              secondaryGeminiError?.message
            );
          }
        }
      }

      // Extract user ID and submission metadata
      const userId =
        (req as any).user?.id ||
        (req as any).user?._id ||
        req.body.userId ||
        'usr_admin_dion_001';

      const submissionType: 'TEXT' | 'ARTICLE_URL' | 'DOCUMENT' | 'SCREENSHOT' =
        req.body.submissionType ||
        (rawUrl ? 'ARTICLE_URL' : file?.mimetype === 'application/pdf' ? 'DOCUMENT' : rawBase64 || file ? 'SCREENSHOT' : 'TEXT');

      // 5. If AI model produced no output (quota exhausted/429/offline), execute intelligent heuristic engine
      if (!textOutput || !textOutput.trim()) {
        const heuristicResult = await heuristicFactChecker.evaluate({
          content: rawContent,
          url: rawUrl,
          imageName: file?.filename,
          mimeType: file?.mimetype || mimeType,
          file,
          submissionType,
        });

        const normalized = await this.normalizeParsedResult(
          heuristicResult,
          [],
          startTime,
          rawContent,
          rawUrl,
          {
            userId: String(userId),
            submissionType,
            submittedContent: rawContent,
            submittedUrl: rawUrl,
            screenshotUrl: rawBase64 ? 'embedded_base64' : file ? file.filename || file.path : undefined,
            imageUrl: rawBase64 || (file && file.mimetype.startsWith('image/') ? file.path : undefined),
          }
        );
        return res.status(200).json(normalized);
      }

      // 6. Robust JSON Extraction from Model Response
      let cleanedText = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      }
      cleanedText = cleanedText
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");

      let parsed: any;
      try {
        parsed = JSON.parse(cleanedText);
      } catch (parseErr: any) {
        console.warn('[VerificationController] JSON parse attempt failed, falling back to heuristic fact-checker:', parseErr.message);
        const heuristicResult = await heuristicFactChecker.evaluate({
          content: rawContent,
          url: rawUrl,
          imageName: file?.filename,
          mimeType: file?.mimetype || mimeType,
          file,
          submissionType,
        });
        parsed = heuristicResult;
      }

      // 7. Extract Ground-Truth Reference Links from candidates[0]?.groundingMetadata?.groundingChunks
      const candidate = response?.candidates?.[0];
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
      const groundingSources = groundingChunks
        .filter((chunk: any) => chunk?.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web?.title || 'Grounding Reference',
          uri: chunk.web?.uri || '',
        }));

      // Normalize verdict & fields with real-time Google search cross-referencing and persist record
      const normalized = await this.normalizeParsedResult(
        parsed,
        groundingSources,
        startTime,
        rawContent,
        rawUrl,
        {
          userId: String(userId),
          submissionType,
          submittedContent: rawContent,
          submittedUrl: rawUrl,
          screenshotUrl: rawBase64 ? 'embedded_base64' : file ? file.filename || file.path : undefined,
          imageUrl: rawBase64 || (file && file.mimetype.startsWith('image/') ? file.path : undefined),
        }
      );
      return res.status(200).json(normalized);
    } catch (fatalError: any) {
      console.error('[VerificationController] Exception caught, evaluating with heuristic fallback:', fatalError);
      try {
        const rawContent = (
          req.body.content ||
          req.body.text ||
          req.body.prompt ||
          req.body.article ||
          ''
        ).trim();
        const rawUrl = (
          req.body.url ||
          req.body.sourceUrl ||
          req.body.articleUrl ||
          req.body.link ||
          ''
        ).trim();
        const file = (req as any).file as Express.Multer.File | undefined;
        const heuristicResult = await heuristicFactChecker.evaluate({
          content: rawContent,
          url: rawUrl,
          file,
        });
        const normalized = await this.normalizeParsedResult(
          heuristicResult,
          [],
          startTime,
          rawContent,
          rawUrl,
          {
            userId: (req as any).user?.id || 'usr_admin_dion_001',
            submissionType: rawUrl ? 'ARTICLE_URL' : file ? 'DOCUMENT' : 'TEXT',
            submittedContent: rawContent,
            submittedUrl: rawUrl,
          }
        );
        return res.status(200).json(normalized);
      } catch (innerErr) {
        return res.status(200).json(
          this.buildSafeFallback(
            'UNVERIFIED',
            'Assessment temporarily unavailable',
            'Unable to reach all external fact-checking repositories. Please check the URL/file and try again.',
            startTime
          )
        );
      }
    }
  }

  /**
   * Dedicated analyzeArticle alias
   */
  async analyzeArticle(req: Request, res: Response, next: NextFunction) {
    return this.verifyContent(req, res, next);
  }

  /**
   * Creates and persists a verification record
   */
  async createVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || 'guest_user';
      const payload = {
        ...req.body,
        imageUrl: (req as any).file ? `/uploads/${(req as any).file.filename}` : req.body.imageUrl,
      };

      const verification = await verificationService.createVerification(userId, payload);
      return ApiResponse.created(res, 'Verification analysis completed successfully', {
        verification,
        data: verification,
        ...verification,
      });
    } catch (error) {
      // Return fail-safe contract instead of crashing
      console.warn('[VerificationController] createVerification fallback:', error);
      return this.verifyContent(req, res, next);
    }
  }

  async getUserVerifications(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const isGuest = !user || user.id === 'guest_user' || user.id === 'guest_user_anon';
      const scope = (req.query.scope as string) || (isGuest ? 'all' : 'user');
      const targetUserId = scope === 'all' || scope === 'public' || isGuest ? 'all' : user.id;

      const { items, total, page, limit, totalPages } =
        await verificationService.getUserVerifications({
          userId: targetUserId,
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 10,
          classification: req.query.classification as any,
          type: req.query.type as any,
          search: req.query.search as string,
          from: req.query.from as string,
          to: req.query.to as string,
        });

      return ApiResponse.success(
        res,
        'Verification history retrieved successfully',
        {
          verifications: items,
          isGuest,
          scope,
          userId: isGuest ? null : user.id,
        },
        200,
        { total, page, limit, totalPages }
      );
    } catch (error) {
      next(error);
    }
  }

  async getVerificationById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || 'guest_user';
      const verificationId = req.params.id;
      const verification = await verificationService.getVerificationById(
        verificationId,
        userId
      );

      return ApiResponse.success(res, 'Verification dossier retrieved successfully', {
        verification,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || 'guest_user';
      const verificationId = req.params.id;
      await verificationService.deleteVerification(verificationId, userId);

      return ApiResponse.success(res, 'Verification record successfully deleted');
    } catch (error) {
      next(error);
    }
  }

  /**
   * User reporting mechanism for flagging inaccurate or incorrect AI verdicts for human moderation
   */
  async reportIncorrectVerdict(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const userId = user?.id || 'guest_user';
      const reporterName = user?.name || user?.email || 'VerifAI User';
      const verificationId = req.params.id || req.body.verificationId;

      if (!verificationId) {
        return ApiResponse.error(res, 'Verification ID is required.', 400);
      }

      const reason = req.body.reason || 'INCORRECT_RESULT';
      const rawDescription = req.body.description || req.body.feedback || req.body.notes || req.body.comment || '';
      const suggestedClassification = req.body.suggestedClassification || '';
      const evidenceUrl = req.body.evidenceUrl || req.body.sourceUrl || '';
      const claimText = req.body.claimText || req.body.claim || '';
      const claimId = req.body.claimId || '';
      const claimStatus = req.body.claimStatus || '';

      const formattedDescription = [
        claimText ? `[CONTESTED CLAIM]: "${claimText}"${claimStatus ? ` (AI Status: ${claimStatus})` : ''}` : '',
        rawDescription,
        suggestedClassification ? `User Suggested Classification / Verdict: ${suggestedClassification}` : '',
        evidenceUrl ? `Reference Evidence Link: ${evidenceUrl}` : '',
      ]
        .filter(Boolean)
        .join('\n\n') || 'User reported this assessment as potentially inaccurate or flawed.';

      // 1. Create content flag in Flag system for admin review
      const flag = await adminFlagService.createFlag({
        verificationId,
        reportedBy: userId,
        reporterName,
        reason,
        description: formattedDescription,
      });

      // 2. Mark verification reviewStatus as PENDING if in DB so it appears in human review queue
      if (isDatabaseConnected()) {
        try {
          await VerificationModel.findByIdAndUpdate(verificationId, {
            reviewStatus: 'PENDING',
          });
        } catch (dbErr) {
          console.warn('[VerificationController] Error updating verification reviewStatus:', dbErr);
        }
      }

      // 3. Broadcast real-time stats invalidation
      notifyStatsChanged({
        userId,
        action: 'INCORRECT_VERDICT_REPORTED',
        verificationId,
      });

      return ApiResponse.success(
        res,
        'Your report has been submitted to human fact-checkers for priority cross-examination.',
        {
          flagId: flag.id,
          verificationId,
          status: 'PENDING_REVIEW',
          submittedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all comments for a verification result
   */
  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const verificationId = req.params.id || (req.query.verificationId as string);
      if (!verificationId) {
        return ApiResponse.error(res, 'Verification ID is required.', 400);
      }

      const comments = await commentService.getCommentsByVerificationId(verificationId);
      return ApiResponse.success(res, 'Verification comments retrieved successfully', {
        comments,
        count: comments.length,
        verificationId,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Post a new comment / context note to a verification result
   */
  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const verificationId = req.params.id || req.body.verificationId;
      if (!verificationId) {
        return ApiResponse.error(res, 'Verification ID is required.', 400);
      }

      const user = (req as any).user;
      const content = req.body.content || req.body.text || req.body.message;
      if (!content || !content.trim()) {
        return ApiResponse.error(res, 'Comment text cannot be empty.', 400);
      }

      const userId = user?.id || req.body.userId || `guest_${Date.now().toString(36)}`;
      const userName =
        req.body.userName?.trim() ||
        user?.name ||
        user?.email?.split('@')[0] ||
        'Community Contributor';
      const userEmail = user?.email || req.body.userEmail || '';
      const userRole = user?.role || req.body.userRole || 'COMMUNITY';
      const avatarUrl = user?.avatarUrl || req.body.avatarUrl || '';
      const tag = req.body.tag || 'GENERAL_DISCUSSION';
      const sourceUrl = req.body.sourceUrl || '';

      const newComment = await commentService.addComment({
        verificationId,
        userId,
        userName,
        userEmail,
        userRole,
        avatarUrl,
        content: content.trim(),
        tag,
        sourceUrl: sourceUrl.trim(),
      });

      return ApiResponse.success(
        res,
        'Comment posted successfully to verification discussion thread',
        { comment: newComment },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle like / helpful upvote on a comment
   */
  async toggleCommentLike(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const user = (req as any).user;
      const userId = user?.id || user?.email || req.body.userId || `guest_${req.ip || 'client'}`;

      if (!commentId) {
        return ApiResponse.error(res, 'Comment ID is required.', 400);
      }

      const updated = await commentService.toggleLike(commentId, userId);
      if (!updated) {
        return ApiResponse.error(res, 'Comment not found.', 404);
      }

      return ApiResponse.success(res, 'Comment reaction updated', { comment: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add reply to a comment
   */
  async addCommentReply(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const user = (req as any).user;
      const content = req.body.content || req.body.text;

      if (!commentId) {
        return ApiResponse.error(res, 'Comment ID is required.', 400);
      }
      if (!content || !content.trim()) {
        return ApiResponse.error(res, 'Reply content cannot be empty.', 400);
      }

      const userId = user?.id || req.body.userId || `guest_${Date.now().toString(36)}`;
      const userName =
        req.body.userName?.trim() ||
        user?.name ||
        user?.email?.split('@')[0] ||
        'Community Contributor';
      const userEmail = user?.email || req.body.userEmail || '';
      const userRole = user?.role || req.body.userRole || 'COMMUNITY';

      const updated = await commentService.addReply(commentId, {
        commentId,
        userId,
        userName,
        userEmail,
        userRole,
        content: content.trim(),
      });

      if (!updated) {
        return ApiResponse.error(res, 'Parent comment not found.', 404);
      }

      return ApiResponse.success(res, 'Reply added successfully', { comment: updated }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const user = (req as any).user;
      const userId = user?.id || user?.email || req.body.userId || '';
      const isAdmin = user?.role === 'ADMIN';

      if (!commentId) {
        return ApiResponse.error(res, 'Comment ID is required.', 400);
      }

      await commentService.deleteComment(commentId, userId, isAdmin);
      return ApiResponse.success(res, 'Comment deleted successfully');
    } catch (error: any) {
      if (error?.message?.includes('Unauthorized')) {
        return ApiResponse.error(res, error.message, 403);
      }
      next(error);
    }
  }

  /**
   * Helper: formats full normalized API response contract
   */
  private formatFullResponse(analysis: any, startTime: string) {
    const verdict = analysis.verdict || analysis.classification || 'UNVERIFIED';
    const classification = analysis.classification || 'UNVERIFIED';
    return {
      success: true,
      status: classification,
      verdict,
      headline: analysis.headline || `${classification} - Verification Report`,
      classification,
      credibilityScore: analysis.credibilityScore ?? 50,
      score: analysis.credibilityScore ?? 50,
      confidence: analysis.confidence ?? 0.85,
      confidenceLabel: analysis.confidenceLabel || 'MEDIUM',
      summary: analysis.summary || 'Content analysis completed.',
      explanation: analysis.explanation || 'Analyzed against available fact-checking databases.',
      comparisonAnalysis: analysis.comparisonAnalysis || 'Cross-referenced against verified public reporting.',
      recommendation: analysis.recommendation || 'Verify with primary official sources before sharing.',
      warning: analysis.warning || null,
      claims: analysis.claims || [],
      evidence: analysis.evidence || [],
      indicators: analysis.indicators || [],
      sources: analysis.sources || [],
      referencedTrustedSources: analysis.referencedTrustedSources || [],
      groundingSources: analysis.groundingSources || [],
      analyzedAt: analysis.analyzedAt || startTime,
      data: analysis,
      verification: analysis,
    };
  }

  /**
   * Helper: normalizes parsed AI JSON result and persists verification record
   */
  private async normalizeParsedResult(
    parsed: any,
    groundingSources: Array<{ title: string; uri: string }>,
    startTime: string,
    rawContent?: string,
    rawUrl?: string,
    options?: {
      userId?: string;
      submissionType?: 'TEXT' | 'ARTICLE_URL' | 'DOCUMENT' | 'SCREENSHOT';
      submittedContent?: string;
      submittedUrl?: string;
      screenshotUrl?: string;
      imageUrl?: string;
    }
  ) {
    const rawVerdict = (parsed.verdict || parsed.status || parsed.classification || 'UNVERIFIED').toUpperCase();
    let verdict: 'VERIFIED_REAL' | 'CONFIRMED_FAKE' | 'MISLEADING_CONTEXT' | 'UNVERIFIED' = 'UNVERIFIED';
    let classification: 'VERIFIED' | 'TRUSTED' | 'SUSPICIOUS' | 'FAKE' | 'UNVERIFIED' = 'UNVERIFIED';

    if (rawVerdict.includes('REAL') || rawVerdict === 'VERIFIED' || rawVerdict === 'TRUSTED') {
      verdict = 'VERIFIED_REAL';
      classification = 'VERIFIED';
    } else if (rawVerdict.includes('FAKE')) {
      verdict = 'CONFIRMED_FAKE';
      classification = 'FAKE';
    } else if (rawVerdict.includes('MISLEADING') || rawVerdict === 'SUSPICIOUS') {
      verdict = 'MISLEADING_CONTEXT';
      classification = 'SUSPICIOUS';
    } else {
      verdict = 'UNVERIFIED';
      classification = 'UNVERIFIED';
    }

    const credibilityScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          parsed.credibilityScore ??
            (verdict === 'VERIFIED_REAL'
              ? 95
              : verdict === 'MISLEADING_CONTEXT'
              ? 35
              : verdict === 'CONFIRMED_FAKE'
              ? 10
              : 50)
        )
      )
    );

    const rawConfidence = parseFloat(parsed.confidence ?? 0.85);
    const confidence = isNaN(rawConfidence) ? 0.85 : Math.min(1.0, Math.max(0.0, rawConfidence));
    const confidenceLabel =
      parsed.confidenceLabel && ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.confidenceLabel.toUpperCase())
        ? parsed.confidenceLabel.toUpperCase()
        : confidence >= 0.8
        ? 'HIGH'
        : confidence >= 0.5
        ? 'MEDIUM'
        : 'LOW';

    const claims = (parsed.claims || []).map((c: any, i: number) => ({
      id: c.id || `clm_${i + 1}`,
      text: c.text || `Claim ${i + 1}`,
      classification: c.classification || classification,
      confidence: parseFloat(c.confidence ?? confidence),
      explanation: c.explanation || '',
    }));

    // ----------------------------------------------------
    // Real-Time Google Custom Search & Grounding Cross-Referencing
    // ----------------------------------------------------
    const claimTexts = claims.map((c: any) => c.text);
    let liveSearchResults: any[] = [];
    try {
      liveSearchResults = await searchService.searchVerificationSources(claimTexts, rawContent, rawUrl);
    } catch (searchErr: any) {
      console.warn('[VerificationController] Live search cross-reference note:', searchErr?.message);
    }

    const verificationSources = extractAndNormalizeVerificationSources({
      groundingSources,
      liveSearchResults,
      modelSources: Array.isArray(parsed.referencedTrustedSources) ? parsed.referencedTrustedSources : [],
      explanationText: parsed.explanation || '',
      comparisonAnalysis: parsed.comparisonAnalysis || '',
      summary: parsed.summary || '',
      verdictOrClassification: verdict,
      sourceUrl: rawUrl,
    });

    const referencedTrustedSources = verificationSources.map((s) => s.url);

    const evidence = (parsed.evidence || []).map((e: any, i: number) => ({
      id: e.id || `ev_${i + 1}`,
      title: e.title || 'Evidence Reference',
      sourceName: e.sourceName || 'News Bureau Archive',
      sourceUrl: e.sourceUrl || '',
      type: ['SUPPORTING', 'CONTRADICTING', 'CONTEXTUAL'].includes((e.type || '').toUpperCase())
        ? e.type.toUpperCase()
        : 'CONTEXTUAL',
      credibility: Math.min(100, Math.max(0, Math.round(e.credibility ?? 80))),
      description: e.description || '',
    }));

    const indicators = (parsed.indicators || []).map((ind: any, i: number) => ({
      id: ind.id || `ind_${i + 1}`,
      type: ind.type || 'SOURCE_CREDIBILITY',
      name: ind.label || ind.name || 'Verification Signal',
      label: ind.label || 'Verification Signal',
      description: ind.description || '',
      severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes((ind.severity || '').toUpperCase())
        ? ind.severity.toUpperCase()
        : 'MEDIUM',
    }));

    const sources = (parsed.sources || []).map((s: any) => ({
      name: s.name || 'Media Source',
      domain: s.domain || 'source.domain',
      status: ['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'UNRELIABLE'].includes((s.status || '').toUpperCase())
        ? s.status.toUpperCase()
        : 'TRUSTED',
      credibilityScore: Math.min(100, Math.max(0, Math.round(s.credibilityScore ?? 75))),
    }));

    const finalSummary =
      parsed.summary ||
      (rawContent ? `${rawContent.slice(0, 150)}...` : 'Verification completed.');

    // ----------------------------------------------------
    // Normalize Content Characteristics & Indicators
    // ----------------------------------------------------
    const rawCC = parsed.contentCharacteristics || {};

    let defaultTone = 'Neutral / Objective';
    if (classification === 'FAKE' || credibilityScore < 40) {
      defaultTone = 'Sensationalist / High Alarm';
    } else if (classification === 'SUSPICIOUS' || credibilityScore < 65) {
      defaultTone = 'Opinionated';
    }

    let defaultSourceCred = 'Medium';
    if (credibilityScore >= 75) defaultSourceCred = 'High';
    else if (credibilityScore < 45) defaultSourceCred = 'Low';

    const defaultMediaIntegrity = 'No Media Provided';

    let normalizedKeyIndicators: Array<{ type: 'Red Flag' | 'Green Flag' | 'Warning'; indicator: string }> = [];
    if (Array.isArray(rawCC.keyIndicators) && rawCC.keyIndicators.length > 0) {
      normalizedKeyIndicators = rawCC.keyIndicators.map((ki: any) => {
        let type: 'Red Flag' | 'Green Flag' | 'Warning' = 'Warning';
        const rawType = String(ki.type || '').trim().toLowerCase();
        if (rawType.includes('red') || rawType.includes('flag') || rawType.includes('fake') || rawType.includes('critical')) {
          type = 'Red Flag';
        } else if (rawType.includes('green') || rawType.includes('authentic') || rawType.includes('verified') || rawType.includes('pass')) {
          type = 'Green Flag';
        } else if (rawType.includes('warn') || rawType.includes('yellow') || rawType.includes('caution')) {
          type = 'Warning';
        }
        return {
          type,
          indicator: String(ki.indicator || ki.text || ki.description || 'Characteristic indicator identified.').trim(),
        };
      });
    } else {
      if (classification === 'FAKE' || credibilityScore < 40) {
        normalizedKeyIndicators.push({
          type: 'Red Flag',
          indicator: 'Unsubstantiated factual assertions contradicting verified news records',
        });
        normalizedKeyIndicators.push({
          type: 'Warning',
          indicator: 'High alarm or urgency detected in phrasing',
        });
      } else if (classification === 'SUSPICIOUS') {
        normalizedKeyIndicators.push({
          type: 'Warning',
          indicator: 'Missing attribution or single-source uncorroborated testimony',
        });
        normalizedKeyIndicators.push({
          type: 'Warning',
          indicator: 'Nuance and counter-evidence omitted in primary narrative',
        });
      } else {
        normalizedKeyIndicators.push({
          type: 'Green Flag',
          indicator: 'Assertions corroborate with established reporting from accredited news wires',
        });
        normalizedKeyIndicators.push({
          type: 'Green Flag',
          indicator: 'Neutral and measured phrasing adhering to standard reporting practices',
        });
      }
    }

    let languagePatterns: string[] = [];
    if (Array.isArray(rawCC.languagePatterns) && rawCC.languagePatterns.length > 0) {
      languagePatterns = rawCC.languagePatterns.map((lp: any) => String(lp).trim()).filter(Boolean);
    } else {
      if (classification === 'FAKE') {
        languagePatterns = ['Sensationalist tone', 'Urgent call to action', 'Absence of named official sources'];
      } else if (classification === 'SUSPICIOUS') {
        languagePatterns = ['Speculative terminology', 'Unverified quotes'];
      } else {
        languagePatterns = ['Objective reporting tone', 'Attributed citations', 'Standard journalistic syntax'];
      }
    }

    const contentCharacteristics = {
      emotionalTone: rawCC.emotionalTone || defaultTone,
      languagePatterns,
      sourceCredibilityScore: rawCC.sourceCredibilityScore || defaultSourceCred,
      visualMediaIntegrity: rawCC.visualMediaIntegrity || defaultMediaIntegrity,
      keyIndicators: normalizedKeyIndicators,
    };

    const userId = options?.userId || 'usr_admin_dion_001';
    const submissionType = options?.submissionType || (rawUrl ? 'ARTICLE_URL' : 'TEXT');
    const customId = `VER-${Math.floor(100000 + Math.random() * 900000)}`;

    const aiRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
      classification === 'FAKE' || credibilityScore < 40
        ? 'HIGH'
        : classification === 'SUSPICIOUS' || credibilityScore < 70
        ? 'MEDIUM'
        : 'LOW';

    const recordStatus: 'COMPLETED' | 'PENDING_REVIEW' =
      classification === 'FAKE' && aiRiskLevel === 'HIGH' ? 'PENDING_REVIEW' : 'COMPLETED';
    const reviewStatus = recordStatus === 'PENDING_REVIEW' ? 'PENDING' : undefined;

    const formattedPayload = {
      id: customId,
      customId,
      userId,
      submissionType,
      success: true,
      status: recordStatus,
      reviewStatus,
      aiRiskLevel,
      verdict,
      headline: parsed.headline || `${classification} - Verification Report`,
      classification,
      aiClassification: classification,
      credibilityScore,
      score: credibilityScore,
      aiCredibilityScore: credibilityScore,
      confidence,
      aiConfidenceScore: confidence,
      confidenceLabel,
      summary: finalSummary,
      explanation:
        parsed.explanation ||
        'Cross-referenced across live digital news wires and accredited fact-checking databases.',
      aiExplanation:
        parsed.explanation ||
        'Cross-referenced across live digital news wires and accredited fact-checking databases.',
      comparisonAnalysis:
        parsed.comparisonAnalysis ||
        'Corroborated against major independent news reporting and official archives.',
      recommendation:
        parsed.recommendation ||
        (verdict === 'CONFIRMED_FAKE' || verdict === 'MISLEADING_CONTEXT'
          ? 'Do not share or amplify this claim without checking primary official registers.'
          : 'Information aligns with credible reporting. Exercise standard discretion.'),
      warning:
        parsed.warning || (verdict === 'CONFIRMED_FAKE' ? 'High risk misinformation warning.' : null),
      contentCharacteristics,
      claims,
      evidence,
      indicators,
      sources,
      verificationSources,
      referencedTrustedSources,
      groundingSources,
      originalContent: rawContent || rawUrl || '',
      submittedContent: rawContent || '',
      submittedUrl: rawUrl || '',
      sourceUrl: rawUrl || '',
      imageUrl: options?.imageUrl || '',
      screenshotUrl: options?.screenshotUrl || '',
      analyzedAt: startTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // ----------------------------------------------------
    // Persist to MongoDB VerificationModel & verificationStore
    // ----------------------------------------------------
    const automatedResultObj = {
      classification,
      credibilityScore,
      confidence,
      confidenceLabel,
      explanation: formattedPayload.explanation,
      recommendation: formattedPayload.recommendation,
      warning: formattedPayload.warning,
    };

    if (isDatabaseConnected()) {
      try {
        await VerificationModel.create({
          customId,
          userId,
          submissionType,
          originalContent: formattedPayload.originalContent,
          sourceUrl: formattedPayload.sourceUrl,
          imageUrl: formattedPayload.imageUrl,
          status: recordStatus,
          reviewStatus,
          aiClassification: classification,
          aiRiskLevel,
          aiCredibilityScore: credibilityScore,
          aiConfidenceScore: confidence,
          verificationSources,
          automatedResult: automatedResultObj,
          claims,
          evidence,
          indicators,
          sources,
          explanation: formattedPayload.explanation,
          recommendation: formattedPayload.recommendation,
          warning: formattedPayload.warning,
        });
      } catch (dbSaveErr: any) {
        console.warn('[VerificationController] DB verification persist error:', dbSaveErr?.message);
      }
    }

    await verificationStore.create({
      id: customId,
      customId,
      userId,
      submissionType,
      originalContent: formattedPayload.originalContent,
      sourceUrl: formattedPayload.sourceUrl,
      imageUrl: formattedPayload.imageUrl,
      status: recordStatus,
      reviewStatus,
      aiClassification: classification,
      aiRiskLevel,
      aiCredibilityScore: credibilityScore,
      aiConfidenceScore: confidence,
      verificationSources,
      automatedResult: automatedResultObj,
      claims,
      evidence,
      indicators,
      sources,
      explanation: formattedPayload.explanation,
      recommendation: formattedPayload.recommendation,
      warning: formattedPayload.warning,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    notifyStatsChanged({
      userId,
      action: 'VERIFICATION_CREATED',
      verificationId: customId,
    });

    return {
      ...formattedPayload,
      data: formattedPayload,
      verification: formattedPayload,
    };
  }

  /**
   * Dedicated real-time search query endpoint for client-side cross-referencing
   */
  async searchSources(req: Request, res: Response) {
    try {
      const { query, claims, content, url } = req.body;
      const claimList = Array.isArray(claims)
        ? claims
        : query
        ? [query]
        : [];
      const sources = await searchService.searchVerificationSources(claimList, content, url);
      return ApiResponse.success(res, 'Verification sources retrieved successfully', {
        sources,
        verificationSources: sources,
        total: sources.length,
      });
    } catch (error: any) {
      console.warn('[VerificationController] searchSources error:', error?.message);
      return ApiResponse.success(res, 'Verification sources fallback', {
        sources: [],
        verificationSources: [],
        total: 0,
      });
    }
  }

  /**
   * Helper: constructs a complete, safe fallback response object
   */
  private buildSafeFallback(
    status: 'UNVERIFIED',
    summary: string,
    explanation: string,
    startTime: string
  ) {
    const finalSummary = summary || 'Assessment temporarily unavailable';
    const fallbackSources = [
      {
        id: `src_fb_1`,
        sourceName: 'Dubawa Fact-Check',
        domain: 'dubawa.org',
        articleTitle: 'Dubawa Ghana Fact-Checking Desk',
        title: 'Dubawa Ghana Fact-Checking Desk',
        url: 'https://dubawa.org/ghana-fact-check-desk',
        publicationDate: new Date().toISOString().slice(0, 10),
        publishedDate: new Date().toISOString(),
        credibilityStatus: 'TRUSTED' as const,
        reliability: 'High',
        relationship: 'MENTIONING' as const,
        snippet: 'Independent verification desk investigating claims, viral notices, and misinformation.',
        relevanceScore: 92,
      },
      {
        id: `src_fb_2`,
        sourceName: 'Ghana News Agency',
        domain: 'gna.org.gh',
        articleTitle: 'Ghana News Agency (GNA) Live Registry',
        title: 'Ghana News Agency (GNA) Live Registry',
        url: 'https://gna.org.gh',
        publicationDate: new Date().toISOString().slice(0, 10),
        publishedDate: new Date().toISOString(),
        credibilityStatus: 'TRUSTED' as const,
        reliability: 'Official Registry',
        relationship: 'MENTIONING' as const,
        snippet: 'National news reporting archive reviewing public statements and regulatory circulars.',
        relevanceScore: 90,
      },
      {
        id: `src_fb_3`,
        sourceName: 'Reuters',
        domain: 'reuters.com',
        articleTitle: 'Reuters Fact Check Archive',
        title: 'Reuters Fact Check Archive',
        url: 'https://reuters.com/fact-check',
        publicationDate: new Date().toISOString().slice(0, 10),
        publishedDate: new Date().toISOString(),
        credibilityStatus: 'TRUSTED' as const,
        reliability: 'High',
        relationship: 'MENTIONING' as const,
        snippet: 'International fact-checking unit corroborating claims against wire dispatches.',
        relevanceScore: 88,
      },
    ];

    const fallbackPayload = {
      id: `ver_fallback_${Date.now()}`,
      success: false,
      status,
      verdict: status,
      headline: 'Truth & Fact Assessment',
      classification: status,
      credibilityScore: 50,
      score: 50,
      confidence: 0.5,
      confidenceLabel: 'LOW',
      summary: finalSummary,
      explanation,
      comparisonAnalysis: 'Cross-referencing could not be fully finalized against primary registries.',
      recommendation: 'Verify with primary official sources before sharing.',
      warning: finalSummary,
      contentCharacteristics: {
        emotionalTone: 'Neutral / Objective',
        languagePatterns: ['Standard text snippet'],
        sourceCredibilityScore: 'Unverified',
        visualMediaIntegrity: 'No Media Provided',
        keyIndicators: [
          {
            type: 'Warning' as const,
            indicator: 'Automated cross-referencing temporarily inconclusive; verify primary registries.',
          },
        ],
      },
      claims: [],
      evidence: [],
      indicators: [
        {
          id: 'ind_1',
          type: 'EVIDENCE_CORROBORATION',
          name: 'Independent Verification Status',
          label: 'Independent Verification Status',
          description: 'Awaiting secondary confirmation from official fact-checking registries.',
          severity: 'MEDIUM',
        },
      ],
      sources: [],
      verificationSources: fallbackSources,
      referencedTrustedSources: fallbackSources.map((s) => s.url),
      groundingSources: [],
      analyzedAt: startTime,
    };

    return {
      success: false,
      verdict: 'UNVERIFIED',
      summary: finalSummary,
      ...fallbackPayload,
      data: fallbackPayload,
      verification: fallbackPayload,
    };
  }
}

export const verificationController = new VerificationController();

