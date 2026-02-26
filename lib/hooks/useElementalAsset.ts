/**
 * useElementalAsset — returns a single elemental asset by id.
 */

import { useMemo } from "react";
import { useElementalAssets } from "./useElementalAssets";

export function useElementalAsset(assetId: string | null) {
  const { data: assets, isLoading, error } = useElementalAssets();
  const asset = useMemo(
    () => (assetId ? assets?.find((a) => a.id === assetId) ?? null : null),
    [assetId, assets]
  );
  return { data: asset ?? null, isLoading, error };
}
