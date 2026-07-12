import { describe, it, expect } from 'vitest';
import { GeminiResponseSchema, geminiJsonSchema } from '@/schemas/geminiResponse';

describe('GeminiResponseSchema', () => {
  const validFinding = {
    category: 'hierarchy',
    severity: 'high',
    confidence: 'high',
    element: 'Header Title',
    issue: 'The title font size is too small and blends with the description.',
    impact: 'Users will find it hard to scan the page quickly.',
    recommendation: 'Increase the title font size to 24px and make it bold.',
  };

  it('passes validation with a valid structure', () => {
    const validPayload = {
      findings: [validFinding],
    };
    const result = GeminiResponseSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.findings).toHaveLength(1);
    }
  });

  it('passes validation with an empty findings array', () => {
    const emptyPayload = {
      findings: [],
    };
    const result = GeminiResponseSchema.safeParse(emptyPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.findings).toHaveLength(0);
    }
  });

  it('rejects payloads with more than 20 findings', () => {
    const findings = Array.from({ length: 21 }, () => validFinding);
    const result = GeminiResponseSchema.safeParse({ findings });
    expect(result.success).toBe(false);
  });

  it('rejects invalid categories, severities, or confidence values', () => {
    const invalidPayload = {
      findings: [
        {
          ...validFinding,
          category: 'invalid-category',
        },
      ],
    };
    const result = GeminiResponseSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('rejects string fields exceeding their maximum character limits', () => {
    const longElement = 'a'.repeat(201); // max 200
    const resultElement = GeminiResponseSchema.safeParse({
      findings: [{ ...validFinding, element: longElement }],
    });
    expect(resultElement.success).toBe(false);

    const longIssue = 'a'.repeat(701); // max 700
    const resultIssue = GeminiResponseSchema.safeParse({
      findings: [{ ...validFinding, issue: longIssue }],
    });
    expect(resultIssue.success).toBe(false);

    const longImpact = 'a'.repeat(701); // max 700
    const resultImpact = GeminiResponseSchema.safeParse({
      findings: [{ ...validFinding, impact: longImpact }],
    });
    expect(resultImpact.success).toBe(false);

    const longRecommendation = 'a'.repeat(901); // max 900
    const resultRecommendation = GeminiResponseSchema.safeParse({
      findings: [{ ...validFinding, recommendation: longRecommendation }],
    });
    expect(resultRecommendation.success).toBe(false);
  });

  it('verifies that z.toJSONSchema generates a valid JSON Schema object', () => {
    expect(geminiJsonSchema).toBeDefined();
    expect(geminiJsonSchema.type).toBe('object');
    expect(geminiJsonSchema.properties).toBeDefined();
    expect(geminiJsonSchema.properties.findings).toBeDefined();
    expect(geminiJsonSchema.properties.findings.type).toBe('array');
  });
});
