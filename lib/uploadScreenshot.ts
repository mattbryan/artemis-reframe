/**
 * Upload a screenshot file and return a public URL.
 *
 * Real implementation: use Vercel Blob (or equivalent) to upload the file,
 * then return the blob URL. Stub below returns a placeholder for wiring.
 *
 * @example
 *   import { put } from '@vercel/blob';
 *   const blob = await put(file.name, file, { access: 'public' });
 *   return { url: blob.url };
 */

export async function uploadScreenshot(file: File): Promise<{ url: string }> {
  // TODO: Replace with real storage (e.g. Vercel Blob).
  // const blob = await put(file.name, file, { access: 'public' });
  // return { url: blob.url };
  const placeholder = URL.createObjectURL(file);
  return { url: placeholder };
}
