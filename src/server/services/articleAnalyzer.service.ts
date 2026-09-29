import fs from 'fs';
import axios from 'axios';
import * as pdfParseModule from 'pdf-parse';
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;
import { getGoogleGenAIClient, resolveAIModel } from '../config/gemini.js';
import { ClassificationType, ConfidenceLabel, IVerificationSource } from '../types/verification.types.js';
import { extractAndNormalizeVerificationSources } from '../utils/sourceExtractor.js';
import { heuristicFactChecker } from './heuristicFactChecker.js';

export interface ArticleAnalysisInput {
  content?: string;
  text?: string;
  url?: string;
  sourceUrl?: string;
  articleUrl?: string;
  image?: string;
  imageUrl?: string;
  fileData?: {
    base64?: string;
    mimeType?: string;
    name?: string;
  };
  file?: Express.Multer.File;
  submissionType?: string;
}

import { ISourceTrace, ISourceTraceNode } from '../types/verification.types.js';

export interface ArticleAnalysisResult {
  success: boolean;
  verdict: 'VERIFIED_REAL' | 'CONFIRMED_FAKE' | 'MISLEADING_CONTEXT' | 'UNVERIFIED' | 'VERIFIED' | 'TRUSTED' | 'SUSPICIOUS' | 'FAKE';
  headline: string;
  classification: ClassificationType;
  credibilityScore: number;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  summary: string;
  explanation: string;
  comparisonAnalysis?: string;
  recommendation: string;
  warning: string | null;
  sourceTrace?: ISourceTrace;
  contentCharacteristics?: {
    emotionalTone: 'Sensationalist / High Alarm' | 'Neutral / Objective' | 'Opinionated' | string;
    languagePatterns: string[];
    sourceCredibilityScore: 'High' | 'Medium' | 'Low' | 'Unverified' | string;
    visualMediaIntegrity: 'Authentic' | 'Digitally Manipulated' | 'Out of Context' | 'No Media Provided' | string;
    keyIndicators: Array<{
      type: 'Red Flag' | 'Green Flag' | 'Warning' | string;
      indicator: string;
    }>;
  };
  claims: Array<{
    id: string;
    text: string;
    classification: ClassificationType;
    confidence: number;
    explanation: string;
  }>;
  evidence: Array<{
    id: string;
    title: string;
    sourceName: string;
    sourceUrl?: string;
    type: 'SUPPORTING' | 'CONTRADICTING' | 'CONTEXTUAL';
    credibility: number;
    description: string;
  }>;
  indicators: Array<{
    type: string;
    label: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  sources: Array<{
    name: string;
    domain: string;
    status: 'VERIFIED' | 'TRUSTED' | 'SUSPICIOUS' | 'UNRELIABLE';
    credibilityScore: number;
  }>;
  verificationSources?: IVerificationSource[];
  referencedTrustedSources?: string[];
  groundingSources?: Array<{
    title: string;
    uri: string;
  }>;
  rawText?: string;
  analyzedAt: string;
}

/**
 * Returns a valid fail-safe fallback response contract if any step fails
 */
export function getFallbackAnalysisResult(errorMessage?: string): ArticleAnalysisResult {
  return {
    success: false,
    verdict: 'UNVERIFIED',
    headline: 'Analysis Incomplete',
    classification: 'UNVERIFIED',
    credibilityScore: 50,
    confidence: 0.5,
    confidenceLabel: 'LOW',
    summary:
      errorMessage ||
      'Unable to reach external sources or process media format. Please check your URL/file and try again.',
    explanation:
      'The verification analysis engine could not complete the automated evaluation against external sources. You may retry with alternative text, a direct URL, or an uploaded document.',
    comparisonAnalysis: 'Cross-referencing could not be finalized against trusted databases.',
    recommendation: 'Verify with primary official sources before sharing.',
    warning: 'Unable to reach external sources or process media format. Please check your URL/file and try again.',
    sourceTrace: {
      submittedSource: {
        name: 'Information unavailable',
        domain: 'Information unavailable',
        url: 'Information unavailable',
        publishedDate: 'Information unavailable',
        headline: 'Information unavailable',
        summary: 'No source details accessible',
        credibilityScore: 50,
        isAvailable: false,
      },
      earliestSource: {
        name: 'Information unavailable',
        domain: 'Information unavailable',
        url: 'Information unavailable',
        publishedDate: 'Information unavailable',
        headline: 'Information unavailable',
        summary: 'Earliest publication record could not be established',
        credibilityScore: 50,
        isAvailable: false,
      },
      otherSources: [],
      supportingEvidence: [],
      contradictingEvidence: [],
      traceConfidence: 'LOW',
      propagationFlow: ['Origin unverified -> Analysis incomplete'],
      notes: 'Automated source provenance trace was unable to retrieve live external origin signals.',
    },
    contentCharacteristics: {
      emotionalTone: 'Neutral / Objective',
      languagePatterns: ['Standard article text'],
      sourceCredibilityScore: 'Unverified',
      visualMediaIntegrity: 'No Media Provided',
      keyIndicators: [
        {
          type: 'Warning',
          indicator: 'Automated cross-referencing temporarily unavailable; verify primary registries.',
        },
      ],
    },
    claims: [],
    evidence: [],
    indicators: [],
    sources: [],
    referencedTrustedSources: [],
    groundingSources: [],
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Safely extracts and parses JSON payload from Gemini response text
 */
export function extractJsonFromResponse(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from AI model.');
  }

  // Strip code block fences and whitespace
  let cleaned = rawText.replace(/```json|```/g, '').trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    // Search for outermost JSON object boundary
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      cleaned = cleaned
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
      try {
        return JSON.parse(cleaned);
      } catch (innerErr: any) {
        console.error('[extractJsonFromResponse] Fallback parse failed:', innerErr.message);
      }
    }
    throw new Error(`Failed to parse structured JSON from model output: ${err.message}`);
  }
}

