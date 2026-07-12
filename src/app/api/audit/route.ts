import { NextResponse } from 'next/server';
import { prepareImageBuffer } from '@/lib/imageUtils.server';
import { runAudit } from '@/lib/gemini';
import { enrichFindings } from '@/lib/reportUtils';
import { AuditRequestSchema } from '@/schemas/auditRequest';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // 1. Parse multipart FormData
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      console.error('Failed to parse multipart/form-data request body.');
      return NextResponse.json(
        { error: 'Invalid request body format. Must be multipart/form-data.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const imageField = formData.get('image');
    const contextField = formData.get('context');

    // Verify image exists and is a File/Blob
    if (!imageField || !(imageField instanceof Blob)) {
      console.error('API Error: Missing or invalid "image" field in FormData.');
      return NextResponse.json(
        { error: 'An image file must be uploaded.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const file = imageField as File;
    const rawContext = typeof contextField === 'string' ? contextField.trim() : undefined;
    const context = rawContext || undefined;

    // 2. Validate metadata with AuditRequestSchema
    const metadataParsed = AuditRequestSchema.safeParse({
      mimeType: file.type,
      fileSizeBytes: file.size,
      context,
    });

    if (!metadataParsed.success) {
      const errorMsg = metadataParsed.error.issues[0]?.message || 'Invalid upload parameters.';
      console.error('Validation Error:', metadataParsed.error.format());
      return NextResponse.json(
        { error: errorMsg, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 3. Read image file into a Buffer
    let rawBuffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      rawBuffer = Buffer.from(arrayBuffer);
    } catch (err) {
      console.error('Failed to read uploaded file into Buffer:', err);
      return NextResponse.json(
        { error: 'File could not be read. Please try again.', code: 'INVALID_IMAGE' },
        { status: 400 }
      );
    }

    // 4. Process image server-side with Sharp (decode, metadata, dimensions, resize)
    let processedBuffer: Buffer;
    let resolvedMimeType: string;
    try {
      const processed = await prepareImageBuffer(rawBuffer);
      processedBuffer = processed.buffer;
      resolvedMimeType = processed.mimeType;
    } catch (err: unknown) {
      console.error('Sharp Image Processing Error:', err);
      return NextResponse.json(
        { error: 'File could not be read as a PNG, JPEG, or WebP image.', code: 'INVALID_IMAGE' },
        { status: 400 }
      );
    }

    // 5. Call Gemini to run the UI/UX audit
    let geminiResponse;
    try {
      geminiResponse = await runAudit(processedBuffer, resolvedMimeType, context);
    } catch (err: unknown) {
      // Log exact error details server-side only
      console.error('Gemini Audit Run Failure:', err);

      const msg = err instanceof Error ? err.message : '';
      if (msg === 'GEMINI_API_KEY_MISSING') {
        return NextResponse.json(
          { error: 'The audit service is misconfigured. Server is missing API key.', code: 'AI_UNAVAILABLE' },
          { status: 503 }
        );
      }
      if (msg === 'MODEL_NOT_FOUND') {
        return NextResponse.json(
          { error: 'The audit model is not currently accessible. See server logs.', code: 'MODEL_NOT_FOUND' },
          { status: 500 }
        );
      }
      if (msg === 'AI_UNAVAILABLE') {
        return NextResponse.json(
          { error: 'The audit service is temporarily unavailable. Please try again.', code: 'AI_UNAVAILABLE' },
          { status: 503 }
        );
      }
      if (msg === 'AI_PARSE_ERROR') {
        return NextResponse.json(
          { error: 'The audit could not be completed. The AI response was malformed.', code: 'AI_PARSE_ERROR' },
          { status: 500 }
        );
      }

      // Default safe generic fallback for uncaught Gemini errors
      return NextResponse.json(
        { error: 'The audit service is temporarily unavailable. Please try again.', code: 'AI_UNAVAILABLE' },
        { status: 503 }
      );
    }

    // 6. Enrich findings and return the report
    const auditReport = enrichFindings(geminiResponse);
    return NextResponse.json(auditReport);
  } catch (err: unknown) {
    // Top-level catch-all for completely unexpected runtime failures
    console.error('Unhandled Server Error in /api/audit:', err);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred. Please try again.', code: 'UNKNOWN' },
      { status: 500 }
    );
  }
}
