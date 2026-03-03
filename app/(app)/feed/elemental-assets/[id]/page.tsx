"use client";

import { useParams } from "next/navigation";
import { useElementalAsset } from "@/lib/hooks/useElementalAsset";
import { AssetPageHeader } from "./AssetPageHeader";
import { AssetPreviewArea } from "./AssetPreviewArea";
import { updateElementalAsset } from "@/lib/mutations/elemental-assets";
import type { ElementalAssetType } from "@/types/asset";

export default function AssetPage() {
  const params = useParams();
  const assetId = typeof params.id === "string" ? params.id : null;
  const { data: asset, isLoading, error } = useElementalAsset(assetId);

  const handleCategoryChange = async (category: ElementalAssetType) => {
    if (!assetId) return;
    await updateElementalAsset(assetId, { type: category });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-full flex-col gap-6 bg-[hsl(var(--content-background))] p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-full flex-col gap-6 bg-[hsl(var(--content-background))] p-6">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex min-h-full flex-col gap-6 bg-[hsl(var(--content-background))] p-6">
        <p className="text-muted-foreground">Asset not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8 bg-[hsl(var(--content-background))] p-0">
      <AssetPageHeader
        asset={asset}
        onCategoryChange={handleCategoryChange}
      />
      <AssetPreviewArea asset={asset} />
    </div>
  );
}
