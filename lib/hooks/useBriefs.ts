/**
 * useBriefs — returns all briefs from InstantDB for the Design Briefs list.
 */

import { useMemo } from "react";
import { db } from "@/lib/db";
import type { Brief } from "@/types/brief";

export function useBriefs(): {
  data: (Brief & { meta?: { tags?: string } })[];
  isLoading: boolean;
  error: Error | null;
} {
  const { isLoading, error, data } = db.useQuery({
    brief: {
      meta: {},
    },
  });

  const briefs = useMemo(() => {
    const rows = data?.brief ?? [];
    const list = Array.isArray(rows) ? rows : Object.values(rows as Record<string, unknown>);
    const mapped = (list as Record<string, unknown>[]).map((b) => {
      const ids = b.collateralTypeIds as string[] | undefined;
      return {
        id: b.id,
        name: b.name ?? "",
        slug: b.slug ?? "",
        description: b.description ?? "",
        usageGuidelines: b.usageGuidelines ?? "",
        collateralType: b.collateralType ?? "",
        collateralTypeIds: Array.isArray(ids) ? ids : [],
        status: (b.status ?? "draft") as Brief["status"],
        createdAt: typeof b.createdAt === "number" ? b.createdAt : 0,
        updatedAt: typeof b.updatedAt === "number" ? b.updatedAt : 0,
        isDefault: Boolean(b.isDefault),
        meta: b.meta ? { tags: (b.meta as { tags?: string }).tags ?? "" } : undefined,
      };
    });
    return mapped.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }, [data]);

  const err =
    error != null
      ? error instanceof Error
        ? error
        : new Error((error as { message?: string }).message ?? "Unknown error")
      : null;
  return { data: briefs, isLoading, error: err };
}
