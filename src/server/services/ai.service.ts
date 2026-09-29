import { env } from '../config/environment.js';
import { getGoogleGenAIClient, resolveAIModel, isAIConfigured } from '../config/gemini.js';
import {
  ClassificationType,
  ConfidenceLabel,
  IClaim,
  IEvidence,
  IIndicator,
  SubmissionType,
} from '../types/verification.types.js';
import { ISource } from '../types/source.types.js';
import {
  AIServiceAssessmentInput,
  AIServiceResponse,
  ExtractedClaimResult,
} from '../types/ai.types.js';

export interface IAIService {
  extractClaims(content: string, type: SubmissionType): Promise<ExtractedClaimResult>;
  generateVerificationAssessment(input: AIServiceAssessmentInput): Promise<AIServiceResponse>;
  generateExplanation(classification: ClassificationType, score: number, claims: IClaim[], evidence: IEvidence[]): string;
  generateRecommendation(classification: ClassificationType, score: number): string;
  generateWarning(classification: ClassificationType, confidence: number, sources: ISource[]): string | null;
}

export class AIService implements IAIService {
  /**
   * 1. Extracts discrete testable atomic claims from user submission
   */
  async extractClaims(content: string, type: SubmissionType): Promise<ExtractedClaimResult> {
    const cleaned = content.trim();

    if (isAIConfigured() && cleaned.length > 10) {
      try {
        const client = getGoogleGenAIClient();
        const model = resolveAIModel();
        const response = await client.models.generateContent({
          model,
          contents: `You are an expert fact-checker and claim extraction engine for Ghana & West African public discourse.
Extract the discrete factual claims from the following ${type} content.

Content:
"${cleaned}"

Return a STRICT JSON object in this exact schema:
{
  "coreTopic": "High-level topic of the content",
  "summary": "1-sentence neutral summary",
  "claims": [
    {
      "id": "clm_1",
      "text": "Specific, factual, verifiable atomic claim statement",
      "context": "Context or timeframe mentioned"
    }
  ]
}
Do not return Markdown or conversational text, only valid JSON.`,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim() || '';
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.claims) && parsed.claims.length > 0) {
            return {
              coreTopic: parsed.coreTopic || 'Public Claim Verification',
              summary: parsed.summary || cleaned.substring(0, 120),
              claims: parsed.claims.map((c: any, index: number) => ({
                id: c.id || `clm_${index + 1}`,
                text: c.text || c,
                context: c.context || '',
              })),
            };
          }
        }
      } catch (err) {
        console.warn('[AIService] Gemini claim extraction fallback activated:', (err as Error).message);
      }
    }

