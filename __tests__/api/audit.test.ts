/**
 * @vitest-environment node
 */
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';
import sharp from 'sharp';

// Mock server-only to prevent it throwing when loaded in a Vitest test runner context
vi.mock('server-only', () => ({}));

// Create a mock interactions.create function that can be updated dynamically per test
const mockCreate = vi.fn();

vi.mock('@google/genai', () => {
  return {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    GoogleGenAI: vi.fn().mockImplementation(function (this: any) {
      this.interactions = {
        create: mockCreate,
      };
    }),
  };
});

import { POST } from '@/app/api/audit/route';

describe('POST /api/audit API Route', () => {
  let validImageBuffer: Buffer;

  beforeAll(async () => {
    // Dynamically generate a tiny valid PNG image to pass prepareImageBuffer
    validImageBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    }).png().toBuffer();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'mock-key';
  });

  // Helper to build a Request with FormData
  const createRequest = (imageField: Buffer | Blob | undefined, contextField?: string) => {
    const formData = new FormData();
    if (imageField !== undefined) {
      // Create a Blob from the image field
      const blob = imageField instanceof Buffer 
        ? new Blob([new Uint8Array(imageField)], { type: 'image/png' }) 
        : imageField;
      formData.append('image', blob as Blob);
    }
    if (contextField !== undefined) {
      formData.append('context', contextField);
    }

    return new Request('http://localhost/api/audit', {
      method: 'POST',
      body: formData,
    });
  };

  it('returns 200 with an enriched AuditReport on a valid request', async () => {
    // Mock valid Gemini response structure
    const mockGeminiResponse = {
      findings: [
        {
          category: 'typography',
          severity: 'medium',
          confidence: 'high',
          element: 'Submit Button Label',
          issue: 'The font size of the label is small.',
          impact: 'Users might fail to read the label.',
          recommendation: 'Increase the font size for improved scanning readability.',
        },
      ],
    };

    mockCreate.mockResolvedValueOnce({
      output_text: JSON.stringify(mockGeminiResponse),
    });

    const req = createRequest(validImageBuffer, 'Please review the button font');
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();

    // Check enrichment
    expect(body.summary).toEqual({
      total: 1,
      high: 0,
      medium: 1,
      low: 0,
    });
    expect(body.findings).toHaveLength(1);
    expect(body.findings[0]).toEqual({
      ...mockGeminiResponse.findings[0],
      id: 'finding-1',
      priority: 1,
    });
  });

  it('returns 400 (VALIDATION_ERROR) if the image field is missing', async () => {
    const req = createRequest(undefined, 'Context without image');
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toContain('image');
  });

  it('returns 400 (VALIDATION_ERROR) if the browser-declared MIME type is invalid', async () => {
    // Pass a blob with application/pdf type
    const pdfBlob = new Blob([Buffer.from('%PDF-1.4')], { type: 'application/pdf' });
    const req = createRequest(pdfBlob);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toBe('File must be PNG, JPG, or WebP.');
  });

  it('returns 400 (VALIDATION_ERROR) if the file size exceeds 4 MB', async () => {
    const oversizedBuffer = Buffer.alloc(4 * 1024 * 1024 + 1); // 4MB + 1B
    const req = createRequest(oversizedBuffer);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toBe('File must be 4 MB or smaller.');
  });

  it('returns 400 (INVALID_IMAGE) if the image content is corrupt', async () => {
    // Send random text bytes (fails Sharp decoding)
    const corruptBuffer = Buffer.from('corrupt content');
    const req = createRequest(corruptBuffer);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_IMAGE');
    expect(body.error).toBe('File could not be read as a PNG, JPEG, or WebP image.');
  });

  it('returns 500 (AI_PARSE_ERROR) if Gemini returns malformed JSON or schema mismatch', async () => {
    // Malformed JSON response
    mockCreate.mockResolvedValueOnce({
      output_text: '{ invalid-json }',
    });

    const req = createRequest(validImageBuffer);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe('AI_PARSE_ERROR');
    expect(body.error).toBe('The audit could not be completed. The AI response was malformed.');
  });

  it('returns 503 (AI_UNAVAILABLE) on provider API connection issues', async () => {
    // Simulate connection/auth error
    mockCreate.mockRejectedValueOnce(new Error('API_KEY invalid or connection timeout'));

    const req = createRequest(validImageBuffer);
    const res = await POST(req);

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('AI_UNAVAILABLE');
    expect(body.error).toBe('The audit service is temporarily unavailable. Please try again.');
    // Check that raw error details do not leak to client
    expect(body.error).not.toContain('invalid or connection');
  });

  it('returns 500 (MODEL_NOT_FOUND) on model-access error', async () => {
    // Simulate model access/not found error
    mockCreate.mockRejectedValueOnce(new Error('models/gemini-3.5-flash not found or access denied'));

    const req = createRequest(validImageBuffer);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe('MODEL_NOT_FOUND');
    expect(body.error).toBe('The audit model is not currently accessible. See server logs.');
    // Check that raw error details do not leak to client
    expect(body.error).not.toContain('gemini-3.5-flash');
  });
});
