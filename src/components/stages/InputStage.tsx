'use client';

import React, { useState, useRef } from 'react';
import { DropZone } from '../upload/DropZone';
import { ImagePreview } from '../upload/ImagePreview';
import { Button } from '../ui/Button';
import { validateImageFile } from '@/lib/imageUtils';

type InputStageProps = {
  file: File | null;
  previewUrl: string | null;
  context: string;
  onFileSelected: (file: File) => void;
  onFileRemoved: () => void;
  onContextChanged: (context: string) => void;
  onSubmit: () => void;
};

export function InputStage({
  file,
  previewUrl,
  context,
  onFileSelected,
  onFileRemoved,
  onContextChanged,
  onSubmit,
}: InputStageProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const error = validateImageFile(selectedFile);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    onFileSelected(selectedFile);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Hidden File Input for lifted triggering */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="space-y-4">
        {/* Workspace Card Header */}
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Audit a screen</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Upload a screenshot to begin the visual review</p>
        </div>

        {/* File upload zone or preview */}
        {file && previewUrl ? (
          <ImagePreview
            previewUrl={previewUrl}
            filename={file.name}
            sizeBytes={file.size}
            onReplace={triggerFileInput}
            onRemove={onFileRemoved}
          />
        ) : (
          <DropZone
            onClick={triggerFileInput}
            onFileSelected={onFileSelected}
            onError={setValidationError}
          />
        )}

        {/* Validation Errors container */}
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[1.25rem] text-xs font-medium text-red-400"
        >
          {validationError && (
            <span className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5"
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
              {validationError}
            </span>
          )}
        </div>
      </div>

      {/* Optional Context Field */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <label htmlFor="context-textarea" className="block text-sm font-medium text-zinc-300">
            What is this screen? <span className="text-xs text-zinc-500 font-normal ml-0.5">(Optional)</span>
          </label>
          <span
            id="char-counter"
            aria-live="polite"
            className={`text-xs ${
              context.length >= 280 ? 'text-blue-400 font-medium' : 'text-zinc-500'
            }`}
          >
            {context.length} / 300
          </span>
        </div>

        <textarea
          id="context-textarea"
          value={context}
          maxLength={300}
          onChange={(e) => onContextChanged(e.target.value)}
          placeholder="e.g. A sign-up landing page for indie developers. Focus states and color contrast need attention."
          rows={4}
          aria-describedby="context-helper char-counter"
          className="w-full rounded-md border border-zinc-800 bg-zinc-900/20 px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus-ring focus:bg-zinc-900/50"
        />
        <p id="context-helper" className="text-xs text-zinc-500">
          Providing high-level context or specifying details you want reviewed improves audit specificity.
        </p>
      </div>

      {/* Action Button - full-width inside the card */}
      <div>
        <Button
          type="submit"
          disabled={!file}
          className="w-full py-2.5 text-sm font-semibold tracking-wide"
        >
          Run UI Audit
        </Button>
      </div>
    </form>
  );
}
