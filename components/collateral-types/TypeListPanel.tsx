"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useCollateralTypes } from "@/lib/hooks/useCollateralTypes";
import { useCollateralTypeStore } from "@/store/collateralTypeStore";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { TypeListItem } from "./TypeListItem";

export function TypeListPanel() {
  const pathname = usePathname();
  const showArchived = useCollateralTypeStore((s) => s.showArchived);
  const { data: types, isLoading, error } = useCollateralTypes({
    showArchived,
  });
  const searchQuery = useCollateralTypeStore((s) => s.searchQuery);
  const setSearchQuery = useCollateralTypeStore((s) => s.setSearchQuery);
  const setShowArchived = useCollateralTypeStore((s) => s.setShowArchived);

  const filteredTypes = useMemo(() => {
    if (!types?.length) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return types;
    return types.filter((t) => {
      const name = (t.name ?? "").toLowerCase();
      const category = (t.category ?? "").toLowerCase();
      return name.includes(q) || category.includes(q);
    });
  }, [types, searchQuery]);

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof filteredTypes>();
    filteredTypes.forEach((t) => {
      const cat = t.category || "Uncategorized";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    });
    return Array.from(map.entries()).sort(([a], [b]) =>
      a === "Uncategorized" ? 1 : b === "Uncategorized" ? -1 : a.localeCompare(b)
    );
  }, [filteredTypes]);

  const currentSlug =
    pathname?.startsWith("/collateral-types/") && pathname !== "/collateral-types/new"
      ? pathname.split("/").filter(Boolean)[1]
      : null;
  const activeId =
    useCollateralTypeStore((s) => s.activeTypeId) ??
    types?.find((t) => t.slug === currentSlug)?.id ??
    null;

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex shrink-0 flex-col gap-2 border-b border-border py-4 px-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Collateral Types</h2>
          <Link
            href="/collateral-types/new"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="New type"
          >
            <PlusCircle className="h-5 w-5" />
          </Link>
        </div>
        <Input
          type="search"
          placeholder="Search types..."
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
        {!isLoading && !error && filteredTypes.length === 0 && (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            {types?.length === 0 ? "No types yet." : "No matching types."}
          </p>
        )}
        {!isLoading && !error && byCategory.length > 0 && (
          <ul className="space-y-4">
            {byCategory.map(([category, list]) => (
              <li key={category}>
                <p
                  className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  aria-hidden
                >
                  {category}
                </p>
                <ul className="space-y-0.5">
                  {list.map((type) => (
                    <li key={type.id}>
                      <TypeListItem
                        type={type}
                        isActive={type.id === activeId}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 border-t border-border p-2">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm text-muted-foreground">Show archived</span>
        </label>
      </div>
    </div>
  );
}
