import { EvidenceType, IClaim, IEvidence } from '../types/verification.types.js';
import { SearchResultItem } from './search.service.js';
import { sourceService } from './source.service.js';

export class EvidenceService {
  /**
   * Normalizes search items into structured evidence models with source credibility weighting
   */
  async collectEvidence(searchResults: SearchResultItem[], claims: IClaim[]): Promise<IEvidence[]> {
    const evidenceList: IEvidence[] = [];

    for (const item of searchResults) {
      const source = await sourceService.getSourceByDomain(item.domain);
      const claimMatch = this.findClosestClaim(item.snippet + ' ' + item.title, claims);

      const type = this.classifyEvidence(item.title + ' ' + item.snippet, claimMatch?.text || '');

      evidenceList.push({
        title: item.title,
        description: item.snippet,
        url: item.url,
        type,
        supportsClaim: type === 'SUPPORTING',
        credibility: source.credibilityScore,
        publishedAt: item.publishedDate || new Date().toISOString(),
        sourceId: source.domain,
        sourceName: source.name,
      });
    }

    return evidenceList;
  }

  /**
   * Classifies whether evidence snippet supports, contradicts, or provides context for a claim
   */
  classifyEvidence(evidenceText: string, claimText: string): EvidenceType {
    const text = evidenceText.toLowerCase();

    // Contradicting keywords
    if (
      text.includes('debunk') ||
      text.includes('false') ||
      text.includes('hoax') ||
      text.includes('fabricated') ||
      text.includes('refut') ||
      text.includes('deny') ||
      text.includes('denies') ||
      text.includes('unsubstantiated') ||
      text.includes('misleading') ||
      text.includes('no evidence')
    ) {
      return 'CONTRADICTING';
    }

    // Supporting keywords
    if (
      text.includes('confirm') ||
      text.includes('verif') ||
      text.includes('official release') ||
      text.includes('statutory notice') ||
      text.includes('authenticat') ||
      text.includes('corroborat') ||
      text.includes('true')
    ) {
      return 'SUPPORTING';
    }

    return 'CONTEXT';
  }

  /**
   * Associates an evidence item to specific claim
   */
  linkEvidenceToClaim(evidence: IEvidence[], claim: IClaim): IEvidence[] {
    return evidence.filter((e) => {
      const combined = (e.title + ' ' + e.description).toLowerCase();
      const claimKeywords = claim.text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);

      return claimKeywords.some((keyword) => combined.includes(keyword));
    });
  }

  private findClosestClaim(text: string, claims: IClaim[]): IClaim | null {
    if (claims.length === 0) return null;
    const lower = text.toLowerCase();

    let bestClaim = claims[0];
    let maxMatches = 0;

    for (const claim of claims) {
      const words = claim.text.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const matches = words.filter((w) => lower.includes(w)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestClaim = claim;
      }
    }

    return bestClaim;
  }
}

export const evidenceService = new EvidenceService();
