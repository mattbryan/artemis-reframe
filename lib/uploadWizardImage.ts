/**
 * Upload image for workbench wizard project images.
 * Uses InstantDB storage (same pattern as lib/uploadImage.ts).
 */

export async function uploadWizardImage(
  file: File
): Promise<{ url: string; storagePath: string }> {
  const { db } = await import("@/lib/db");
  const pathname = `workbench-images/${Date.now()}-${file.name}`;
  const ok = await db.storage.upload(pathname, file);
  if (!ok) throw new Error("Upload failed");
  const url = await db.storage.getDownloadUrl(pathname);
  return { url, storagePath: pathname };
}
