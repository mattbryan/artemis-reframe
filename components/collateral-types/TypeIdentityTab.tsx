"use client";

import { useEffect } from "react";
import { useCollateralTypeStore } from "@/store/collateralTypeStore";
import type { CollateralType } from "@/types/collateralType";
import { Input } from "@/components/ui/input";

const MAX_TEXTAREA = 10000;

interface TypeIdentityTabProps {
  type: CollateralType;
}

export function TypeIdentityTab({ type }: TypeIdentityTabProps) {
  const isEditMode = useCollateralTypeStore((s) => s.isEditMode);
  const identityDraft = useCollateralTypeStore((s) => s.identityDraft);
  const setIdentityDraft = useCollateralTypeStore((s) => s.setIdentityDraft);

  useEffect(() => {
    if (isEditMode && !identityDraft) {
      setIdentityDraft({
        name: type.name,
        category: type.category,
        description: type.description,
        aiIntent: type.aiIntent,
      });
    }
    if (!isEditMode && identityDraft) {
      setIdentityDraft(null);
    }
    // Only sync draft when entering/leaving edit mode or switching type
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, type.id]);

  const draft = isEditMode ? identityDraft ?? { name: type.name, category: type.category, description: type.description, aiIntent: type.aiIntent } : null;
  const display = draft ?? { name: type.name, category: type.category, description: type.description, aiIntent: type.aiIntent };

  const updateDraft = (updates: Partial<typeof display>) => {
    if (!draft) return;
    setIdentityDraft({ ...draft, ...updates });
  };

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const labelClass = "block text-sm font-medium text-foreground";
  const helperClass = "text-xs text-muted-foreground";

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="ct-name" className={labelClass}>
          Name
        </label>
        {isEditMode ? (
          <Input
            id="ct-name"
            value={display.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
            placeholder="e.g. Multifamily Offering Memorandum"
            className="mt-1"
          />
        ) : (
          <p className="mt-1 text-sm text-foreground">{display.name || "—"}</p>
        )}
      </div>
      <div>
        <label htmlFor="ct-category" className={labelClass}>
          Category
        </label>
        {isEditMode ? (
          <Input
            id="ct-category"
            value={display.category}
            onChange={(e) => updateDraft({ category: e.target.value })}
            placeholder="e.g. Multifamily, Industrial"
            className="mt-1"
          />
        ) : (
          <p className="mt-1 text-sm text-foreground">{display.category || "—"}</p>
        )}
      </div>
      <div>
        <label htmlFor="ct-description" className={labelClass}>
          Description
        </label>
        <p className={helperClass}>
          When would a broker use this type? What does it produce?
        </p>
        {isEditMode ? (
          <textarea
            id="ct-description"
            rows={3}
            maxLength={MAX_TEXTAREA}
            className={`mt-1 ${inputClass}`}
            value={display.description}
            onChange={(e) => updateDraft({ description: e.target.value })}
            placeholder="What this collateral type is for"
          />
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {display.description || "—"}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="ct-ai-intent" className={labelClass}>
          AI Intent
        </label>
        <p className={helperClass}>
          Write as a direct instruction. &quot;When generating this collateral type,
          always...&quot; — this is the top-level directive for every generation using
          this type.
        </p>
        {isEditMode ? (
          <textarea
            id="ct-ai-intent"
            rows={5}
            maxLength={MAX_TEXTAREA}
            className="mt-1 w-full rounded-md border border-primary/50 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={display.aiIntent}
            onChange={(e) => updateDraft({ aiIntent: e.target.value })}
            placeholder="When generating this collateral type, always..."
          />
        ) : (
          <div className="mt-1 rounded-md border border-primary/50 bg-muted/30 px-3 py-2 text-sm text-foreground">
            {display.aiIntent ? (
              <p className="whitespace-pre-wrap">{display.aiIntent}</p>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
