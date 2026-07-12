import { z } from 'zod';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB — Vercel multipart safe margin

export const AuditRequestSchema = z.object({
  // Browser-declared MIME type: treated as a first-pass hint only.
  // The real format is verified server-side by decoding with Sharp.
  mimeType: z.string().refine((t) => ACCEPTED_TYPES.includes(t), {
    message: 'File must be PNG, JPG, or WebP.',
  }),
  fileSizeBytes: z.number().max(MAX_FILE_SIZE_BYTES, {
    message: 'File must be 4 MB or smaller.',
  }),
  context: z.string().max(300).optional(),
});
