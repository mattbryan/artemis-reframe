"use client";

import { useState, useMemo } from "react";
import { useElementalAssets } from "@/lib/hooks/useElementalAssets";
import {
  ElementalAssetsHeader,
  type AssetTypeFilter,
} from "./ElementalAssetsHeader";
import { AssetPreviewCard } from "./AssetPreviewCard";
import { BulkEditSidebar } from "./BulkEditSidebar";
import { UploadOverlay } from "./UploadOverlay";
import { createElementalAsset } from "@/lib/mutations/elemental-assets";

export function ElementalAssetsContent() {
  const { data: assets, isLoading, error } = useElementalAssets();
  const [searchQuery, setSearchQuery] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<AssetTypeFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = assets ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          (a.title ?? "").toLowerCase().includes(q) ||
          (a.assetType ?? "").toLowerCase().includes(q)
      );
    }
    if (assetTypeFilter !== "all") {
      const typeMap: Record<string, string[]> = {
        photography: ["photography", "photo"],
        illustrations: ["illustrations", "illustration"],
        icons: ["icons"],
        "other-design-elements": ["other-design-elements", "design-element"],
      };
      const allowed = typeMap[assetTypeFilter] ?? [];
      list = list.filter((a) => allowed.includes((a.assetType ?? "").toLowerCase()));
    }
    return list;
  }, [assets, searchQuery, assetTypeFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkAddTags = () => {
    // TODO: Open bulk tag dialog/sidebar
    alert("Bulk add tags coming soon.");
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} asset(s)?`)) {
      clearSelection();
    }
  };

  const handleUpload = async (
    files: File[],
    assetType: Exclude<AssetTypeFilter, "all">
  ) => {
    try {
      await Promise.all(
        files.map((file) => createElementalAsset(file, assetType))
      );
      clearSelection();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">Error: {error.message}</p>;

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-0">
        <ElementalAssetsHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          assetTypeFilter={assetTypeFilter}
          onAssetTypeChange={setAssetTypeFilter}
          onUploadClick={() => setUploadOpen(true)}
        />
        <div className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((asset) => (
            <AssetPreviewCard
              key={asset.id}
              asset={asset}
              selected={selectedIds.has(asset.id)}
              onToggleSelect={() => toggleSelect(asset.id)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No assets match your filters.
          </p>
        )}
      </div>

      <BulkEditSidebar
        selectedCount={selectedIds.size}
        onAddTags={handleBulkAddTags}
        onDelete={handleBulkDelete}
        onClose={clearSelection}
      />

      <UploadOverlay
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />
    </>
  );
}