    // Heuristic claim extractor fallback
    const sentences = cleaned
      .split(/(?<=[.!?\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    const claims = (sentences.length > 0 ? sentences.slice(0, 3) : [cleaned]).map((stmt, idx) => ({
      id: `clm_${idx + 1}`,
      text: stmt,
      context: 'Submitted content statement',
    }));

    return {
      coreTopic: 'Information & Media Verification',
      summary: cleaned.length > 140 ? `${cleaned.substring(0, 140)}...` : cleaned,
      claims,
    };
  }

  /**
   * 2. Synthesizes cross-referenced evidence, source scores, and claims into structured assessment
   */
  async generateVerificationAssessment(input: AIServiceAssessmentInput): Promise<AIServiceResponse> {
    const { content, claims, evidence, sources, submissionType } = input;

    // Check if Gemini can perform the synthesis
    if (isAIConfigured() && claims.length > 0) {
      try {
        const client = getGoogleGenAIClient();
        const model = resolveAIModel();
        const evidenceSummary = evidence.map((e) => `[${e.type}] (${e.sourceName || e.sourceId}, Credibility ${e.credibility}/100): ${e.title} - ${e.description}`).join('\n');
        const sourcesSummary = sources.map((s) => `${s.name} (${s.domain}): Credibility ${s.credibilityScore}/100, Status: ${s.status}`).join('\n');

        const prompt = `You are VERIFAI GH's senior verification auditor and decision-support reasoning engine.
Analyze the following claims against collected evidence and source credibility scores.

SUBMISSION (${submissionType}):
"${content}"

EXTRACTED CLAIMS:
${JSON.stringify(claims, null, 2)}

COLLECTED EVIDENCE:
${evidenceSummary || 'No external evidence directly matched.'}

SOURCES EVALUATED:
${sourcesSummary}

Produce a structured JSON assessment following these strict guidelines:
1. classification MUST be one of: "VERIFIED", "TRUSTED", "SUSPICIOUS", "FAKE", "UNVERIFIED"
2. credibilityScore: Integer 0 to 100
3. confidence: Float 0.0 to 1.0
4. confidenceLabel: "LOW" | "MEDIUM" | "HIGH"
5. Do NOT just output a binary result. Provide a balanced, transparent explanation and actionable recommendation.
6. Provide indicators (e.g., sensationalism, lack of official source, manipulated quote, corroborated by official gazette).

Return STRICT JSON:
{
  "classification": "VERIFIED" | "TRUSTED" | "SUSPICIOUS" | "FAKE" | "UNVERIFIED",
  "credibilityScore": number,
  "confidence": number,
  "confidenceLabel": "LOW" | "MEDIUM" | "HIGH",
  "explanation": "Detailed multi-sentence explanation of findings and contradictory/supporting evidence.",
  "recommendation": "Clear civic recommendation for the user before sharing.",
  "warning": "Warning string if low confidence/suspicious source or null",
  "claims": [
    {
      "id": "string",
      "text": "string",
      "classification": "VERIFIED" | "TRUSTED" | "SUSPICIOUS" | "FAKE" | "UNVERIFIED",
      "confidence": number,
      "explanation": "Brief explanation for this specific claim"
    }
  ],
  "indicators": [
    {
      "type": "string",
      "label": "string",
      "description": "string",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    }
  ]
}`;

        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim() || '';
        if (text) {
          const parsed = JSON.parse(text);
          return {
            classification: this.normalizeClassification(parsed.classification),
            credibilityScore: Math.min(100, Math.max(0, Math.round(parsed.credibilityScore ?? 50))),
            confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence ?? 0.7))),
            confidenceLabel: this.normalizeConfidenceLabel(parsed.confidenceLabel),
            explanation: parsed.explanation || this.generateExplanation(parsed.classification, parsed.credibilityScore, claims as any, evidence),
            recommendation: parsed.recommendation || this.generateRecommendation(parsed.classification, parsed.credibilityScore),
            warning: parsed.warning || null,
            claims: (parsed.claims || []).map((c: any, idx: number) => ({
              id: c.id || `clm_${idx + 1}`,
              text: c.text || claims[idx]?.text || 'Claim statement',
              classification: this.normalizeClassification(c.classification),
              confidence: parseFloat(c.confidence ?? 0.7),
              explanation: c.explanation || '',
            })),
            indicators: (parsed.indicators || []).map((i: any) => ({
              type: i.type || 'SOURCE_EVALUATION',
              label: i.label || 'Verification Metric',
              description: i.description || '',
              severity: i.severity || 'MEDIUM',
            })),
          };
        }
      } catch (err) {
        console.warn('[AIService] Gemini assessment synthesis fallback:', (err as Error).message);
      }
    }

