import 'server-only';
import sharp from 'sharp';

const MAX_DIMENSION = 1536;
const MAX_PIXEL_AREA = 50_000_000; // 50 MP decompression bomb guard

const FORMAT_MAP: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * Validates, decodes, resizes, and prepares an image buffer server-side.
 *
 * Checks:
 * - Decodes successfully using Sharp
 * - Decoded format must be PNG, JPEG, or WebP (filename extension is ignored)
 * - Has valid dimensions (non-zero width and height)
 * - Total pixel area is <= 50 MP (decompression bomb guard)
 * - If animated, extracts only the first frame
 * - Applies EXIF rotation/orientation correction
 * - Resizes so that the longest dimension is <= 1536px (maintaining aspect ratio, never enlarging)
 *
 * @throws {Error} with message 'INVALID_IMAGE' for all validation or decoding failures.
 */
export async function prepareImageBuffer(
  rawBuffer: Buffer
): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    // Sharp constructor options: pages: 1 tells Sharp to load only the first page/frame
    // of multi-page formats (like animated webp or gif).
    const pipeline = sharp(rawBuffer, { pages: 1 });
    const meta = await pipeline.metadata();

    // Verify format is supported
    const format = meta.format;
    const resolvedMime = format ? FORMAT_MAP[format] : undefined;
    if (!resolvedMime) {
      throw new Error('INVALID_IMAGE');
    }

    // Verify dimensions are valid and non-zero
    const width = meta.width;
    const height = meta.height;
    if (!width || !height || width === 0 || height === 0) {
      throw new Error('INVALID_IMAGE');
    }

    // Decompression bomb guard
    if (width * height > MAX_PIXEL_AREA) {
      throw new Error('INVALID_IMAGE');
    }

    // Apply rotation based on EXIF metadata (orientation correction)
    pipeline.rotate();

    // Resize configuration
    const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;
    if (needsResize) {
      pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const buffer = await pipeline.toBuffer();
    return { buffer, mimeType: resolvedMime };
  } catch (err: unknown) {
    // Re-throw our controlled INVALID_IMAGE error directly
    if (err instanceof Error && err.message === 'INVALID_IMAGE') {
      throw err;
    }
    // Convert any Sharp decoding or runtime errors to the controlled INVALID_IMAGE error
    throw new Error('INVALID_IMAGE');
  }
}
