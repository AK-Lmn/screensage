/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { enrichFindings, formatAsMarkdown } from '@/lib/reportUtils';
import type { GeminiResponse } from '@/schemas/geminiResponse';
import { LIMITATIONS_NOTE } from '@/schemas/auditReport';

describe('Report Utilities', () => {
  const mockGeminiResponse: GeminiResponse = {
    findings: [
      {
        category: 'typography',
        severity: 'medium',
        confidence: 'high',
        element: 'Heading title text',
        issue: 'Text font is small.',
        impact: 'Low readability.',
        recommendation: 'Increase size to 24px.',
      },
      {
        category: 'spacing',
        severity: 'high',
        confidence: 'medium',
        element: 'Main container margins',
        issue: 'Layout alignment is misaligned.',
        impact: 'Uneven spacing structure.',
        recommendation: 'Add margin-left 16px.',
      },
    ],
  };

  it('enrichFindings correctly sets sequential priorities, stable IDs, and summaries', () => {
    const report = enrichFindings(mockGeminiResponse);

    expect(report.summary).toEqual({
      total: 2,
      high: 1,
      medium: 1,
      low: 0,
    });

    expect(report.findings).toHaveLength(2);
    expect(report.findings[0].id).toBe('finding-1');
    expect(report.findings[0].priority).toBe(1);
    expect(report.findings[1].id).toBe('finding-2');
    expect(report.findings[1].priority).toBe(2);
  });

  it('formatAsMarkdown outputs correct structures and includes limitations note', () => {
    const report = enrichFindings(mockGeminiResponse);
    const markdown = formatAsMarkdown(report);

    expect(markdown).toContain('# ScreenSage Audit Report');
    expect(markdown).toContain('2 findings: 1 high, 1 medium, 0 low');
    expect(markdown).toContain('### 1. [Typography] — Heading title text');
    expect(markdown).toContain('**Severity:** Medium | **Confidence:** High');
    expect(markdown).toContain('**Recommendation:** Increase size to 24px.');
    expect(markdown).toContain('### 2. [Spacing] — Main container margins');
    expect(markdown).toContain(LIMITATIONS_NOTE);
  });
});
