import { z } from 'zod';

export const CategoryEnum = z.enum([
  'hierarchy',
  'spacing',
  'typography',
  'contrast',
  'consistency',
  'usability',
  'accessibility',
]);

export const SeverityEnum = z.enum(['high', 'medium', 'low']);
export const ConfidenceEnum = z.enum(['high', 'medium', 'low']);

// Schema for one raw finding returned by Gemini (no id or priority — assigned server-side)
export const GeminiFindingSchema = z.object({
  category: CategoryEnum,
  severity: SeverityEnum,
  confidence: ConfidenceEnum,
  element: z.string().min(1).max(200),
  issue: z.string().min(1).max(700),
  impact: z.string().min(1).max(700),
  recommendation: z.string().min(1).max(900),
});

// Schema for the complete Gemini response
export const GeminiResponseSchema = z.object({
  findings: z.array(GeminiFindingSchema).max(20),
});

export type GeminiFinding = z.infer<typeof GeminiFindingSchema>;
export type GeminiResponse = z.infer<typeof GeminiResponseSchema>;

// JSON Schema for Gemini's response_format parameter — Zod 4 native conversion
// Explicitly cast to Record<string, any> so it matches the type expected by the SDK
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const geminiJsonSchema = z.toJSONSchema(GeminiResponseSchema) as Record<string, any>;
