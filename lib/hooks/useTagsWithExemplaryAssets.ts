/**
 * useTagsWithExemplaryAssets — returns tags with their linked exemplary assets.
 * Used for Merge flow to get exemplary asset IDs per tag.
 */

import { db } from "@/lib/db";

export function useTagsWithExemplaryAssets() {
  const { isLoading, error, data } = db.useQuery({
    tags: { exemplaryAssets: {} },
  });

  const tags = data?.tags ?? [];
  return {
    data: tags,
    isLoading,
    error: error ? new Error(error.message) : null,
  };
}
