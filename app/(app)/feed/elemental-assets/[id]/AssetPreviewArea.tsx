"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStorageUrl } from "@/lib/hooks/useStorageUrl";
import { updateElementalAsset } from "@/lib/mutations/elemental-assets";
import type { ElementalAsset } from "@/types/asset";

function formatDate(iso: string): string {
  try {
    return new Date(iso)
      .toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, " / ");
  } catch {
    return iso;
  }
}

function getFileExtension(title: string): string {
  const i = title.lastIndexOf(".");
  return i > 0 ? title.slice(i + 1).toLowerCase() : "—";
}

function formatSize(metadata: Record<string, unknown>): string {
  const size = metadata?.size;
  if (typeof size === "string") return size;
  if (typeof size === "number") {
    if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} mb`;
    if (size >= 1_000) return `${(size / 1_000).toFixed(1)} kb`;
    return `${size} b`;
  }
  return "—";
}

interface AssetPreviewAreaProps {
  asset: ElementalAsset;
}

export function AssetPreviewArea({ asset }: AssetPreviewAreaProps) {
  const [addTagsInput, setAddTagsInput] = useState("");
  const [isSavingTags, setIsSavingTags] = useState(false);

  const formatVal = getFileExtension(asset.title);
  const sizeVal = formatSize(asset.metadata ?? {});
  const uploadDate = formatDate(asset.created_at);

  const handleRemoveTag = async (tagToRemove: string) => {
    const next = asset.tags.filter((t) => t !== tagToRemove);
    setIsSavingTags(true);
    try {
      await updateElementalAsset(asset.id, {
        metadata: { ...asset.metadata, tags: next },
      });
    } finally {
      setIsSavingTags(false);
    }
  };

  const handleAddTags = async () => {
    const lines = addTagsInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    const next = [...asset.tags, ...lines];
    setAddTagsInput("");
    setIsSavingTags(true);
    try {
      await updateElementalAsset(asset.id, {
        metadata: { ...asset.metadata, tags: next },
      });
    } finally {
      setIsSavingTags(false);
    }
  };

  const resolvedUrl = useStorageUrl(asset.storagePath ?? null);
  const imgSrc = resolvedUrl ?? asset.url ?? undefined;
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !imgSrc || imgError;

  return (
    <div className="grid grid-cols-1 gap-8 px-6 lg:grid-cols-2">
      {/* Asset preview card */}
      <div className="flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative flex flex-1 min-h-0 overflow-hidden p-0 gap-0">
          {!showPlaceholder ? (
            <img
              src={imgSrc}
              alt={asset.title}
              className="h-full w-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-muted text-muted-foreground">
              No preview
            </div>
          )}
        </div>
      </div>

      {/* Metadata panel */}
      <div className="flex flex-col gap-6">
        {/* Attributes */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[14px] font-bold leading-6 tracking-[0.217px] text-foreground">
            Attributes
          </h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                <tr className="h-8 border-b border-border">
                  <td className="px-4 font-medium leading-4 text-foreground tracking-[0.39px]">
                    Format
                  </td>
                  <td className="border-l border-border px-4 font-medium leading-4 text-muted-foreground tracking-[0.39px]">
                    {formatVal}
                  </td>
                </tr>
                <tr className="h-8 border-b border-border">
                  <td className="px-4 font-medium leading-4 text-foreground tracking-[0.39px]">
                    Size
                  </td>
                  <td className="border-l border-border px-4 font-medium leading-4 text-muted-foreground tracking-[0.39px]">
                    {sizeVal}
                  </td>
                </tr>
                <tr className="h-8">
                  <td className="px-4 font-medium leading-4 text-foreground tracking-[0.39px]">
                    Upload Date
                  </td>
                  <td className="border-l border-border px-4 font-medium leading-4 text-muted-foreground tracking-[0.39px]">
                    {uploadDate}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[14px] font-bold leading-6 tracking-[0.217px] text-foreground">
            Tags
          </h2>
          <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-[#0f172a] p-2">
            {asset.tags.length === 0 ? (
              <span className="text-[13px] text-muted-foreground">
                No tags yet
              </span>
            ) : (
              asset.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background px-2 text-[13px] leading-4 text-foreground tracking-[0.39px]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isSavingTags}
                    className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex flex-col gap-2">
            <textarea
              value={addTagsInput}
              onChange={(e) => setAddTagsInput(e.target.value)}
              placeholder="Add tags here. One tag per line. Example: State: Florida Property Type / Retail: Restaurant"
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-[13px] leading-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTags}
              disabled={!addTagsInput.trim() || isSavingTags}
              className="h-8 w-fit border-primary px-4 text-[14px] text-foreground hover:bg-primary/10"
            >
              {isSavingTags ? "Saving…" : "Add tags"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
