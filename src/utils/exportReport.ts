import { VerificationResult } from '../types';

/**
 * Exports the full verification result object as a formatted, human-readable JSON file.
 */
export function downloadReportAsJson(result: VerificationResult): void {
  const exportPayload = {
    platform: 'VerifAI GH - AI-Assisted Evidence & Fact Verification',
    reportId: result.id,
    generatedAt: new Date().toISOString(),
    verifiedDate: result.createdAt,
    verdict: {
      classification: result.classification,
      credibilityScore: result.score,
      confidencePercentage: result.confidence,
      summary: result.summary,
      recommendation: result.recommendation,
    },
    submission: {
      contentType: result.contentType,
      inputContent: result.inputContent,
      inputUrl: result.inputUrl || null,
      inputImageName: result.inputImageName || null,
    },
    extractedClaims: result.claims || [],
    evidenceAssessment: {
      availability: result.evidence?.availability || 'NONE',
      description: result.evidence?.description || '',
      supportingEvidence: result.evidence?.supportingEvidence || [],
      counterEvidence: result.evidence?.counterEvidence || [],
    },
    keyIndicators: result.indicators || [],
    contentCharacteristics: result.contentCharacteristics || null,
    verificationSources: result.verificationSources || [],
    referencedTrustedSources: result.referencedTrustedSources || [],
    sourceTrace: result.sourceTrace || null,
    humanReview: result.humanReview || null,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedId = result.id.slice(-8).toUpperCase();
  link.href = url;
  link.download = `verifai-gh-report-${sanitizedId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Prepares and triggers browser print-to-PDF for the current verification dossier.
 */
export function downloadReportAsPdf(): void {
  window.print();
}
