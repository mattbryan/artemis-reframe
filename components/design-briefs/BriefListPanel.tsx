"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useBriefs } from "@/lib/hooks/useBriefs";
import { useCollateralTypes } from "@/lib/hooks/useCollateralTypes";
import { useBriefStore } from "@/store/briefStore";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { BriefListItem } from "./BriefListItem";
import { formatBriefCollateralTypes } from "@/lib/briefUtils";
import { cn } from "@/lib/utils";

export function BriefListPanel() {
  const pathname = usePathname();
  const { data: briefs, isLoading, error } = useBriefs();
  const { data: collateralTypes } = useCollateralTypes();
  const searchQuery = useBriefStore((s) => s.searchQuery);
  const setSearchQuery = useBriefStore((s) => s.setSearchQuery);
  const activeBriefId = useBriefStore((s) => s.activeBriefId);

  const filteredBriefs = useMemo(() => {
    if (!briefs?.length) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return briefs;
    return briefs.filter((b) => {
      const name = (b.name ?? "").toLowerCase();
      const typeLabel = formatBriefCollateralTypes(b, collateralTypes).toLowerCase();
      const tags = b.meta?.tags ?? "";
      const tagStr = (typeof tags === "string" ? tags : "").toLowerCase();
      return name.includes(q) || typeLabel.includes(q) || tagStr.includes(q);
    });
  }, [briefs, searchQuery, collateralTypes]);

  const currentSlug = pathname?.startsWith("/design-briefs/")
    ? pathname.split("/").filter(Boolean)[1]
    : null;
  const activeId = activeBriefId ?? briefs?.find((b) => b.slug === currentSlug)?.id ?? null;

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex shrink-0 flex-col gap-2 border-b border-border py-4 px-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Design Briefs</h2>
          <Link
            href="/design-briefs/new"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="New brief"
          >
            <PlusCircle className="h-5 w-5" />
          </Link>
        </div>
        <Input
          type="search"
          placeholder="Search briefs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {error && (
          <p className="px-2 py-4 text-sm text-destructive">{error.message}</p>
        )}
        {isLoading && (
          <p className="px-2 py-4 text-sm text-muted-foreground">Loading…</p>
        )}
        {!isLoading && !error && filteredBriefs.length === 0 && (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            {briefs?.length === 0 ? "No briefs yet." : "No matching briefs."}
          </p>
        )}
        {!isLoading && !error && filteredBriefs.length > 0 && (
          <ul className="space-y-0.5">
            {filteredBriefs.map((brief) => (
              <li key={brief.id}>
                <BriefListItem brief={brief} isActive={brief.id === activeId} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