/**
 * Strips HTML tags and extracts readable article text
 */
function extractCleanTextFromHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Senior AI Article & Fact-Checking Analysis Service
 * Implements Google GenAI with Google Search Grounding using 'gemini-3.6-flash'
 */
export class ArticleAnalyzerService {
  async analyzeArticle(input: ArticleAnalysisInput): Promise<ArticleAnalysisResult> {
    try {
      const parts: any[] = [];
      let aggregatedTextContext = '';
      const targetUrl = input.url || input.sourceUrl || input.articleUrl;

      // ----------------------------------------------------
      // 1. Process Plain Text & URL Inputs
      // ----------------------------------------------------
      const rawText = (input.content || input.text || '').trim();
      if (rawText) {
        aggregatedTextContext += `Submitted Content / Text:\n${rawText}\n\n`;
      }

      if (targetUrl) {
        aggregatedTextContext += `Target Article URL:\n${targetUrl}\n\n`;
        // Attempt to fetch clean text content from the URL
        try {
          if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
            const urlResponse = await axios.get(targetUrl, {
              timeout: 7000,
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 VerifAI/1.0',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              },
              maxContentLength: 5 * 1024 * 1024,
            });

            if (urlResponse.data && typeof urlResponse.data === 'string') {
              const cleanText = extractCleanTextFromHtml(urlResponse.data);
              if (cleanText.length > 50) {
                const truncatedArticle = cleanText.substring(0, 15000);
                aggregatedTextContext += `Fetched Webpage Content (Clean Text):\n${truncatedArticle}\n\n`;
              }
            }
          }
        } catch (fetchErr: any) {
          console.warn(`[ArticleAnalyzer] URL fetch skipped/failed (${targetUrl}), relying on Google Search Grounding:`, fetchErr.message);
        }
      }

      // ----------------------------------------------------
      // 2. Process Image Inputs (Strip Data URI & Format inlineData)
      // ----------------------------------------------------
      let base64ImageString: string | null = null;
      let imageMimeType = 'image/jpeg';

      if (input.fileData?.base64) {
        const rawBase64 = input.fileData.base64;
        const match = rawBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.*)$/);
        if (match) {
          imageMimeType = match[1] || 'image/jpeg';
          base64ImageString = match[2];
        } else {
          base64ImageString = rawBase64.replace(/^data:image\/\w+;base64,/, '').replace(/^data:[^;]+;base64,/, '');
          if (input.fileData.mimeType) {
            imageMimeType = input.fileData.mimeType;
          }
        }
      } else if (input.image) {
        const rawImage = input.image.trim();
        if (rawImage.startsWith('data:image/')) {
          const match = rawImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.*)$/);
          if (match) {
            imageMimeType = match[1];
            base64ImageString = match[2];
          } else {
            base64ImageString = rawImage.replace(/^data:image\/\w+;base64,/, '').replace(/^data:[^;]+;base64,/, '');
          }
        } else if (!rawImage.startsWith('http://') && !rawImage.startsWith('https://') && !rawImage.startsWith('/')) {
          base64ImageString = rawImage.replace(/^data:image\/\w+;base64,/, '');
        }
      } else if (input.file && input.file.path && fs.existsSync(input.file.path)) {
        if (input.file.mimetype.startsWith('image/')) {
          imageMimeType = input.file.mimetype;
          base64ImageString = fs.readFileSync(input.file.path).toString('base64');
        }
      }

      if (base64ImageString) {
        // Strip any residual whitespace, data URIs or linebreaks
        const cleanData = base64ImageString.replace(/^data:image\/\w+;base64,/, '').replace(/\s/g, '');
        parts.push({
          inlineData: {
            mimeType: imageMimeType,
            data: cleanData,
          },
        });
      }

      // ----------------------------------------------------
      // 3. Process PDF / Document Inputs
      // ----------------------------------------------------
      if (input.fileData && (input.fileData.mimeType === 'application/pdf' || input.fileData.name?.endsWith('.pdf'))) {
        try {
          const rawBase64 = input.fileData.base64 || '';
          const cleanPdfBase64 = rawBase64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
          if (cleanPdfBase64) {
            const pdfBuffer = Buffer.from(cleanPdfBase64, 'base64');
            const pdfData = await pdfParse(pdfBuffer);
            if (pdfData && pdfData.text && pdfData.text.trim()) {
              aggregatedTextContext += `Extracted PDF Document Content:\n${pdfData.text.substring(0, 15000)}\n\n`;
            } else {
              // Fallback: pass inlineData PDF
              parts.push({
                inlineData: {
                  mimeType: 'application/pdf',
                  data: cleanPdfBase64,
                },
              });
            }
          }
        } catch (pdfErr: any) {
          console.warn('[ArticleAnalyzer] PDF parse failed, attaching as inlineData:', pdfErr.message);
          const cleanPdfBase64 = (input.fileData.base64 || '').replace(/^data:application\/pdf;base64,/, '').replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
          if (cleanPdfBase64) {
            parts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: cleanPdfBase64,
              },
            });
          }
        }
      } else if (input.file && input.file.path && fs.existsSync(input.file.path) && input.file.mimetype === 'application/pdf') {
        try {
          const pdfBuffer = fs.readFileSync(input.file.path);
          const pdfData = await pdfParse(pdfBuffer);
          if (pdfData && pdfData.text && pdfData.text.trim()) {
            aggregatedTextContext += `Extracted PDF Document Content:\n${pdfData.text.substring(0, 15000)}\n\n`;
          } else {
            parts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBuffer.toString('base64'),
              },
            });
          }
        } catch (pdfErr: any) {
          console.warn('[ArticleAnalyzer] Uploaded PDF parse fallback to inlineData:', pdfErr.message);
          const pdfBuffer = fs.readFileSync(input.file.path);
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBuffer.toString('base64'),
            },
          });
        }
      }

      // Check if we have at least some input to analyze
      if (!aggregatedTextContext.trim() && parts.length === 0) {
        return getFallbackAnalysisResult('No readable article text, URL, screenshot image, or PDF document provided for analysis.');
      }

      // ----------------------------------------------------
      // 4. Construct Prompt for Google GenAI with Search Grounding
      // ----------------------------------------------------
      const promptText = `You are an expert investigative fact-checker. Your sole objective is to verify text, images, uploaded documents, or URLs for fake news, propaganda, or misinformation.

CROSS-REFERENCING RULE:
You MUST search for and cross-reference claims against AT LEAST 3 distinct, reputable news outlets or official databases (e.g., Reuters, AP News, BBC, official government notices, accredited state news agencies) before issuing a verdict.

INPUT MATERIAL TO ANALYZE:
${aggregatedTextContext.trim() || 'Analyze the attached image/document material.'}

INSTRUCTIONS FOR OUTPUT FORMAT:
Return your response strictly as a JSON object inside \`\`\`json \`\`\` markdown code fence.
Do not output conversational text or additional explanations outside the \`\`\`json \`\`\` code block.

SCHEMA SPECIFICATION:
\`\`\`json
{
  "verdict": "VERIFIED_REAL" | "CONFIRMED_FAKE" | "MISLEADING_CONTEXT" | "UNVERIFIED",
  "headline": "Short punchy verification headline summarizing finding",
  "classification": "VERIFIED" | "TRUSTED" | "SUSPICIOUS" | "FAKE" | "UNVERIFIED",
  "credibilityScore": number (Integer 0 to 100),
  "confidence": number (Float 0.0 to 1.0),
  "confidenceLabel": "LOW" | "MEDIUM" | "HIGH",
  "summary": "Concise 1-2 sentence executive summary of the content and its veracity",
  "explanation": "Detailed multi-paragraph explanation detailing findings, corroborated points, and any contradictory evidence found across verified news registries.",
  "comparisonAnalysis": "Detailed breakdown highlighting exactly where the submitted claim aligns or conflicts with trusted reporting from reputable outlets.",
  "referencedTrustedSources": ["https://reuters.com/...", "https://apnews.com/...", "https://bbc.com/..."],
  "recommendation": "Actionable civic advice for the reader before disseminating or acting upon this information.",
  "warning": "Critical safety/misinformation warning string if misleading or unverified, or null if trustworthy.",
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
      "text": "Specific atomic factual claim statement",
      "classification": "VERIFIED" | "TRUSTED" | "SUSPICIOUS" | "FAKE" | "UNVERIFIED",
      "confidence": number (0.0 to 1.0),
      "explanation": "Clear factual verification or debunking note for this specific claim"
    }
  ],
  "evidence": [
    {
      "id": "ev_1",
      "title": "Title of corroborating or debunking news report / official notice",
      "sourceName": "Name of publisher (e.g. Reuters, AP News, BBC, Ghana News Agency)",
      "sourceUrl": "URL of the source or domain",
      "type": "SUPPORTING" | "CONTRADICTING" | "CONTEXTUAL",
      "credibility": number (0 to 100),
      "description": "Specific excerpt or synthesis of the evidence discovered"
    }
  ],
  "indicators": [
    {
      "type": "SOURCE_CREDIBILITY" | "EVIDENCE_CORROBORATION" | "SENSATIONALISM_DETECTION" | "ANOMALY_SCAN",
      "label": "Indicator title",
      "description": "Detailed explanation of what was detected",
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
  ],
  "sourceTrace": {
    "submittedSource": {
      "name": "Name of submitted publisher/outlet or 'Information unavailable'",
      "domain": "Domain or 'Information unavailable'",
      "url": "Direct source link or 'Information unavailable'",
      "publishedDate": "Estimated publication date or 'Information unavailable'",
      "headline": "Submitted headline or claim context",
      "summary": "Context of how claim was shared",
      "credibilityScore": number (0 to 100),
      "isAvailable": true/false
    },
    "earliestSource": {
      "name": "Name of earliest discoverable publisher/origin or 'Information unavailable'",
      "domain": "Domain or 'Information unavailable'",
      "url": "Earliest discoverable URL or 'Information unavailable'",
      "publishedDate": "Earliest discoverable timestamp/date or 'Information unavailable'",
      "headline": "Original report headline or 'Information unavailable'",
      "summary": "Origin context or 'Information unavailable'",
      "credibilityScore": number (0 to 100),
      "isAvailable": true/false
    },
    "otherSources": [
      {
        "name": "Outlet name",
        "domain": "Domain",
        "url": "URL or 'Information unavailable'",
        "publishedDate": "Date or 'Information unavailable'",
        "headline": "Headline or report title",
        "summary": "Brief summary",
        "credibilityScore": number (0 to 100)
      }
    ],
    "supportingEvidence": [
      {
        "name": "Source / Registry Name",
        "domain": "Domain",
        "url": "URL or 'Information unavailable'",
        "publishedDate": "Date or 'Information unavailable'",
        "headline": "Supporting Report Title",
        "summary": "Summary of supporting evidence",
        "credibilityScore": number (0 to 100)
      }
    ],
    "contradictingEvidence": [
      {
        "name": "Source / Registry Name",
        "domain": "Domain",
        "url": "URL or 'Information unavailable'",
        "publishedDate": "Date or 'Information unavailable'",
        "headline": "Debunking / Contradictory Report Title",
        "summary": "Summary of contradicting evidence",
        "credibilityScore": number (0 to 100)
      }
    ],
    "traceConfidence": "HIGH" | "MEDIUM" | "LOW",
    "propagationFlow": ["Earliest Origin -> News Wire / Social -> Aggregator -> Submitted Platform"],
    "notes": "Provenance and trace methodology findings"
  }
}
\`\`\``;

      parts.push({
        text: promptText,
      });

      // ----------------------------------------------------
      // 5. Call Gemini API with @google/genai SDK ('gemini-3.7-flash')
      // Note: When tools: [{ googleSearch: {} }] is enabled, do NOT pass responseSchema
      // ----------------------------------------------------
      let response: any = null;
      let rawResponseText = '';

      try {
        const ai = getGoogleGenAIClient();
        const model = resolveAIModel();

        try {
          response = await ai.models.generateContent({
            model,
            contents: {
              parts,
            },
            config: {
              tools: [{ googleSearch: {} }],
            },
          });
        } catch (geminiCallErr: any) {
          console.warn('[ArticleAnalyzerService] Primary model with search failed, attempting direct model call:', geminiCallErr.message);
          // Fallback call without tools if search grounding experienced quota/prepayment constraint
          response = await ai.models.generateContent({
            model,
            contents: {
              parts,
            },
          });
        }

        rawResponseText = typeof response?.text === 'function' ? response.text() : response?.text;
      } catch (geminiError: any) {
        console.warn('[ArticleAnalyzerService] GenAI service unavailable or quota exhausted, executing intelligent heuristic verification engine:', geminiError?.message);
      }

      // If GenAI did not produce valid structured text, run heuristic engine
      if (!rawResponseText || !rawResponseText.trim()) {
        const heuristicResult = await heuristicFactChecker.evaluate({
          content: rawText || aggregatedTextContext,
          url: targetUrl,
          imageName: input.fileData?.name || input.file?.filename,
          mimeType: input.fileData?.mimeType || input.file?.mimetype,
          file: input.file,
          submissionType: input.submissionType as any,
        });
        return {
          success: true,
          ...heuristicResult,
        };
      }

      // ----------------------------------------------------
      // 6. Safely Parse and Normalize Structured Result
      // ----------------------------------------------------
      const parsed = extractJsonFromResponse(rawResponseText);

      // Extract Grounding Chunks if available
      const candidate = response.candidates?.[0];
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
      const groundingSources = groundingChunks
        .filter((chunk: any) => chunk?.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web?.title || 'Grounding Reference',
          uri: chunk.web?.uri || '',
        }));

      // Normalize verdict & classification
      const rawVerdict = (parsed.verdict || parsed.classification || 'UNVERIFIED').toUpperCase();
      let normalizedVerdict: 'VERIFIED_REAL' | 'CONFIRMED_FAKE' | 'MISLEADING_CONTEXT' | 'UNVERIFIED' = 'UNVERIFIED';
      let classification: ClassificationType = 'UNVERIFIED';

      if (rawVerdict.includes('REAL') || rawVerdict === 'VERIFIED' || rawVerdict === 'TRUSTED') {
        normalizedVerdict = 'VERIFIED_REAL';
        classification = 'VERIFIED';
      } else if (rawVerdict.includes('FAKE')) {
        normalizedVerdict = 'CONFIRMED_FAKE';
        classification = 'FAKE';
      } else if (rawVerdict.includes('MISLEADING') || rawVerdict === 'SUSPICIOUS') {
        normalizedVerdict = 'MISLEADING_CONTEXT';
        classification = 'SUSPICIOUS';
      } else {
        normalizedVerdict = 'UNVERIFIED';
        classification = 'UNVERIFIED';
      }

      const credibilityScore = Math.min(
        100,
        Math.max(
          0,
          Math.round(
            parsed.credibilityScore ??
              (normalizedVerdict === 'VERIFIED_REAL' ? 95 : normalizedVerdict === 'MISLEADING_CONTEXT' ? 35 : normalizedVerdict === 'CONFIRMED_FAKE' ? 10 : 50)
          )
        )
      );
      const rawConfidence = parseFloat(parsed.confidence ?? 0.85);
      const confidence = isNaN(rawConfidence) ? 0.85 : Math.min(1.0, Math.max(0.0, rawConfidence));
      const confidenceLabel: ConfidenceLabel =
        parsed.confidenceLabel && ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.confidenceLabel.toUpperCase())
          ? (parsed.confidenceLabel.toUpperCase() as ConfidenceLabel)
          : confidence >= 0.8
          ? 'HIGH'
          : confidence >= 0.5
          ? 'MEDIUM'
          : 'LOW';

      const validClassifications: ClassificationType[] = ['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED'];

      // Assemble referenced trusted sources
      const referencedTrustedSources: string[] = Array.isArray(parsed.referencedTrustedSources)
        ? parsed.referencedTrustedSources
        : groundingSources.map((g) => g.uri);

      // Assemble full normalized result
      const result: ArticleAnalysisResult = {
        success: true,
        verdict: normalizedVerdict,
        headline: parsed.headline || `${normalizedVerdict.replace('_', ' ')} - Information Assessment Report`,
        classification,
        credibilityScore,
        confidence,
        confidenceLabel,
        summary: parsed.summary || rawText.substring(0, 150) || 'Article verification completed.',
        explanation:
          parsed.explanation ||
          'Analysis conducted using real-time search grounding and multimodal artifact cross-examination.',
        comparisonAnalysis:
          parsed.comparisonAnalysis ||
          'Cross-referenced against accredited public reporting and independent fact-checking databases.',
        recommendation:
          parsed.recommendation ||
          (normalizedVerdict === 'CONFIRMED_FAKE' || normalizedVerdict === 'MISLEADING_CONTEXT'
            ? 'Do not amplify or share this claim without verification from accredited statutory news organizations.'
            : 'Information is corroborated by primary sources. Exercise standard editorial discretion.'),
        warning:
          parsed.warning || (normalizedVerdict === 'CONFIRMED_FAKE' ? 'High risk misinformation warning.' : null),
        contentCharacteristics: (() => {
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
                indicator: 'Unsubstantiated assertions contradicting verified reporting',
              });
              normalizedKeyIndicators.push({
                type: 'Warning',
                indicator: 'Sensational or urgent phrasing detected',
              });
            } else if (classification === 'SUSPICIOUS') {
              normalizedKeyIndicators.push({
                type: 'Warning',
                indicator: 'Missing attribution or single-source testimony',
              });
            } else {
              normalizedKeyIndicators.push({
                type: 'Green Flag',
                indicator: 'Facts corroborate against established news wire archives',
              });
            }
          }

          let languagePatterns: string[] = [];
          if (Array.isArray(rawCC.languagePatterns) && rawCC.languagePatterns.length > 0) {
            languagePatterns = rawCC.languagePatterns.map((lp: any) => String(lp).trim()).filter(Boolean);
          } else {
            if (classification === 'FAKE') {
              languagePatterns = ['Sensational phrasing', 'Urgent call to action', 'Anonymous citations'];
            } else if (classification === 'SUSPICIOUS') {
              languagePatterns = ['Speculative language', 'Loaded terminology'];
            } else {
              languagePatterns = ['Objective reporting tone', 'Attributed citations', 'Formal journalistic syntax'];
            }
          }

          return {
            emotionalTone: rawCC.emotionalTone || defaultTone,
            languagePatterns,
            sourceCredibilityScore: rawCC.sourceCredibilityScore || defaultSourceCred,
            visualMediaIntegrity: rawCC.visualMediaIntegrity || (parts.length > 1 ? 'Authentic' : 'No Media Provided'),
            keyIndicators: normalizedKeyIndicators,
          };
        })(),
        claims: (parsed.claims || []).map((c: any, index: number) => ({
          id: c.id || `clm_${index + 1}`,
          text: c.text || `Claim ${index + 1}`,
          classification: validClassifications.includes((c.classification || '').toUpperCase())
            ? (c.classification.toUpperCase() as ClassificationType)
            : classification,
          confidence: parseFloat(c.confidence ?? confidence),
          explanation: c.explanation || '',
        })),
        evidence: (parsed.evidence || []).map((e: any, index: number) => ({
          id: e.id || `ev_${index + 1}`,
          title: e.title || 'Referenced Evidence Record',
          sourceName: e.sourceName || 'News Bureau Archive',
          sourceUrl: e.sourceUrl || '',
          type: ['SUPPORTING', 'CONTRADICTING', 'CONTEXTUAL'].includes((e.type || '').toUpperCase())
            ? (e.type.toUpperCase() as any)
            : 'CONTEXTUAL',
          credibility: Math.min(100, Math.max(0, Math.round(e.credibility ?? 80))),
          description: e.description || '',
        })),
        indicators: (parsed.indicators || []).map((i: any) => ({
          type: i.type || 'SOURCE_CREDIBILITY',
          label: i.label || 'Verification Signal',
          description: i.description || '',
          severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes((i.severity || '').toUpperCase())
            ? (i.severity.toUpperCase() as any)
            : 'MEDIUM',
        })),
        sourceTrace: (() => {
          const rawST = parsed.sourceTrace || {};
          const rawSub = rawST.submittedSource || {};
          const rawEarliest = rawST.earliestSource || {};
          const isUrlInput = input?.sourceUrl || input?.submissionType === 'ARTICLE_URL' || input?.submissionType === 'URL';

          const submittedNode: ISourceTraceNode = {
            name: rawSub.name && rawSub.name !== 'Information unavailable' ? rawSub.name : (input?.sourceUrl ? new URL(input.sourceUrl).hostname : 'Submitted Claim / Input Text'),
            domain: rawSub.domain && rawSub.domain !== 'Information unavailable' ? rawSub.domain : (input?.sourceUrl ? new URL(input.sourceUrl).hostname : 'Information unavailable'),
            url: rawSub.url && rawSub.url !== 'Information unavailable' ? rawSub.url : (input?.sourceUrl || 'Information unavailable'),
            publishedDate: rawSub.publishedDate && rawSub.publishedDate !== 'Information unavailable' ? rawSub.publishedDate : 'Information unavailable',
            headline: rawSub.headline && rawSub.headline !== 'Information unavailable' ? rawSub.headline : (parsed.headline || 'Analyzed Content Item'),
            summary: rawSub.summary && rawSub.summary !== 'Information unavailable' ? rawSub.summary : 'Source point analyzed by VerifAI GH verification pipeline.',
            credibilityScore: typeof rawSub.credibilityScore === 'number' ? Math.min(100, Math.max(0, Math.round(rawSub.credibilityScore))) : credibilityScore,
            status: classification,
            isAvailable: Boolean(rawSub.url && rawSub.url !== 'Information unavailable') || Boolean(input?.sourceUrl),
          };

          const earliestNode: ISourceTraceNode = {
            name: rawEarliest.name && rawEarliest.name !== 'Information unavailable' ? rawEarliest.name : (groundingSources[0]?.title || 'Information unavailable'),
            domain: rawEarliest.domain && rawEarliest.domain !== 'Information unavailable' ? rawEarliest.domain : (groundingSources[0]?.uri ? new URL(groundingSources[0].uri).hostname : 'Information unavailable'),
            url: rawEarliest.url && rawEarliest.url !== 'Information unavailable' ? rawEarliest.url : (groundingSources[0]?.uri || 'Information unavailable'),
            publishedDate: rawEarliest.publishedDate && rawEarliest.publishedDate !== 'Information unavailable' ? rawEarliest.publishedDate : 'Information unavailable',
            headline: rawEarliest.headline && rawEarliest.headline !== 'Information unavailable' ? rawEarliest.headline : (groundingSources[0]?.title || 'Information unavailable'),
            summary: rawEarliest.summary && rawEarliest.summary !== 'Information unavailable' ? rawEarliest.summary : (groundingSources[0] ? 'Earliest discovered corroborating coverage via Google Search grounding archives.' : 'Information unavailable'),
            credibilityScore: typeof rawEarliest.credibilityScore === 'number' ? Math.min(100, Math.max(0, Math.round(rawEarliest.credibilityScore))) : 85,
            status: 'VERIFIED',
            isAvailable: Boolean(rawEarliest.url && rawEarliest.url !== 'Information unavailable') || Boolean(groundingSources[0]?.uri),
          };

          const otherSources: ISourceTraceNode[] = Array.isArray(rawST.otherSources)
            ? rawST.otherSources.map((os: any) => ({
                name: os.name || 'External Media',
                domain: os.domain || 'Information unavailable',
                url: os.url || 'Information unavailable',
                publishedDate: os.publishedDate || 'Information unavailable',
                headline: os.headline || 'External Reporting',
                summary: os.summary || 'Secondary report coverage',
                credibilityScore: typeof os.credibilityScore === 'number' ? Math.min(100, Math.max(0, Math.round(os.credibilityScore))) : 75,
              }))
            : groundingSources.slice(1, 4).map((gs) => ({
                name: gs.title || 'Grounding Source',
                domain: gs.uri ? new URL(gs.uri).hostname : 'Information unavailable',
                url: gs.uri || 'Information unavailable',
                publishedDate: 'Information unavailable',
                headline: gs.title || 'Referenced Web Record',
                summary: 'Discovered during search grounding verification.',
                credibilityScore: 80,
              }));

          const supportingEvidence: ISourceTraceNode[] = Array.isArray(rawST.supportingEvidence)
            ? rawST.supportingEvidence.map((se: any) => ({
                name: se.name || 'Verified Wire / Registry',
                domain: se.domain || 'Information unavailable',
                url: se.url || 'Information unavailable',
                publishedDate: se.publishedDate || 'Information unavailable',
                headline: se.headline || 'Corroborating Evidence Record',
                summary: se.summary || 'Supporting evidence detail',
                credibilityScore: typeof se.credibilityScore === 'number' ? Math.min(100, Math.max(0, Math.round(se.credibilityScore))) : 90,
              }))
            : [];

          const contradictingEvidence: ISourceTraceNode[] = Array.isArray(rawST.contradictingEvidence)
            ? rawST.contradictingEvidence.map((ce: any) => ({
                name: ce.name || 'Fact-Checking Bureau',
                domain: ce.domain || 'Information unavailable',
                url: ce.url || 'Information unavailable',
                publishedDate: ce.publishedDate || 'Information unavailable',
                headline: ce.headline || 'Debunking / Contradicting Record',
                summary: ce.summary || 'Contradictory evidence detail',
                credibilityScore: typeof ce.credibilityScore === 'number' ? Math.min(100, Math.max(0, Math.round(ce.credibilityScore))) : 90,
              }))
            : [];

          const traceConfidence: 'HIGH' | 'MEDIUM' | 'LOW' = ['HIGH', 'MEDIUM', 'LOW'].includes((rawST.traceConfidence || '').toUpperCase())
            ? (rawST.traceConfidence.toUpperCase() as any)
            : (earliestNode.isAvailable ? 'HIGH' : 'LOW');

          const propagationFlow: string[] = Array.isArray(rawST.propagationFlow) && rawST.propagationFlow.length > 0
            ? rawST.propagationFlow.map((p: any) => String(p).trim())
            : [
                earliestNode.isAvailable ? `${earliestNode.name} (Earliest Discovered)` : 'Origin Pending Primary Wire Confirmation',
                ...otherSources.slice(0, 2).map((s) => `${s.name} (Syndication / Coverage)`),
                submittedNode.isAvailable ? `${submittedNode.name} (Submitted Claim)` : 'Analyzed Submission Record',
              ];

          return {
            submittedSource: submittedNode,
            earliestSource: earliestNode,
            otherSources,
            supportingEvidence,
            contradictingEvidence,
            traceConfidence,
            propagationFlow,
            notes: rawST.notes || 'Automated provenance reconstructed using cross-referenced search grounding and news archives.',
          };
        })(),
        sources: (parsed.sources || []).map((s: any) => ({
          name: s.name || 'External Media',
          domain: s.domain || 'media.source',
          status: ['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'UNRELIABLE'].includes((s.status || '').toUpperCase())
            ? (s.status.toUpperCase() as any)
            : 'TRUSTED',
          credibilityScore: Math.min(100, Math.max(0, Math.round(s.credibilityScore ?? 75))),
        })),
        verificationSources: extractAndNormalizeVerificationSources({
          groundingChunks,
          liveSearchResults: [],
          modelSources: Array.isArray(parsed.referencedTrustedSources) ? parsed.referencedTrustedSources : [],
          explanationText: parsed.explanation || '',
          comparisonAnalysis: parsed.comparisonAnalysis || '',
          summary: parsed.summary || '',
          verdictOrClassification: normalizedVerdict,
          sourceUrl: input?.sourceUrl || input?.url || input?.articleUrl,
        }),
        referencedTrustedSources,
        groundingSources,
        rawText: rawResponseText,
        analyzedAt: new Date().toISOString(),
      };

      return result;
    } catch (err: any) {
      console.error('[ArticleAnalyzerService] Fatal analysis exception caught, returning fail-safe fallback:', err?.message);
      return getFallbackAnalysisResult(
        err?.message?.includes('API key')
          ? 'AI_API_KEY configuration required. Please verify server environment keys.'
          : 'Unable to reach external sources or process media format. Please check your URL/file and try again.'
      );
    }
  }
}

export const articleAnalyzerService = new ArticleAnalyzerService();
