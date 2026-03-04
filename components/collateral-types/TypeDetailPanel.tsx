"use client";

import { useCollateralType } from "@/lib/hooks/useCollateralType";
import { useCollateralTypeStore } from "@/store/collateralTypeStore";
import { TypeDetailHeader } from "./TypeDetailHeader";
import { TypeIdentityTab } from "./TypeIdentityTab";
import { TypeSectionsTab } from "./TypeSectionsTab";
import { TypeFieldsTab } from "./TypeFieldsTab";
import { TypeMediaTab } from "./TypeMediaTab";
import { TypeOutputTargetsTab } from "./TypeOutputTargetsTab";
import { TypeAudienceTab } from "./TypeAudienceTab";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import type { CollateralTabId, CollateralType } from "@/types/collateralType";

const TABS: { id: CollateralTabId; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "sections", label: "Sections" },
  { id: "fields", label: "Fields" },
  { id: "media", label: "Media" },
  { id: "output-targets", label: "Output Targets" },
  { id: "audience", label: "Audience" },
];

interface TypeDetailPanelProps {
  slug: string | null;
}

export function TypeDetailPanel({ slug }: TypeDetailPanelProps) {
  const { type, linkedPersonaIds, isLoading, error } = useCollateralType(slug);
  const activeTab = useCollateralTypeStore((s) => s.activeTab);
  const setActiveTab = useCollateralTypeStore((s) => s.setActiveTab);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-destructive">
        <p>{error.message}</p>
      </div>
    );
  }

  if (isLoading || !type) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-12">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {!isLoading && (
          <>
            <p className="text-center text-muted-foreground">
              Select a type from the list or create a new one.
            </p>
            <Link
              href="/collateral-types/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4" />
              Create your first type
            </Link>
          </>
        )}
      </div>
    );
  }

  const lastUpdated =
    type.updatedAt > 0
      ? new Date(type.updatedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  return (
    <div className="flex h-full flex-col">
      <TypeDetailHeader type={type} lastUpdated={lastUpdated} />
      <nav
        className="flex shrink-0 gap-0 border-b border-border bg-card px-6"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={cn(
              "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {activeTab === "identity" && <TypeIdentityTab type={type} />}
        {activeTab === "sections" && <TypeSectionsTab type={type} />}
        {activeTab === "fields" && <TypeFieldsTab type={type} />}
        {activeTab === "media" && <TypeMediaTab type={type} />}
        {activeTab === "output-targets" && <TypeOutputTargetsTab type={type} />}
        {activeTab === "audience" && (
          <TypeAudienceTab
            collateralTypeId={type.id}
            linkedPersonaIds={linkedPersonaIds}
          />
        )}
      </div>
    </div>
  );
}
