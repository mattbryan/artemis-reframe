"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, Download, ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ASSET_TYPE_OPTIONS } from "../ElementalAssetsHeader";
import type { ElementalAsset, ElementalAssetType } from "@/types/asset";

interface AssetPageHeaderProps {
  asset: ElementalAsset;
  onCategoryChange: (category: ElementalAssetType) => void;
}

export function AssetPageHeader({ asset, onCategoryChange }: AssetPageHeaderProps) {
  const router = useRouter();
  const fileName = asset.title || "Untitled";

  const handleOpenInNewTab = () => {
    if (asset.url) window.open(asset.url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async () => {
    if (!asset.url) return;
    try {
      const res = await fetch("/api/elemental-assets/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: asset.url, filename: fileName }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(asset.url, "_blank");
    }
  };

  const handleAllAssets = () => {
    router.push("/feed/elemental-assets");
  };

  return (
    <header className="flex min-h-24 w-full flex-wrap items-center gap-6 border-b border-border pt-6 px-6 pb-6">
      <h1 className="shrink-0 text-[20px] font-medium leading-7 tracking-[0.2px] text-foreground">
        {fileName}
      </h1>
      <div className="relative shrink-0">
        <select
          value={asset.assetType ?? "photography"}
          onChange={(e) =>
            onCategoryChange(e.target.value as ElementalAssetType)
          }
          className="flex h-8 min-w-[120px] appearance-none rounded-full border border-input bg-background px-3 pr-8 text-[13px] font-medium tracking-[0.39px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          {ASSET_TYPE_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      <div className="ml-auto flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleOpenInNewTab}
          disabled={!asset.url}
          aria-label="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleDownload}
          disabled={!asset.url}
          aria-label="Download"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 border-0 bg-transparent px-4 text-[14px] text-foreground hover:bg-primary/10"
          onClick={handleAllAssets}
        >
          <ArrowLeft className="h-4 w-4" />
          All Assets
        </Button>
      </div>
    </header>
  );
}
