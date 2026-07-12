import 'server-only';
import type { GeminiResponse, GeminiFinding } from '@/schemas/geminiResponse';

// Regular expressions to detect unsupported precision
export const DETECTION_PATTERNS = {
  hexColor: /#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/,
  rgbHsl: /\b(rgb|rgba|hsl|hsla)\s*\(/i,
  contrastRatio: /\b\d+(?:\.\d+)?\s*:\s*\d+\b/,
  pixelMeasure: /\b\d+px\b/i,
  pixelWords: /\b\d+\s*pixels?\b/i,
  dimensions: /\b\d+\s*[x*]\s*\d+\b/i,
  wcagCompliance: /\b(wcag|compliance|compliant|non-compliant|aa|aaa)\b/i,
};

/**
 * Checks if a string contains any unsupported visual precision.
 */
export function hasUnsupportedPrecision(text: string): boolean {
  return Object.values(DETECTION_PATTERNS).some((regex) => regex.test(text));
}

/**
 * Checks if a GeminiResponse contains any unsupported visual precision.
 */
export function hasReportUnsupportedPrecision(report: GeminiResponse): boolean {
  return report.findings.some((finding) => {
    return (
      hasUnsupportedPrecision(finding.issue) ||
      hasUnsupportedPrecision(finding.impact) ||
      hasUnsupportedPrecision(finding.recommendation)
    );
  });
}

/**
 * Deterministically sanitizes unsupported precision patterns from a string.
 * Used as a fallback if the AI repair request fails.
 */
export function sanitizeText(text: string): string {
  let cleaned = text;

  // 1. Replace hex colors
  cleaned = cleaned.replace(
    new RegExp(DETECTION_PATTERNS.hexColor.source, 'g'),
    'the color token'
  );

  // 2. Replace rgb/rgba/hsl/hsla functions
  cleaned = cleaned.replace(
    /\b(rgb|rgba|hsl|hsla)\s*\([^\)]*\)/gi,
    'the color value'
  );

  // 3. Replace contrast ratios (e.g. 4.5:1)
  cleaned = cleaned.replace(
    new RegExp(DETECTION_PATTERNS.contrastRatio.source, 'g'),
    'the contrast ratio'
  );

  // 4. Replace pixel values (e.g. 24px)
  cleaned = cleaned.replace(
    new RegExp(DETECTION_PATTERNS.pixelMeasure.source, 'g'),
    'a relative size'
  );

  // 5. Replace pixel word values (e.g. 24 pixels)
  cleaned = cleaned.replace(
    new RegExp(DETECTION_PATTERNS.pixelWords.source, 'gi'),
    'a relative size'
  );

  // 6. Replace dimension patterns (e.g. 44x44)
  cleaned = cleaned.replace(
    new RegExp(DETECTION_PATTERNS.dimensions.source, 'g'),
    'relative dimensions'
  );

  // 7. Replace WCAG compliance claims
  // Specifically target wcag/aa/aaa/compliance/non-compliant but keep readable context
  cleaned = cleaned.replace(
    /\b(wcag|non-compliant|compliant|compliance|aa|aaa)\b/gi,
    'standard guidelines'
  );

  return cleaned;
}

/**
 * Sanitizes all findings inside a GeminiResponse deterministically.
 */
export function deterministicSanitize(report: GeminiResponse): GeminiResponse {
  const sanitizedFindings: GeminiFinding[] = report.findings.map((f) => ({
    ...f,
    issue: sanitizeText(f.issue),
    impact: sanitizeText(f.impact),
    recommendation: sanitizeText(f.recommendation),
  }));

  return { findings: sanitizedFindings };
}
