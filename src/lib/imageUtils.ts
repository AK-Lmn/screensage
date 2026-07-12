const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB — matches server limit

/**
 * Validates a file in the browser before upload.
 * Treats the browser-reported file.type as a first-pass check.
 * Real format verification is performed on the server.
 *
 * @returns An error message string if invalid, or null if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Only PNG, JPG, and WebP files are accepted.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File must be 4 MB or smaller.';
  }
  return null; // valid
}

/**
 * Creates an object URL for previewing an image in the browser.
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes an object URL to prevent memory leaks.
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
