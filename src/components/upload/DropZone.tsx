'use client';

import React, { useState } from 'react';
import { validateImageFile } from '@/lib/imageUtils';

type DropZoneProps = {
  onClick: () => void;
  onFileSelected: (file: File) => void;
  onError: (message: string | null) => void;
};

export function DropZone({ onClick, onFileSelected, onError }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const processFile = (file: File | undefined) => {
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }

    onError(null);
    onFileSelected(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Upload interface screenshot. Drag and drop file here, or press enter to browse."
      className={`border border-dashed rounded-lg p-10 min-h-[220px] flex flex-col items-center justify-center text-center transition-all cursor-pointer focus-ring
        ${
          isDragActive
            ? 'border-blue-500 bg-blue-950/20'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60'
        }
      `}
    >
      {/* Upload Icon */}
      <div className={`p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4 transition-colors ${
        isDragActive ? 'border-blue-500 text-blue-400' : 'text-zinc-400'
      }`}>
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0017.25 4.5H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      
      <p className="text-sm font-medium text-zinc-200">
        {isDragActive ? 'Drop screenshot here' : 'Drag and drop your screenshot, or click to browse'}
      </p>
      <p className="text-xs text-zinc-500 mt-2">
        Supports PNG, JPG, WebP (max 4MB)
      </p>
    </div>
  );
}
