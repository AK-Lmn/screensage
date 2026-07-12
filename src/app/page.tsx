'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InputStage } from '@/components/stages/InputStage';
import { LoadingStage } from '@/components/stages/LoadingStage';
import { ErrorStage } from '@/components/stages/ErrorStage';
import { ReportStage } from '@/components/stages/ReportStage';
import { createPreviewUrl, revokePreviewUrl } from '@/lib/imageUtils';
import type { AuditReport } from '@/schemas/auditReport';

type InputData = {
  file: File;
  previewUrl: string;
  context: string;
};

type AppPhase =
  | { phase: 'input'; input: InputData | null }
  | { phase: 'loading'; input: InputData }
  | { phase: 'report'; input: InputData; result: AuditReport }
  | { phase: 'error'; input: InputData; message: string };

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>({ phase: 'input', input: null });
  // Local temporary context state kept while building/editing the input stage
  const [context, setContext] = useState<string>('');

  // Keep a ref of the active previewUrl to guarantee cleanup on unmount
  const activeUrlRef = useRef<string | null>(null);

  const cleanActiveUrl = () => {
    if (activeUrlRef.current) {
      revokePreviewUrl(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  };

  // Revoke object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      cleanActiveUrl();
    };
  }, []);

  const handleFileSelected = (selectedFile: File) => {
    cleanActiveUrl();
    const url = createPreviewUrl(selectedFile);
    activeUrlRef.current = url;
    
    setPhase({
      phase: 'input',
      input: {
        file: selectedFile,
        previewUrl: url,
        context,
      },
    });
  };

  const handleFileRemoved = () => {
    cleanActiveUrl();
    setPhase({ phase: 'input', input: null });
  };

  const handleContextChanged = (newContext: string) => {
    setContext(newContext);
    setPhase((prev) => {
      if (prev.phase === 'input' && prev.input) {
        return {
          ...prev,
          input: {
            ...prev.input,
            context: newContext,
          },
        };
      }
      return prev;
    });
  };

  const triggerAudit = async (inputData: InputData) => {
    setPhase({ phase: 'loading', input: inputData });

    try {
      const formData = new FormData();
      formData.append('image', inputData.file);
      
      const trimmedContext = inputData.context.trim();
      if (trimmedContext) {
        formData.append('context', trimmedContext);
      }

      const response = await fetch('/api/audit', {
        method: 'POST',
        body: formData,
      });

      const body = await response.json();

      if (response.status === 200) {
        setPhase({
          phase: 'report',
          input: inputData,
          result: body as AuditReport,
        });
      } else {
        const errorMsg = body.error || 'The audit could not be completed. Please try again.';
        setPhase({
          phase: 'error',
          input: inputData,
          message: errorMsg,
        });
      }
    } catch (err) {
      console.error('Audit network request failed:', err);
      setPhase({
        phase: 'error',
        input: inputData,
        message: 'Could not reach the audit server. Check your connection and try again.',
      });
    }
  };

  const handleStartNew = () => {
    cleanActiveUrl();
    setContext('');
    setPhase({ phase: 'input', input: null });
  };

  const handleRetry = () => {
    if (phase.phase === 'error' || phase.phase === 'report') {
      triggerAudit(phase.input);
    }
  };

  const handleFormSubmit = () => {
    if (phase.phase === 'input' && phase.input) {
      triggerAudit(phase.input);
    }
  };

  const categories = [
    'Hierarchy',
    'Spacing',
    'Typography',
    'Contrast',
    'Usability',
    'Accessibility',
  ];

  const file = phase.input?.file || null;
  const previewUrl = phase.input?.previewUrl || null;

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100 min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-50 h-16 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* SVG Abstract ScreenSage Mark */}
            <div className="flex-shrink-0 text-blue-500" aria-hidden="true">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M21 12H3" />
                <path d="M12 3v18" />
                <circle cx="12" cy="12" r="3" className="stroke-blue-400 fill-blue-950/30" />
              </svg>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-zinc-100">
                Screen<span className="text-blue-500">Sage</span>
              </span>
              <span className="text-xs text-zinc-500 font-normal">
                UI/UX audit assistant
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-12 lg:py-20 flex flex-col justify-center">
        
        {phase.phase === 'report' ? (
          /* full-width report panel */
          <ReportStage
            previewUrl={phase.input.previewUrl}
            context={phase.input.context}
            result={phase.result}
            onStartNew={handleStartNew}
          />
        ) : (
          /* landing page input/loading/error flow */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Hero Content */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
              <div className="space-y-4">
                <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
                  Screenshot-based UI review
                </span>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-zinc-50 leading-tight">
                  Find what feels off in your interface.
                </h1>
                <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
                  Upload a screen and receive a structured, AI-assisted review of hierarchy, spacing, typography, contrast, usability, and accessibility concerns.
                </p>
              </div>

              {/* Compact Category Labels */}
              <div className="space-y-2.5 pt-4">
                <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                  Review Coverage
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="border border-zinc-900 bg-zinc-900/30 text-zinc-400 text-xs px-2.5 py-1 rounded"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Audit Workspace (Forms / Loading / Errors) */}
            <div className="lg:col-span-7">
              <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl p-6 md:p-8 shadow-sm">
                {phase.phase === 'input' && (
                  <InputStage
                    file={file}
                    previewUrl={previewUrl}
                    context={context}
                    onFileSelected={handleFileSelected}
                    onFileRemoved={handleFileRemoved}
                    onContextChanged={handleContextChanged}
                    onSubmit={handleFormSubmit}
                  />
                )}

                {phase.phase === 'loading' && (
                  <LoadingStage previewUrl={phase.input.previewUrl} />
                )}

                {phase.phase === 'error' && (
                  <ErrorStage
                    message={phase.message}
                    previewUrl={phase.input.previewUrl}
                    onRetry={handleRetry}
                    onStartNew={handleStartNew}
                  />
                )}
              </div>
            </div>

          </div>
        )}

        {/* Muted Limitations note at the very bottom of the page */}
        <footer className="mt-16 lg:mt-24 border-t border-zinc-900/80 pt-6">
          <p className="text-center text-xs text-zinc-500">
            AI-assisted screenshot review. Not a certified accessibility or usability audit.
          </p>
        </footer>
      </div>
    </div>
  );
}
