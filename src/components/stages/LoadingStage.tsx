'use client';

import React, { useState, useEffect } from 'react';
import { Spinner } from '../ui/Spinner';

type LoadingStageProps = {
  previewUrl: string;
};

const LOADING_STATUSES = [
  'Reviewing visual hierarchy',
  'Checking spacing and alignment',
  'Analyzing typography and contrast',
  'Organizing recommendations',
];

export function LoadingStage({ previewUrl }: LoadingStageProps) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6 text-center">
      {/* Uploaded Thumbnail */}
      <div className="relative h-28 w-44 bg-zinc-950 rounded border border-zinc-900 overflow-hidden flex items-center justify-center p-1 shadow-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Uploaded screenshot thumbnail"
          className="max-h-full max-w-full object-contain rounded opacity-60"
        />
        {/* Centered Overlay Spinner */}
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40">
          <Spinner size="md" />
        </div>
      </div>

      {/* Loading Information block */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-zinc-100">Running UI Audit</h3>
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-zinc-400 min-h-[1.5rem]"
        >
          {LOADING_STATUSES[statusIndex]}...
        </p>
      </div>
    </div>
  );
}
