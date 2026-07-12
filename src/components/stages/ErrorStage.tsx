'use client';

import React from 'react';
import { Button } from '../ui/Button';

type ErrorStageProps = {
  message: string;
  previewUrl: string;
  onRetry: () => void;
  onStartNew: () => void;
};

export function ErrorStage({ message, previewUrl, onRetry, onStartNew }: ErrorStageProps) {
  return (
    <div className="space-y-6">
      {/* Error Card Header */}
      <div>
        <h2 className="text-base font-semibold text-red-400 flex items-center gap-2">
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Audit Failed
        </h2>
        <p className="text-xs text-zinc-500 mt-1">An issue occurred during the visual review</p>
      </div>

      {/* Uploaded Thumbnail and Error Display */}
      <div className="border border-zinc-800 bg-zinc-950/40 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative h-16 w-24 bg-zinc-950 rounded border border-zinc-900 overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Uploaded screenshot thumbnail"
            className="max-h-full max-w-full object-contain rounded opacity-60"
          />
        </div>
        <div className="text-center sm:text-left min-w-0">
          <p className="text-sm font-medium text-zinc-200" role="alert">
            {message}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            You can retry the audit with the same image or start a new upload.
          </p>
        </div>
      </div>

      {/* Actions container - full width on mobile, aligned on desktop */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button
          type="button"
          onClick={onRetry}
          className="w-full sm:flex-1 py-2.5 text-sm font-semibold"
        >
          Retry Audit
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onStartNew}
          className="w-full sm:flex-1 py-2.5 text-sm font-semibold"
        >
          Start New Audit
        </Button>
      </div>
    </div>
  );
}
