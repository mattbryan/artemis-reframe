"use client";

import { Search, ChevronDown, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ASSET_TYPE_OPTIONS = [
  { value: "all", label: "All Assets" },
  { value: "photography", label: "Photography" },
  { value: "illustrations", label: "Illustrations" },
  { value: "icons", label: "Icons" },
  { value: "other-design-elements", label: "Other Design Elements" },
] as const;

export type AssetTypeFilter = (typeof ASSET_TYPE_OPTIONS)[number]["value"];

interface ElementalAssetsHeaderProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  assetTypeFilter: AssetTypeFilter;
  onAssetTypeChange: (v: AssetTypeFilter) => void;
  onUploadClick: () => void;
}

export function ElementalAssetsHeader({
  searchQuery,
  onSearchChange,
  assetTypeFilter,
  onAssetTypeChange,
  onUploadClick,
}: ElementalAssetsHeaderProps) {
  return (
    <header className="flex h-24 w-full shrink-0 items-center gap-16 border-b border-border px-6">
      <h1 className="shrink-0 text-xl font-medium leading-7 tracking-[0.2px] text-foreground">
        Elemental Assets
      </h1>
      <div className="flex min-h-0 flex-1 items-center gap-4">
        <div className="relative w-[288px] shrink-0">
          <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="h-10 w-full rounded-lg border-input bg-background pl-10 pr-10 text-[13px] text-foreground placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              onClick={() => onSearchChange("")}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="relative shrink-0">
          <select
            value={assetTypeFilter}
            onChange={(e) => onAssetTypeChange(e.target.value as AssetTypeFilter)}
            className="flex h-10 min-w-[140px] appearance-none rounded-lg border border-input bg-background px-4 pr-10 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ASSET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-8 shrink-0 border-primary px-4 text-[14px] text-foreground hover:bg-primary/10"
        onClick={onUploadClick}
      >
        <Upload className="mr-2 h-5 w-5" />
        Upload
      </Button>
    </header>
  );
}
