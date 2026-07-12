'use client';

import React, { useState } from 'react';
import type { AuditReport } from '@/schemas/auditReport';
import { SummaryBanner } from '../report/SummaryBanner';
import { FindingCard } from '../report/FindingCard';
import { CategoryFilter } from '../report/CategoryFilter';
import { LimitationsNote } from '../report/LimitationsNote';
import { Button } from '../ui/Button';
import { formatAsMarkdown } from '@/lib/reportUtils';

type ReportStageProps = {
  previewUrl: string;
  context: string;
  result: AuditReport;
  onStartNew: () => void;
};

type ActionButtonsProps = {
  copied: boolean;
  onCopyMarkdown: () => void;
  onStartNew: () => void;
  className?: string;
};

function ActionButtons({ copied, onCopyMarkdown, onStartNew, className = '' }: ActionButtonsProps) {
  return (
    <div className={`flex flex-col sm:flex-row lg:flex-col gap-2 ${className}`}>
      <Button
        type="button"
        onClick={onCopyMarkdown}
        className="w-full py-2.5 text-sm font-semibold"
      >
        {copied ? 'Copied Markdown!' : 'Copy Report as Markdown'}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={onStartNew}
        className="w-full py-2.5 text-sm font-semibold"
      >
        Start New Audit
      </Button>
    </div>
  );
}

export function ReportStage({ previewUrl, context, result, onStartNew }: ReportStageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter findings based on category
  const filteredFindings = selectedCategory
    ? result.findings.filter((f) => f.category === selectedCategory)
    : result.findings;

  const handleCopyMarkdown = async () => {
    try {
      const markdown = formatAsMarkdown(result);
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy report markdown:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      
      {/* Left Column: Screenshot & Audit Info */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
        {/* 1. Uploaded screenshot and context */}
        <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl p-4 space-y-4">
          <div className="relative w-full max-h-[300px] bg-zinc-950 rounded border border-zinc-900 overflow-hidden flex items-center justify-center p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Audited screen screenshot"
              className="max-h-[280px] max-w-full object-contain rounded"
            />
          </div>
          {context && (
            <div className="bg-zinc-950/40 rounded p-3 border border-zinc-900/40">
              <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                Context provided
              </span>
              <p className="text-xs text-zinc-300 italic">
                &ldquo;{context}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* 2. Audit summary counts */}
        <SummaryBanner summary={result.summary} />

        {/* Desktop-only: 5. Limitations note & 6. Actions */}
        <div className="hidden lg:block space-y-6">
          <LimitationsNote />
          <ActionButtons
            copied={copied}
            onCopyMarkdown={handleCopyMarkdown}
            onStartNew={onStartNew}
          />
        </div>
      </div>

      {/* Right Column: Prioritized Findings List */}
      <div className="lg:col-span-7 space-y-6">
        {/* 3. Category Filters */}
        {result.findings.length > 0 && (
          <div className="bg-zinc-900/10 border border-zinc-900/40 rounded-xl p-4">
            <CategoryFilter
              findings={result.findings}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        )}

        {/* 4. Prioritized findings container */}
        <div className="space-y-4" role="region" aria-label="Prioritized audit findings">
          {filteredFindings.length > 0 ? (
            filteredFindings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))
          ) : (
            <div className="border border-zinc-800 bg-zinc-900/10 rounded-lg p-8 text-center text-zinc-500 text-sm">
              No findings in this category.
            </div>
          )}
        </div>

        {/* Mobile-only: 5. Limitations note & 6. Actions */}
        <div className="block lg:hidden space-y-6 pt-4 border-t border-zinc-900/80">
          <LimitationsNote />
          <ActionButtons
            copied={copied}
            onCopyMarkdown={handleCopyMarkdown}
            onStartNew={onStartNew}
          />
        </div>
      </div>

    </div>
  );
}
