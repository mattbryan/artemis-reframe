/**
 * Brief screenshot mutations — create, update, delete, reorder.
 */

import { id } from "@instantdb/react";
import { db } from "@/lib/db";

export async function createBriefScreenshot(params: {
  briefId: string;
  sectionIds?: string[];
  url: string;
  caption: string;
  order: number;
}): Promise<string> {
  const screenshotId = id();
  const sectionIds = params.sectionIds ?? [];
  await db.transact([
    db.tx.briefScreenshot[screenshotId].update({
      briefId: params.briefId,
      sectionIds: sectionIds.length > 0 ? sectionIds : undefined,
      url: params.url,
      caption: params.caption,
      order: params.order,
    }),
    db.tx.brief[params.briefId].link({ screenshots: screenshotId }),
  ]);
  return screenshotId;
}

export async function updateBriefScreenshot(
  screenshotId: string,
  updates: Partial<{ sectionIds: string[]; caption: string; order: number }>
): Promise<void> {
  const payload: Record<string, unknown> = { ...updates };
  if (updates.sectionIds !== undefined) payload.sectionIds = updates.sectionIds.length > 0 ? updates.sectionIds : undefined;
  if (updates.caption !== undefined) payload.caption = updates.caption;
  if (updates.order !== undefined) payload.order = updates.order;
  await db.transact(db.tx.briefScreenshot[screenshotId].update(payload));
}

export async function deleteBriefScreenshot(screenshotId: string): Promise<void> {
  await db.transact(db.tx.briefScreenshot[screenshotId].delete());
}

export async function reorderBriefScreenshots(
  screenshotIdsInOrder: string[]
): Promise<void> {
  const ops = screenshotIdsInOrder.map((id, index) =>
    db.tx.briefScreenshot[id].update({ order: index })
  );
  await db.transact(ops);
}
