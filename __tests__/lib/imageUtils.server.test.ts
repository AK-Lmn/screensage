/**
 * @vitest-environment node
 */
import { vi, describe, it, expect } from 'vitest';

// Mock server-only to prevent it throwing when loaded in a Vitest test runner context
vi.mock('server-only', () => ({}));

import sharp from 'sharp';
import { prepareImageBuffer } from '@/lib/imageUtils.server';

describe('Server-side prepareImageBuffer', () => {
  // Generate valid small buffers dynamically using Sharp for testing
  const createTestImage = async (format: 'png' | 'jpeg' | 'webp', width = 100, height = 100): Promise<Buffer> => {
    const pipeline = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.5 },
      },
    });

    if (format === 'png') return pipeline.png().toBuffer();
    if (format === 'jpeg') return pipeline.jpeg().toBuffer();
    return pipeline.webp().toBuffer();
  };

  it('successfully processes valid PNG, JPEG, and WebP buffers', async () => {
    const pngBuffer = await createTestImage('png');
    const jpegBuffer = await createTestImage('jpeg');
    const webpBuffer = await createTestImage('webp');

    const pngRes = await prepareImageBuffer(pngBuffer);
    expect(pngRes.mimeType).toBe('image/png');
    expect(pngRes.buffer).toBeInstanceOf(Buffer);

    const jpegRes = await prepareImageBuffer(jpegBuffer);
    expect(jpegRes.mimeType).toBe('image/jpeg');
    expect(jpegRes.buffer).toBeInstanceOf(Buffer);

    const webpRes = await prepareImageBuffer(webpBuffer);
    expect(webpRes.mimeType).toBe('image/webp');
    expect(webpRes.buffer).toBeInstanceOf(Buffer);
  });

  it('correctly detects format and ignores wrong file extensions (tests real contents)', async () => {
    // Generate real WebP data
    const webpBuffer = await createTestImage('webp');
    const res = await prepareImageBuffer(webpBuffer);
    expect(res.mimeType).toBe('image/webp');
  });

  it('rejects corrupt or invalid buffers', async () => {
    const corruptBuffer = Buffer.from('this is not an image');
    await expect(prepareImageBuffer(corruptBuffer)).rejects.toThrow('INVALID_IMAGE');
  });

  it('rejects images with zero dimensions', async () => {
    const emptyBuffer = Buffer.alloc(0);
    await expect(prepareImageBuffer(emptyBuffer)).rejects.toThrow('INVALID_IMAGE');
  });

  it('rejects oversized pixel-area (decompression bomb guard)', async () => {
    // 8000 * 7000 = 56,000,000 pixels (exceeds 50,000,000 limit)
    const oversizedBuffer = await createTestImage('png', 8000, 7000);
    await expect(prepareImageBuffer(oversizedBuffer)).rejects.toThrow('INVALID_IMAGE');
  });

  it('resizes image above 1536px correctly, maintaining aspect ratio', async () => {
    // Create an image of 2000 x 1000
    const largeBuffer = await createTestImage('png', 2000, 1000);
    const { buffer, mimeType } = await prepareImageBuffer(largeBuffer);

    expect(mimeType).toBe('image/png');

    // Decode processed buffer to inspect final dimensions
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(1536);
    expect(meta.height).toBe(768); // 1000 * (1536 / 2000) = 768 (aspect ratio preserved)
  });

  it('never enlarges smaller images', async () => {
    const smallBuffer = await createTestImage('png', 500, 300);
    const { buffer } = await prepareImageBuffer(smallBuffer);
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(500);
    expect(meta.height).toBe(300);
  });
});
