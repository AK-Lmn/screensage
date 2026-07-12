import { describe, it, expect, vi, beforeAll } from 'vitest';
import { validateImageFile, createPreviewUrl, revokePreviewUrl } from '@/lib/imageUtils';

// Mock URL helper functions for the client-side test
beforeAll(() => {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-preview-url'),
    revokeObjectURL: vi.fn(),
  });
});

describe('Client-side imageUtils', () => {
  // Helper to create mock File objects in jsdom
  const createMockFile = (name: string, size: number, type: string): File => {
    const blob = new Blob(['a'.repeat(size)], { type });
    return new File([blob], name, { type });
  };

  it('accepts valid MIME types (PNG, JPEG, WebP)', () => {
    const pngFile = createMockFile('test.png', 1000, 'image/png');
    const jpegFile = createMockFile('test.jpg', 1000, 'image/jpeg');
    const webpFile = createMockFile('test.webp', 1000, 'image/webp');

    expect(validateImageFile(pngFile)).toBeNull();
    expect(validateImageFile(jpegFile)).toBeNull();
    expect(validateImageFile(webpFile)).toBeNull();
  });

  it('rejects invalid MIME types (e.g. GIF, PDF)', () => {
    const gifFile = createMockFile('test.gif', 1000, 'image/gif');
    const pdfFile = createMockFile('test.pdf', 1000, 'application/pdf');

    expect(validateImageFile(gifFile)).toBe('Only PNG, JPG, and WebP files are accepted.');
    expect(validateImageFile(pdfFile)).toBe('Only PNG, JPG, and WebP files are accepted.');
  });

  it('accepts a file of exactly 4 MB', () => {
    const fourMB = 4 * 1024 * 1024;
    const file = createMockFile('four-mb.png', fourMB, 'image/png');
    expect(validateImageFile(file)).toBeNull();
  });

  it('rejects a file over 4 MB', () => {
    const overFourMB = 4 * 1024 * 1024 + 1;
    const file = createMockFile('too-large.png', overFourMB, 'image/png');
    expect(validateImageFile(file)).toBe('File must be 4 MB or smaller.');
  });

  it('creates and revokes preview URLs correctly', () => {
    const file = createMockFile('test.png', 1000, 'image/png');
    const url = createPreviewUrl(file);
    expect(url).toBe('blob:mock-preview-url');
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);

    revokePreviewUrl(url);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(url);
  });
});
