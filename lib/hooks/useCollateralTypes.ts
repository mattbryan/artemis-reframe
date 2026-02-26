/**
 * useCollateralTypes — returns all (non-archived by default) collateral types
 * from InstantDB for the left panel list. Grouped by category.
 */

import { useMemo } from "react";
import { db } from "@/lib/db";
import type { CollateralType } from "@/types/collateralType";
import { parseOutputTargets } from "@/lib/collateralTypeUtils";

export function useCollateralTypes(options?: { showArchived?: boolean }): {
  data: CollateralType[];
  isLoading: boolean;
  error: Error | null;
} {
  const showArchived = options?.showArchived ?? false;
  const { isLoading, error, data } = db.useQuery({
    collateralType: {},
  });

  const types = useMemo(() => {
    const rows = data?.collateralType ?? [];
    const list = Array.isArray(rows) ? rows : Object.values(rows);
    const mapped: CollateralType[] = (list as Record<string, unknown>[])
      .map((t) => ({
        id: t.id as string,
        name: (t.name as string) ?? "",
        slug: (t.slug as string) ?? "",
        description: (t.description as string) ?? "",
        category: (t.category as string) ?? "",
        aiIntent: (t.aiIntent as string) ?? "",
        outputTargets: (t.outputTargets as string) ?? "[]",
        isDefault: Boolean(t.isDefault),
        isArchived: Boolean(t.isArchived),
        createdAt: typeof t.createdAt === "number" ? t.createdAt : 0,
        updatedAt: typeof t.updatedAt === "number" ? t.updatedAt : 0,
      }))
      .filter((t) => showArchived || !t.isArchived)
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return mapped;
  }, [data, showArchived]);

  const err =
    error != null
      ? error instanceof Error
        ? error
        : new Error((error as { message?: string }).message ?? "Unknown error")
      : null;
  return { data: types, isLoading, error: err };
}
