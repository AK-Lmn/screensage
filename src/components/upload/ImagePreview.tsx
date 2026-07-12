'use client';

import React from 'react';
import { Button } from '../ui/Button';

type ImagePreviewProps = {
  previewUrl: string;
  filename: string;
  sizeBytes: number;
  onReplace: () => void;
  onRemove: () => void;
};

export function ImagePreview({ previewUrl, filename, sizeBytes, onReplace, onRemove }: ImagePreviewProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="border border-zinc-800 bg-zinc-900/30 rounded-lg p-5 space-y-4">
      {/* Larger screenshot preview */}
      <div className="relative w-full max-h-[320px] bg-zinc-950 rounded border border-zinc-800/80 overflow-hidden flex items-center justify-center p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Uploaded screenshot preview"
          className="max-h-[300px] max-w-full object-contain rounded"
        />
      </div>

      {/* Meta details and Actions row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-200 truncate" title={filename}>
            {filename}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {formatBytes(sizeBytes)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Replace Button */}
          <Button
            type="button"
            variant="secondary"
            onClick={onReplace}
            aria-label={`Replace selected file ${filename}`}
            className="text-xs px-3.5 py-1.5"
          >
            Replace
          </Button>

          {/* Remove Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={onRemove}
            aria-label={`Remove selected file ${filename}`}
            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/10 px-3.5 py-1.5"
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
