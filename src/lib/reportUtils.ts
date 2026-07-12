import type { GeminiResponse } from '@/schemas/geminiResponse';
import type { AuditReport, Finding } from '@/schemas/auditReport';
import { LIMITATIONS_NOTE } from '@/schemas/auditReport';

/**
 * Enriches the raw Gemini JSON response by assigning deterministic IDs
 * and priority values, and computing count metrics.
 */
export function enrichFindings(raw: GeminiResponse): AuditReport {
  const findings: Finding[] = raw.findings.map((f, index) => ({
    ...f,
    id: `finding-${index + 1}`, // deterministic stable ID
    priority: index + 1,        // priority corresponds to the order in the array
  }));

  const summary = {
    total: findings.length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
  };

  return { summary, findings };
}

/**
 * Formats an AuditReport into a clean, markdown document suitable for copy-pasting.
 */
export function formatAsMarkdown(report: AuditReport): string {
  const summaryLine = `${report.summary.total} findings: ${report.summary.high} high, ${report.summary.medium} medium, ${report.summary.low} low`;
  
  const findingsMarkdown = report.findings.map((f) => {
    // Capitalize category name for presentation
    const categoryName = f.category.charAt(0).toUpperCase() + f.category.slice(1);
    const severityName = f.severity.charAt(0).toUpperCase() + f.severity.slice(1);
    const confidenceName = f.confidence.charAt(0).toUpperCase() + f.confidence.slice(1);

    return `### ${f.priority}. [${categoryName}] — ${f.element}
**Severity:** ${severityName} | **Confidence:** ${confidenceName}

**Issue:** ${f.issue}

**Why it matters:** ${f.impact}

**Recommendation:** ${f.recommendation}

---`;
  }).join('\n\n');

  return `# ScreenSage Audit Report

## Summary
${summaryLine}

## Findings

${findingsMarkdown || '_No clear issues were identified in this AI-assisted pass._'}

> ⚠️ **Disclaimer:** ${LIMITATIONS_NOTE}`;
}
