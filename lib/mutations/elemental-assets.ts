/**
 * Elemental assets mutations — create (upload to storage + DB record), delete.
 */

import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import type { ElementalAssetType } from "@/types/asset";

/** Upload file to InstantDB storage and create elementalAssets record. Returns asset id. */
export async function createElementalAsset(
  file: File,
  assetType: ElementalAssetType
): Promise<string> {
  const assetId = id();
  const path = `elemental-assets/${assetId}/${file.name}`;

  const ok = await db.storage.upload(path, file);
  if (!ok) throw new Error("Storage upload failed");

  const url = await db.storage.getDownloadUrl(path);

  await db.transact(
    db.tx.elementalAssets[assetId].update({
      title: file.name,
      type: assetType,
      url,
      schemaVersion: "1.0",
      createdAt: new Date().toISOString(),
      metadata: {},
    })
  );
  return assetId;
}

/** Update elemental asset type (category) and/or metadata (e.g. metadata.tags). */
export async function updateElementalAsset(
  assetId: string,
  updates: { type?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.type != null) payload.type = updates.type;
  if (updates.metadata != null) payload.metadata = updates.metadata;
  if (Object.keys(payload).length === 0) return;
  await db.transact(db.tx.elementalAssets[assetId].update(payload));
}
