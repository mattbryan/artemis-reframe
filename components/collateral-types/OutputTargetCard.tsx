"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  updateOutputTarget,
  removeOutputTarget,
} from "@/lib/mutations/collateralTypes";
import type { OutputTargetDef, OutputTargetType } from "@/types/collateralType";
import {
  OUTPUT_TARGET_LABELS,
  OUTPUT_TARGET_BADGE_CLASS,
} from "@/lib/collateralTypeUtils";
import { useBriefs } from "@/lib/hooks/useBriefs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface OutputTargetCardProps {
  target: OutputTargetDef;
  typeId: string;
  isEditMode: boolean;
  onRemove: () => void;
}

export function OutputTargetCard({
  target,
  typeId,
  isEditMode,
  onRemove,
}: OutputTargetCardProps) {
  const [layoutNotes, setLayoutNotes] = useState(target.layoutNotes);
  const [defaultBriefId, setDefaultBriefId] = useState<string | null>(
    target.defaultBriefId
  );
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const { data: briefs } = useBriefs();

  const handleSaveLayoutNotes = () => {
    updateOutputTarget(typeId, target.targetType, { layoutNotes });
  };

  const handleSaveDefaultBrief = (briefId: string | null) => {
    setDefaultBriefId(briefId);
    updateOutputTarget(typeId, target.targetType, {
      defaultBriefId: briefId,
    });
  };

  const handleRemove = () => {
    removeOutputTarget(typeId, target.targetType);
    setRemoveDialogOpen(false);
    onRemove();
  };

  const label = OUTPUT_TARGET_LABELS[target.targetType] ?? target.targetType;
  const badgeClass =
    OUTPUT_TARGET_BADGE_CLASS[target.targetType] ??
    "bg-muted text-muted-foreground";

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2">
          <span
            className={cn(
              "rounded px-2 py-0.5 text-sm font-medium",
              badgeClass
            )}
          >
            {label}
          </span>
          {isEditMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              aria-label="Remove output target"
              onClick={() => setRemoveDialogOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label className="text-sm font-medium">
              Default Design Brief
            </label>
            <p className="text-xs text-muted-foreground">
              Which Design Brief governs this output format by default?
            </p>
            {isEditMode ? (
              <select
                value={defaultBriefId ?? ""}
                onChange={(e) =>
                  handleSaveDefaultBrief(
                    e.target.value ? e.target.value : null
                  )
                }
                className="mt-1 flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">
                  No default — select at generation time
                </option>
                {(briefs ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-sm text-foreground">
                {defaultBriefId
                  ? briefs?.find((b) => b.id === defaultBriefId)?.name ?? "—"
                  : "No default — select at generation time"}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Layout Notes</label>
            <p className="text-xs text-muted-foreground">
              Target-specific instructions for the AI. e.g. &quot;Web version
              should include a contact form. Print version omits interactive
              elements.&quot;
            </p>
            {isEditMode ? (
              <textarea
                rows={4}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={layoutNotes}
                onChange={(e) => setLayoutNotes(e.target.value)}
                onBlur={handleSaveLayoutNotes}
                maxLength={10000}
              />
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {target.layoutNotes || "—"}
              </p>
            )}
          </div>
        </div>
      </div>
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this output target?</DialogTitle>
            <DialogDescription>
              Rules or generation flows may reference this target. Remove
              &quot;{label}&quot; from this collateral type?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
