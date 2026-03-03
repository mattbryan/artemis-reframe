/**
 * Upload image for design brief screenshots.
 * Placeholder: replace with Vercel Blob or your storage when ready.
 *
 * Real implementation (e.g. Vercel Blob):
 *   import { put } from '@vercel/blob';
 *   const blob = await put(pathname, file, { access: 'public' });
 *   return blob.url;
 */

export async function uploadImage(
  file: File
): Promise<{ url: string; storagePath: string }> {
  // Placeholder: use InstantDB storage so we don't require a separate backend.
  // When Vercel Blob is configured, swap this for put() and return the blob URL.
  const { db } = await import("@/lib/db");
  const pathname = `brief-screenshots/${Date.now()}-${file.name}`;
  const ok = await db.storage.upload(pathname, file);
  if (!ok) throw new Error("Upload failed");
  const url = await db.storage.getDownloadUrl(pathname);
  return { url, storagePath: pathname };
}
