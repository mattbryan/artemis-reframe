/**
 * useTags — returns tags from InstantDB.
 * Real-time subscription via db.useQuery.
 */

import { db } from "@/lib/db";

export function useTags() {
  const { isLoading, error, data } = db.useQuery({ tags: {} });

  const tags = data?.tags ?? [];
  return {
    data: tags,
    isLoading,
    error: error ? new Error(error.message) : null,
  };
}
