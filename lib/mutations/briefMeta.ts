/**
 * Brief metadata mutations — upsert (create or update one-to-one).
 */

import { id } from "@instantdb/react";
import { db } from "@/lib/db";

export async function upsertBriefMeta(
  briefId: string,
  metaId: string | null,
  params: {
    targetAudience: string;
    collateralExamples: string;
    figmaFileUrl: string;
    tags: string;
  }
): Promise<void> {
  if (metaId) {
    await db.transact(
      db.tx.briefMeta[metaId].update({
        targetAudience: params.targetAudience,
        collateralExamples: params.collateralExamples,
        figmaFileUrl: params.figmaFileUrl,
        tags: params.tags,
      })
    );
  } else {
    const newId = id();
    await db.transact([
      db.tx.briefMeta[newId].update({
        briefId,
        targetAudience: params.targetAudience,
        collateralExamples: params.collateralExamples,
        figmaFileUrl: params.figmaFileUrl,
        tags: params.tags,
      }),
      db.tx.brief[briefId].link({ meta: newId }),
    ]);
  }
}
