"use client";

import { useState, useEffect } from "react";
import { updateCollateralType } from "@/lib/mutations/collateralTypes";
import { useCollateralTypeStore } from "@/store/collateralTypeStore";
import type { CollateralType } from "@/types/collateralType";
import { parseOutputTargets } from "@/lib/collateralTypeUtils";
import { OUTPUT_TARGET_BADGE_CLASS } from "@/lib/collateralTypeUtils";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

async function commitIdentityDraft(
  typeId: string,
  draft: { name: string; category: string; description: string; aiIntent: string }
) {
  await updateCollateralType(typeId, {
    name: draft.name,
    category: draft.category,
    description: draft.description,
    aiIntent: draft.aiIntent,
  });
}

const TARGET_LABELS: Record<string, string> = {
  "print-pdf": "PDF",
  "web-html": "WEB",
  "social-image": "SOCIAL",
  "email-html": "EMAIL",
};

export function TypeDetailHeader({
  type,
  lastUpdated,
}: {
  type: CollateralType;
  lastUpdated: string;
}) {
  const isEditMode = useCollateralTypeStore((s) => s.isEditMode);
  const setIsEditMode = useCollateralTypeStore((s) => s.setIsEditMode);
  const identityDraft = useCollateralTypeStore((s) => s.identityDraft);
  const setIdentityDraft = useCollateralTypeStore((s) => s.setIdentityDraft);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(type.name);

  useEffect(() => {
    setName(type.name);
  }, [type.id, type.name]);

  const handleNameBlur = () => {
    setEditingName(false);
    if (name.trim() && name !== type.name) {
      updateCollateralType(type.id, { name: name.trim() });
    } else {
      setName(type.name);
    }
  };

  const targets = parseOutputTargets(type.outputTargets);

  return (
    <header className="flex h-[66px] shrink-0 items-center gap-4 border-b border-border bg-card px-6 py-4">
      <div className="min-w-0 flex-1">
        {editingName ? (
          <input
            type="text"
            className="min-w-[200px] rounded border border-input bg-background px-2 py-1 text-xl font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.target as HTMLInputElement).blur()
            }
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="text-left text-xl font-semibold text-foreground hover:underline"
            onClick={() => setEditingName(true)}
          >
            {type.name}
          </button>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {type.category && (
            <span className="rounded bg-muted px-2 py-0.5 font-medium text-muted-foreground">
              {type.category}
            </span>
          )}
          {targets.map((t) => (
            <span
              key={t.targetType}
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-medium",
                OUTPUT_TARGET_BADGE_CLASS[t.targetType] ??
                  "bg-muted text-muted-foreground"
              )}
            >
              {TARGET_LABELS[t.targetType] ?? t.targetType}
            </span>
          ))}
          <span>Updated {lastUpdated}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isEditMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(true)}
            className="gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                if (identityDraft) {
                  await commitIdentityDraft(type.id, identityDraft);
                  setIdentityDraft(null);
                }
                setIsEditMode(false);
              }}
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIdentityDraft(null);
                setIsEditMode(false);
              }}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
