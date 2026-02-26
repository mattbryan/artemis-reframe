"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCollateralTypeStore } from "@/store/collateralTypeStore";
import { addOutputTarget } from "@/lib/mutations/collateralTypes";
import { parseOutputTargets } from "@/lib/collateralTypeUtils";
import { OutputTargetCard } from "./OutputTargetCard";
import type { CollateralType } from "@/types/collateralType";
import { OUTPUT_TARGET_TYPES } from "@/types/collateralType";
import { OUTPUT_TARGET_LABELS } from "@/lib/collateralTypeUtils";

interface TypeOutputTargetsTabProps {
  type: CollateralType;
}

export function TypeOutputTargetsTab({ type }: TypeOutputTargetsTabProps) {
  const isEditMode = useCollateralTypeStore((s) => s.isEditMode);
  const [showAdd, setShowAdd] = useState(false);
  const targets = parseOutputTargets(type.outputTargets);
  const existingTypes = new Set(targets.map((t) => t.targetType));
  const available = OUTPUT_TARGET_TYPES.filter((t) => !existingTypes.has(t));

  const handleAdd = async (targetType: typeof OUTPUT_TARGET_TYPES[number]) => {
    await addOutputTarget(type.id, targetType);
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">
          Output Targets
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Each output target produces a different format from the same content.
          Assign a default Design Brief to each — these can be overridden when
          generating.
        </p>
      </div>
      <ul className="space-y-3">
        {targets.map((target) => (
          <li key={target.targetType}>
            <OutputTargetCard
              target={target}
              typeId={type.id}
              isEditMode={isEditMode}
              onRemove={() => {}}
            />
          </li>
        ))}
      </ul>
      {isEditMode && available.length > 0 && !showAdd && (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Output Target
        </Button>
      )}
      {isEditMode && showAdd && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
          <p className="mb-2 text-sm font-medium">Select target type to add</p>
          <div className="flex flex-wrap gap-2">
            {available.map((t) => (
              <Button
                key={t}
                variant="outline"
                size="sm"
                onClick={() => handleAdd(t)}
              >
                {OUTPUT_TARGET_LABELS[t] ?? t}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setShowAdd(false)}
          >
            Cancel
          </Button>
        </div>
      )}
      {isEditMode && available.length === 0 && (
        <p className="text-sm text-muted-foreground">
          All four output target types are already added.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Content is always shared across output targets. Layout Notes and Design
        Brief assignments are target-specific.
      </p>
    </div>
  );
}
