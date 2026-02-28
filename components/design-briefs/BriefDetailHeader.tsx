"use client";

import { useState, useEffect } from "react";
import { updateBrief } from "@/lib/mutations/briefs";
import { useCollateralTypes } from "@/lib/hooks/useCollateralTypes";
import { formatBriefCollateralTypes } from "@/lib/briefUtils";
import { BriefStatusDropdown } from "./BriefStatusDropdown";
import type { Brief } from "@/types/brief";

export function BriefDetailHeader({
  brief,
  lastUpdated,
}: {
  brief: Brief;
  lastUpdated: string;
}) {
  const { data: collateralTypes } = useCollateralTypes();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(brief.name);
  const typeLabel = formatBriefCollateralTypes(brief, collateralTypes);

  useEffect(() => {
    setName(brief.name);
  }, [brief.id, brief.name]);

  const handleNameBlur = () => {
    setEditingName(false);
    if (name.trim() && name !== brief.name) {
      updateBrief(brief.id, { name: name.trim() });
    } else {
      setName(brief.name);
    }
  };

  return (
    <header className="shrink-0 h-[66px] bg-card px-6 py-5 align-middle">
      <div className="flex flex-wrap items-center gap-2">
        {editingName ? (
          <input
            type="text"
            className="min-w-[200px] rounded border border-input bg-background px-2 py-1 text-xl font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="text-left text-xl font-semibold text-foreground hover:underline"
            onClick={() => setEditingName(true)}
          >
            {brief.name}
          </button>
        )}
        <span className="text-muted-foreground">·</span>
        <span className="text-sm text-muted-foreground">
          {typeLabel}
        </span>
        <BriefStatusDropdown
          status={brief.status}
          onStatusChange={(newStatus) =>
            updateBrief(brief.id, { status: newStatus })
          }
        />
        <span className="text-xs text-muted-foreground">
          Updated {lastUpdated}
        </span>
      </div>
    </header>
  );
}