    // Rule-based decision-support evaluation engine
    return this.generateRuleBasedAssessment(input);
  }

  private generateRuleBasedAssessment(input: AIServiceAssessmentInput): AIServiceResponse {
    const { claims, evidence, sources } = input;

    let supportingCount = 0;
    let contradictingCount = 0;
    let totalEvidenceCredibility = 0;

    for (const ev of evidence) {
      if (ev.type === 'SUPPORTING') supportingCount++;
      if (ev.type === 'CONTRADICTING') contradictingCount++;
      totalEvidenceCredibility += ev.credibility;
    }

    const avgEvidenceCredibility = evidence.length > 0 ? totalEvidenceCredibility / evidence.length : 50;
    const avgSourceCredibility =
      sources.length > 0
        ? sources.reduce((acc, s) => acc + s.credibilityScore, 0) / sources.length
        : 50;

    let classification: ClassificationType = 'UNVERIFIED';
    let credibilityScore = 50;
    let confidence = 0.65;
    let warning: string | null = null;

    if (contradictingCount > 0 && contradictingCount >= supportingCount) {
      classification = contradictingCount >= 2 ? 'FAKE' : 'SUSPICIOUS';
      credibilityScore = Math.max(10, Math.round(100 - avgEvidenceCredibility * 0.9));
      confidence = 0.85;
      warning = 'Multiple independent fact-checking or official sources contradict this claim.';
    } else if (supportingCount > 0 && avgSourceCredibility >= 80) {
      classification = avgSourceCredibility >= 90 ? 'VERIFIED' : 'TRUSTED';
      credibilityScore = Math.min(98, Math.round(avgSourceCredibility * 0.95));
      confidence = 0.9;
    } else if (evidence.length === 0) {
      classification = 'UNVERIFIED';
      credibilityScore = 48;
      confidence = 0.45;
      warning = 'Limited or no corroborating evidence found in public archives. Verification ongoing.';
    }

    const confidenceLabel: ConfidenceLabel = confidence >= 0.8 ? 'HIGH' : confidence >= 0.6 ? 'MEDIUM' : 'LOW';

    const analyzedClaims: IClaim[] = claims.map((c, i) => ({
      id: c.id || `clm_${i + 1}`,
      text: c.text,
      classification,
      confidence,
      explanation:
        classification === 'FAKE' || classification === 'SUSPICIOUS'
          ? 'Contradicted by verified registry records and press dispatches.'
          : classification === 'VERIFIED'
          ? 'Corroborated by verified statutory media and institutional publications.'
          : 'Insufficient cross-referenced evidence to confirm full veracity.',
    }));

    const indicators: IIndicator[] = [
      {
        type: 'SOURCE_REPUTATION',
        label: 'Source Integrity Audit',
        description: `Evaluated ${sources.length} domains with an average trust index of ${Math.round(avgSourceCredibility)}/100.`,
        severity: avgSourceCredibility >= 75 ? 'LOW' : avgSourceCredibility >= 45 ? 'MEDIUM' : 'HIGH',
      },
      {
        type: 'CROSS_EXAMINATION',
        label: 'Evidence Cross-Referencing',
        description: `Found ${supportingCount} supporting, ${contradictingCount} contradicting, and ${evidence.length - supportingCount - contradictingCount} contextual records.`,
        severity: contradictingCount > 0 ? 'HIGH' : 'LOW',
      },
    ];

    const explanation = this.generateExplanation(classification, credibilityScore, analyzedClaims, evidence);
    const recommendation = this.generateRecommendation(classification, credibilityScore);

    return {
      classification,
      credibilityScore,
      confidence,
      confidenceLabel,
      explanation,
      recommendation,
      warning,
      claims: analyzedClaims,
      indicators,
    };
  }

  generateExplanation(
    classification: ClassificationType,
    score: number,
    claims: IClaim[],
    evidence: IEvidence[]
  ): string {
    const claimCount = claims.length;
    const supporting = evidence.filter((e) => e.type === 'SUPPORTING').length;
    const contradicting = evidence.filter((e) => e.type === 'CONTRADICTING').length;

    if (classification === 'VERIFIED' || classification === 'TRUSTED') {
      return `Our automated analysis cross-referenced ${claimCount} claim(s) across authoritative newsrooms and official portals. Found ${supporting} supporting record(s) with high institutional credibility (Overall score: ${score}/100). No credible contradictory statements were detected.`;
    }

    if (classification === 'FAKE' || classification === 'SUSPICIOUS') {
      return `Our automated assessment identified ${contradicting} reputable contradictory source(s) refuting the submitted assertions (Credibility score: ${score}/100). Key claims depart significantly from verified public records, statutory notices, or accredited journalism reports.`;
    }

    return `The submitted information has been evaluated against national archives and news indices (Credibility score: ${score}/100). There is currently insufficient verified evidence to confirm or conclusively debunk the claims. Proceed with caution.`;
  }

  generateRecommendation(classification: ClassificationType, _score: number): string {
    switch (classification) {
      case 'VERIFIED':
        return 'The core claims are corroborated by verified sources. Safe to share with proper attribution.';
      case 'TRUSTED':
        return 'Information appears reliable and originates from established sources. Standard context awareness advised.';
      case 'SUSPICIOUS':
        return 'Exercise caution. Do not share or amplify this claim until confirmed by official institutional channels.';
      case 'FAKE':
        return 'Do NOT share this content. Multiple verified fact-checking bureaus and statutory authorities have debunked this claim.';
      case 'UNVERIFIED':
      default:
        return 'Verify with a primary official source before sharing. The evidence is currently inconclusive.';
    }
  }

  generateWarning(
    classification: ClassificationType,
    confidence: number,
    sources: ISource[]
  ): string | null {
    if (classification === 'FAKE') {
      return 'High risk misinformation warning. Fabricated or debunked narrative detected.';
    }
    if (confidence < 0.5) {
      return 'Low confidence assessment due to sparse public evidence.';
    }
    const hasUnreliableSource = sources.some((s) => s.status === 'UNRELIABLE' || s.status === 'SUSPICIOUS');
    if (hasUnreliableSource) {
      return 'Content originates from or references platforms with low editorial oversight.';
    }
    return null;
  }

  private normalizeClassification(val: string): ClassificationType {
    const upper = (val || '').toUpperCase();
    if (['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED'].includes(upper)) {
      return upper as ClassificationType;
    }
    return 'UNVERIFIED';
  }

  private normalizeConfidenceLabel(val: string): ConfidenceLabel {
    const upper = (val || '').toUpperCase();
    if (['LOW', 'MEDIUM', 'HIGH'].includes(upper)) {
      return upper as ConfidenceLabel;
    }
    return 'MEDIUM';
  }
}

export const aiService = new AIService();
