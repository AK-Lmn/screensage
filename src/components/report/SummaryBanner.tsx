import React from 'react';
import type { Summary } from '@/schemas/auditReport';

type SummaryBannerProps = {
  summary: Summary;
};

export function SummaryBanner({ summary }: SummaryBannerProps) {
  if (summary.total === 0) {
    return (
      <div className="border border-zinc-800 bg-zinc-900/10 rounded-lg p-5 text-center">
        <p className="text-sm font-semibold text-zinc-300">
          No clear issues were identified in this AI-assisted pass.
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Review other details or provide additional page context if needed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-900/10 border border-zinc-900/65 rounded-lg p-4">
      {/* Total findings */}
      <div className="text-center p-2 rounded bg-zinc-950/20 border border-zinc-900/30">
        <span className="block text-2xl font-bold text-zinc-100">{summary.total}</span>
        <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Total Issues</span>
      </div>

      {/* High severity */}
      <div className="text-center p-2 rounded bg-red-950/5 border border-red-900/10">
        <span className="block text-2xl font-bold text-red-400">{summary.high}</span>
        <span className="text-[10px] uppercase font-semibold text-red-500 tracking-wider">High Severity</span>
      </div>

      {/* Medium severity */}
      <div className="text-center p-2 rounded bg-amber-950/5 border border-amber-900/10">
        <span className="block text-2xl font-bold text-amber-400">{summary.medium}</span>
        <span className="text-[10px] uppercase font-semibold text-amber-500 tracking-wider">Medium Severity</span>
      </div>

      {/* Low severity */}
      <div className="text-center p-2 rounded bg-emerald-950/5 border border-emerald-900/10">
        <span className="block text-2xl font-bold text-emerald-400">{summary.low}</span>
        <span className="text-[10px] uppercase font-semibold text-emerald-500 tracking-wider">Low Severity</span>
      </div>
    </div>
  );
}
