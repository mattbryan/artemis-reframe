/**
 * useElementalAssets — returns elemental assets from InstantDB.
 */

import { useMemo } from "react";
import { db } from "@/lib/db";
import type { ElementalAsset, ElementalAssetType } from "@/types/asset";

export function useElementalAssets(): {
  data: ElementalAsset[];
  isLoading: boolean;
  error: Error | null;
} {
  const { isLoading, error, data } = db.useQuery({
    elementalAssets: {
      $: {
        order: { serverCreatedAt: "desc" as const },
      },
    },
  });

  const assets = useMemo(() => {
    const rows = data?.elementalAssets ?? [];
    return rows.map((ea) => {
      const created_at =
        ea.createdAt != null
          ? new Date(ea.createdAt as string | number | Date).toISOString()
          : new Date().toISOString();
      const meta = (ea.metadata ?? {}) as Record<string, unknown>;
      const tags = Array.isArray(meta.tags) ? (meta.tags as string[]) : [];
      return {
        id: ea.id,
        type: "elemental" as const,
        title: ea.title,
        assetType: ea.type as ElementalAssetType,
        url: ea.url,
        storagePath: ea.storagePath,
        tags,
        schema_version: ea.schemaVersion ?? "1.0",
        created_at,
        metadata: meta,
      } satisfies ElementalAsset;
    });
  }, [data]);

  const err =
    error != null ? (error instanceof Error ? error : new Error((error as { message?: string }).message ?? "Unknown error")) : null;
  return { data: assets, isLoading, error: err };
}
