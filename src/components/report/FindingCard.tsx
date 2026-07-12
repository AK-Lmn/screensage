import React from 'react';
import type { Finding } from '@/schemas/auditReport';
import { Badge } from '../ui/Badge';

type FindingCardProps = {
  finding: Finding;
};

export function FindingCard({ finding }: FindingCardProps) {
  // Map category to localized visual name
  const categoryName = finding.category.charAt(0).toUpperCase() + finding.category.slice(1);
  
  // Map severity for badge color
  const severityVariant = finding.severity as 'high' | 'medium' | 'low';

  return (
    <div className="border border-zinc-900 bg-zinc-900/10 rounded-lg p-5 space-y-4">
      {/* Finding header details */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-900/60 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Priority index number */}
          <span className="flex items-center justify-center h-5 w-5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300">
            {finding.priority}
          </span>
          <h4 className="text-sm font-semibold text-zinc-100 truncate" title={finding.element}>
            {finding.element}
          </h4>
        </div>
        
        {/* Badges metadata row */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="neutral">{categoryName}</Badge>
          <Badge variant={severityVariant}>{finding.severity}</Badge>
          <Badge variant="neutral">Confidence: {finding.confidence}</Badge>
        </div>
      </div>

      {/* Main issue and impact bodies */}
      <div className="space-y-3 text-xs md:text-sm leading-relaxed">
        <div>
          <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
            Issue
          </span>
          <p className="text-zinc-300">{finding.issue}</p>
        </div>
        
        <div>
          <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
            Why it matters
          </span>
          <p className="text-zinc-400">{finding.impact}</p>
        </div>
      </div>

      {/* Actionable recommendation block - strongest visual emphasis */}
      <div className="bg-blue-950/10 border border-blue-900/20 rounded-md p-4 space-y-1">
        <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider">
          Recommendation
        </span>
        <p className="text-sm text-zinc-100 leading-relaxed font-medium">
          {finding.recommendation}
        </p>
      </div>
    </div>
  );
}
