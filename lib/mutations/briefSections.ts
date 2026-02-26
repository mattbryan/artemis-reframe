/**
 * Brief section mutations — create, update, delete, reorder.
 */

import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import type { BriefSectionType } from "@/types/brief";

export async function createBriefSection(
  briefId: string,
  params: { type: BriefSectionType; body: string; order: number }
): Promise<string> {
  const sectionId = id();
  await db.transact([
    db.tx.briefSection[sectionId].update({
      briefId,
      type: params.type,
      body: params.body,
      order: params.order,
    }),
    db.tx.brief[briefId].link({ sections: sectionId }),
  ]);
  return sectionId;
}

export async function updateBriefSection(
  sectionId: string,
  updates: Partial<{ type: BriefSectionType; body: string; order: number }>
): Promise<void> {
  await db.transact(db.tx.briefSection[sectionId].update(updates));
}

export async function deleteBriefSection(sectionId: string): Promise<void> {
  await db.transact(db.tx.briefSection[sectionId].delete());
}

/** Reorder sections: update order for each affected section in one transaction. */
export async function reorderBriefSections(
  briefId: string,
  sectionIdsInOrder: string[]
): Promise<void> {
  const ops = sectionIdsInOrder.map((sectionId, index) =>
    db.tx.briefSection[sectionId].update({ order: index })
  );
  await db.transact(ops);
}
