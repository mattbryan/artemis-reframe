/**
 * useExemplaryAssets — returns exemplary assets.
 * Stub: uses fixtures. Swap for db.useQuery() when InstantDB is wired.
 */

import { useMemo } from "react";
import { exemplaryAssetsFixture } from "@/lib/fixtures";
import type { ExemplaryAsset } from "@/types/asset";

export function useExemplaryAssets(): {
  data: ExemplaryAsset[];
  isLoading: boolean;
  error: Error | null;
} {
  return useMemo(
    () => ({
      data: exemplaryAssetsFixture,
      isLoading: false,
      error: null,
    }),
    []
  );
}
