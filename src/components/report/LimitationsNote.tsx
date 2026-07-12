import React from 'react';
import { LIMITATIONS_NOTE } from '@/schemas/auditReport';

export function LimitationsNote() {
  return (
    <div className="bg-zinc-900/10 border border-zinc-900/40 rounded-lg p-4 text-xs text-zinc-500 space-y-1 leading-relaxed">
      <p className="font-semibold text-zinc-400">
        Disclaimer and Limitations
      </p>
      <p>
        {LIMITATIONS_NOTE}
      </p>
    </div>
  );
}
