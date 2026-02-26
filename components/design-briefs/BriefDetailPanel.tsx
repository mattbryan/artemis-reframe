"use client";

import { useActiveBrief } from "@/lib/hooks/useActiveBrief";
import { useBriefStore } from "@/store/briefStore";
import { BriefDetailHeader } from "./BriefDetailHeader";
import { BriefOverviewTab } from "./BriefOverviewTab";
import { BriefSectionsTab } from "./BriefSectionsTab";
import { BriefScreenshotsTab } from "./BriefScreenshotsTab";
import { BriefMetadataTab } from "./BriefMetadataTab";
import { cn } from "@/lib/utils";
import type { BriefTabId } from "@/types/brief";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

const TABS: { id: BriefTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sections", label: "Sections" },
  { id: "screenshots", label: "Screenshots" },
  { id: "metadata", label: "Metadata" },
];

export function BriefDetailPanel() {
  const { brief, isLoading, error } = useActiveBrief();
  const activeTab = useBriefStore((s) => s.activeTab);
  const setActiveTab = useBriefStore((s) => s.setActiveTab);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-destructive">
        <p>{error.message}</p>
      </div>
    );
  }

  if (isLoading || !brief) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-12">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {!isLoading && (
          <>
            <p className="text-center text-muted-foreground">
              Select a brief from the list or create your first brief.
            </p>
            <Link
              href="/design-briefs/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4" />
              Create your first brief
            </Link>
          </>
        )}
      </div>
    );
  }

  const lastUpdated = brief.updatedAt
    ? new Date(brief.updatedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

  return (
    <div className="flex h-full flex-col">
      <BriefDetailHeader brief={brief} lastUpdated={lastUpdated} />
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
        {activeTab === "overview" && <BriefOverviewTab />}
        {activeTab === "sections" && <BriefSectionsTab />}
        {activeTab === "screenshots" && <BriefScreenshotsTab />}
        {activeTab === "metadata" && <BriefMetadataTab />}
      </div>
    </div>
  );
}
