"use client";

import Link from "next/link";
import { useState } from "react";
import type { MouseEvent } from "react";
import { useStorageUrl } from "@/lib/hooks/useStorageUrl";
import type { ElementalAsset } from "@/types/asset";

interface AssetPreviewCardProps {
  asset: ElementalAsset;
  selected: boolean;
  onToggleSelect: (event: MouseEvent<HTMLButtonElement>) => void;
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  photography: "Photography",
  illustrations: "Illustrations",
  icons: "Icons",
  "other-design-elements": "Other Design Elements",
  photo: "Photography",
  illustration: "Illustrations",
  "design-element": "Other Design Elements",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }).replace(/\//g, " / ");
  } catch {
    return iso;
  }
}

export function AssetPreviewCard({ asset, selected, onToggleSelect }: AssetPreviewCardProps) {
  const fileName = asset.title || "Untitled";
  const assetTypeLabel =
    ASSET_TYPE_LABELS[asset.assetType ?? ""] ?? asset.assetType ?? "—";
  const createdAt = formatDate(asset.created_at);
  // Legacy records may have url but no storagePath; try path we would have used at upload time.
  const effectiveStoragePath =
    asset.storagePath ??
    (asset.url && asset.title
      ? `elemental-assets/${asset.id}/${asset.title}`
      : null);
  const resolvedUrl = useStorageUrl(effectiveStoragePath);
  const imgSrc = resolvedUrl ?? asset.url ?? undefined;
  const [imgError, setImgError] = useState(false);
  const isLegacyNoPath = !asset.storagePath && !!asset.url;
  const showPlaceholder = !imgSrc || imgError;

  return (
    <Link
      href={`/feed/elemental-assets/${asset.id}`}
      className="flex h-[248px] flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative flex flex-1 min-h-0 overflow-hidden p-4">
        {!showPlaceholder ? (
          <img
            src={imgSrc}
            alt={fileName}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
            {isLegacyNoPath && imgError
              ? "Preview link expired. Re-upload this asset to restore."
              : "No preview"}
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect(e);
          }}
          className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border border-input bg-background transition-colors hover:bg-accent"
          aria-pressed={selected}
        >
          {selected && (
            <svg
              className="h-3 w-3 text-primary"
              viewBox="0 0 12 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 5l3 3 7-7" />
            </svg>
          )}
        </button>
      </div>
      <div className="flex flex-col gap-0 bg-card px-4 pt-2 pb-4">
        <p className="truncate text-base font-medium leading-7 tracking-[0.32px] text-foreground">
          {fileName}
        </p>
        <div className="flex items-center justify-between text-[13px] leading-4 tracking-[0.39px] text-muted-foreground">
          <span>{assetTypeLabel}</span>
          <span>{createdAt}</span>
        </div>
      </div>
    </Link>
  );
}
