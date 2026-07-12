import React from 'react';
import type { Finding } from '@/schemas/auditReport';

type CategoryFilterProps = {
  findings: Finding[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
};

export function CategoryFilter({
  findings,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  // 1. Calculate active categories present in the report and their counts
  const categoryCounts = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {});

  const presentCategories = Object.keys(categoryCounts).sort();

  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide">
        Filter by Category
      </span>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter findings by category">
        {/* "All" filter option */}
        <button
          role="tab"
          type="button"
          tabIndex={0}
          aria-selected={selectedCategory === null}
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md focus-ring transition-all cursor-pointer border
            ${
              selectedCategory === null
                ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                : 'bg-zinc-900/30 text-zinc-400 border-zinc-900 hover:border-zinc-800 hover:text-zinc-200'
            }
          `}
        >
          All ({findings.length})
        </button>

        {/* Categories present in report */}
        {presentCategories.map((cat) => {
          const isActive = selectedCategory === cat;
          const displayLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
          const count = categoryCounts[cat];

          return (
            <button
              key={cat}
              role="tab"
              type="button"
              tabIndex={0}
              aria-selected={isActive}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md focus-ring transition-all cursor-pointer border
                ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                    : 'bg-zinc-900/30 text-zinc-400 border-zinc-900 hover:border-zinc-800 hover:text-zinc-200'
                }
              `}
            >
              {displayLabel} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
