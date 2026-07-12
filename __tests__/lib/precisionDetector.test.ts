/**
 * @vitest-environment node
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock server-only to prevent it throwing when loaded in a Vitest test runner context
vi.mock('server-only', () => ({}));

// Create a mock interactions.create function that can be updated dynamically per test
const mockCreate = vi.fn();

vi.mock('@google/genai', () => {
  return {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    GoogleGenAI: vi.fn().mockImplementation(function (this: any) {
      this.interactions = {
        create: mockCreate,
      };
    }),
  };
});

import {
  hasUnsupportedPrecision,
  hasReportUnsupportedPrecision,
  sanitizeText,
  deterministicSanitize,
} from '@/lib/precisionDetector.server';
import { runAudit } from '@/lib/gemini';
import type { GeminiResponse, GeminiFinding } from '@/schemas/geminiResponse';

describe('Precision Detector', () => {
  it('detects exact hex colors', () => {
    expect(hasUnsupportedPrecision('Change the text to #CBD5E1.')).toBe(true);
    expect(hasUnsupportedPrecision('Ensure color is #FFF.')).toBe(true);
    expect(hasUnsupportedPrecision('This is a plain sentence.')).toBe(false);
    expect(hasUnsupportedPrecision('Reference finding #1.')).toBe(false);
  });

  it('detects rgb and hsl color functions', () => {
    expect(hasUnsupportedPrecision('Use rgb(12, 34, 56) for backgrounds.')).toBe(true);
    expect(hasUnsupportedPrecision('Use hsl(220, 10%, 40%) borders.')).toBe(true);
    expect(hasUnsupportedPrecision('Plain copy about light contrast.')).toBe(false);
  });

  it('detects contrast ratio patterns', () => {
    expect(hasUnsupportedPrecision('Contrast is 4.5:1.')).toBe(true);
    expect(hasUnsupportedPrecision('The ratio is 7:1.')).toBe(true);
    expect(hasUnsupportedPrecision('Ensure 4.5 ratios.')).toBe(false);
  });

  it('detects pixel measurements and dimension patterns', () => {
    expect(hasUnsupportedPrecision('Font should be 16px.')).toBe(true);
    expect(hasUnsupportedPrecision('Spacing must be 24 pixels.')).toBe(true);
    expect(hasUnsupportedPrecision('Make button 44x44.')).toBe(true);
    expect(hasUnsupportedPrecision('Dimensions 44 * 44.')).toBe(true);
    expect(hasUnsupportedPrecision('Increase font size relatively.')).toBe(false);
  });

  it('detects WCAG compliance claims', () => {
    expect(hasUnsupportedPrecision('Fails WCAG AA standards.')).toBe(true);
    expect(hasUnsupportedPrecision('Ensure AAA compliance.')).toBe(true);
    expect(hasUnsupportedPrecision('Visual elements are compliant.')).toBe(true);
    expect(hasUnsupportedPrecision('This is a non-compliant container.')).toBe(true);
    expect(hasUnsupportedPrecision('Check relative guidelines.')).toBe(false);
  });

  it('checks entire report object structures correctly', () => {
    const safeReport: GeminiResponse = {
      findings: [
        {
          category: 'typography',
          severity: 'low',
          confidence: 'high',
          element: 'Label',
          issue: 'Safe issue text.',
          impact: 'Safe impact description.',
          recommendation: 'Safe relative recommendation.',
        },
      ],
    };
    
    const unsafeReport: GeminiResponse = {
      findings: [
        {
          category: 'typography',
          severity: 'low',
          confidence: 'high',
          element: 'Label',
          issue: 'Safe issue text.',
          impact: 'Safe impact description.',
          recommendation: 'Use color #FFF.',
        },
      ],
    };

    expect(hasReportUnsupportedPrecision(safeReport)).toBe(false);
    expect(hasReportUnsupportedPrecision(unsafeReport)).toBe(true);
  });

  it('sanitizes unsafe precision texts correctly', () => {
    expect(sanitizeText('Change to #CBD5E1.')).toBe('Change to the color token.');
    expect(sanitizeText('Use rgb(0,0,0) fill.')).toBe('Use the color value fill.');
    expect(sanitizeText('Contrast is 4.5:1.')).toBe('Contrast is the contrast ratio.');
    expect(sanitizeText('Make font 16px.')).toBe('Make font a relative size.');
    expect(sanitizeText('Border 24 pixels wide.')).toBe('Border a relative size wide.');
    expect(sanitizeText('Size 44x44 target.')).toBe('Size relative dimensions target.');
    expect(sanitizeText('Ensure WCAG AA compliance.')).toBe('Ensure standard guidelines standard guidelines standard guidelines.');
  });
});

describe('runAudit Epistemic Safety Flow', () => {
  const dummyBuffer = Buffer.from('image-data');
  const dummyMime = 'image/png';

  const safeFinding: GeminiFinding = {
    category: 'typography',
    severity: 'medium',
    confidence: 'high',
    element: 'Header Label',
    issue: 'The font weight is thin.',
    impact: 'Low scanning contrast.',
    recommendation: 'Increase font weight and check details.',
  };

  const unsafeFinding: GeminiFinding = {
    category: 'contrast',
    severity: 'high',
    confidence: 'high',
    element: 'Button Background',
    issue: 'Color #000000 has 4.5:1 ratio.',
    impact: 'Fails WCAG compliance.',
    recommendation: 'Make background exactly 44px wide and change to #FFFFFF.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('does NOT trigger a repair call if original audit findings are safe', async () => {
    const mockSafeReport: GeminiResponse = {
      findings: [safeFinding],
    };

    mockCreate.mockResolvedValueOnce({
      output_text: JSON.stringify(mockSafeReport),
    });

    const report = await runAudit(dummyBuffer, dummyMime);
    
    // Should return original report directly
    expect(report).toEqual(mockSafeReport);
    // interactions.create called exactly once (for the visual review)
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('triggers exactly one text-only repair call if findings contain unsafe precision', async () => {
    const mockUnsafeReport: GeminiResponse = {
      findings: [unsafeFinding],
    };

    const mockRepairedReport: GeminiResponse = {
      findings: [
        {
          ...unsafeFinding,
          issue: 'Color is low contrast.',
          impact: 'May not meet standard guidelines.',
          recommendation: 'Increase visible dimensions and use a lighter token.',
        },
      ],
    };

    // First call (visual audit) returns unsafe findings
    mockCreate.mockResolvedValueOnce({
      output_text: JSON.stringify(mockUnsafeReport),
    });
    // Second call (repair) returns repaired findings
    mockCreate.mockResolvedValueOnce({
      output_text: JSON.stringify(mockRepairedReport),
    });

    const report = await runAudit(dummyBuffer, dummyMime);

    // Verify repaired findings are returned
    expect(report).toEqual(mockRepairedReport);
    // Verify interactions.create was called exactly twice (1 audit, 1 repair)
    expect(mockCreate).toHaveBeenCalledTimes(2);

    // Check that repair call didn't receive image buffer (it's text-only)
    const repairArgs = mockCreate.mock.calls[1][0];
    expect(repairArgs.input).toHaveLength(1);
    expect(repairArgs.input[0].type).toBe('text');
    expect(repairArgs.input[0].text).toContain('Please repair these findings');
  });

  it('falls back to deterministic sanitation if repair call fails or returns invalid schema', async () => {
    const mockUnsafeReport: GeminiResponse = {
      findings: [unsafeFinding],
    };

    // First call (visual audit) returns unsafe findings
    mockCreate.mockResolvedValueOnce({
      output_text: JSON.stringify(mockUnsafeReport),
    });
    // Second call (repair) throws a provider error
    mockCreate.mockRejectedValueOnce(new Error('Rate limit or connection error during repair'));

    const report = await runAudit(dummyBuffer, dummyMime);

    // Should fallback to deterministic sanitize of original findings
    const expectedSanitized = deterministicSanitize(mockUnsafeReport);
    expect(report).toEqual(expectedSanitized);
    // Verified 2 calls were attempted (original and repair)
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
