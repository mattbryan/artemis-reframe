"use client";

import { useMemo, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
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
import { db } from "@/lib/db";
import type { BriefScreenshot } from "@/types/brief";
import { useStorageUrl } from "@/lib/hooks/useStorageUrl";
import { BriefScreenshotPreviewModal } from "@/components/briefs/BriefScreenshotPreviewModal";
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
  const [briefOptionIds, setBriefOptionIds] = useState<string[]>(
    target.briefOptionIds ?? []
  );
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const { data: briefs } = useBriefs();
  const { data: screenshotData } = db.useQuery({
    briefScreenshot: {},
  });

  const screenshotsByBriefId = useMemo(() => {
    const rows = (screenshotData as { briefScreenshot?: unknown } | undefined)
      ?.briefScreenshot;
    if (!rows) return {} as Record<string, BriefScreenshot[]>;
    const list = Array.isArray(rows)
      ? rows
      : Object.values(rows as Record<string, unknown>);
    const mapped = (list as BriefScreenshot[]).slice();
    mapped.sort((a, b) => a.order - b.order);
    return mapped.reduce<Record<string, BriefScreenshot[]>>((acc, s) => {
      const key = s.briefId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    }, {});
  }, [screenshotData]);

  const [previewBriefId, setPreviewBriefId] = useState<string | null>(null);
  const [previewBriefName, setPreviewBriefName] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSaveLayoutNotes = () => {
    updateOutputTarget(typeId, target.targetType, { layoutNotes });
  };

  const handleToggleBrief = (briefId: string) => {
    const next = briefOptionIds.includes(briefId)
      ? briefOptionIds.filter((id) => id !== briefId)
      : [...briefOptionIds, briefId];
    setBriefOptionIds(next);
    updateOutputTarget(typeId, target.targetType, {
      briefOptionIds: next,
    });
  };

  const hasBriefsSelected = briefOptionIds.length > 0;

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
              Design Brief Options
            </label>
            <p className="text-xs text-muted-foreground">
              Which Design Briefs are valid for this output format?
            </p>
            <div
              className={cn(
                "mt-2 max-h-40 overflow-y-auto rounded-md border bg-background p-2",
                !hasBriefsSelected &&
                  "border-destructive/60 ring-1 ring-destructive/40"
              )}
            >
              {(briefs ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No briefs available yet.
                </p>
              ) : isEditMode ? (
                <ul className="space-y-1 text-sm">
                  {briefs!.map((b) => {
                    const checked = briefOptionIds.includes(b.id);
                    const screenshots = screenshotsByBriefId[b.id] ?? [];
                    return (
                      <li
                        key={b.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            id={`${target.targetType}-${b.id}`}
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            checked={checked}
                            onChange={() => handleToggleBrief(b.id)}
                          />
                          <BriefHoverPreview
                            briefId={b.id}
                            briefName={b.name}
                            screenshots={screenshots}
                          />
                        </div>
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={`Preview screenshots for ${b.name}`}
                          onClick={() => {
                            setPreviewBriefId(b.id);
                            setPreviewBriefName(b.name);
                            setPreviewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm">
                  {hasBriefsSelected
                    ? briefs
                        ?.filter((b) => briefOptionIds.includes(b.id))
                        .map((b) => b.name)
                        .join(", ") || "—"
                    : "None selected"}
                </p>
              )}
            </div>
            {!hasBriefsSelected && (
              <p className="mt-1 text-xs font-medium text-destructive">
                Required
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
      <BriefScreenshotPreviewModal
        briefId={previewBriefId}
        briefName={previewBriefName}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </>
  );
}

interface BriefHoverPreviewProps {
  briefId: string;
  briefName: string;
  screenshots: BriefScreenshot[];
}

function BriefHoverPreview({
  briefName,
  screenshots,
}: BriefHoverPreviewProps) {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);

  useMemo(() => undefined, []); // keep eslint from complaining about unused React import in this file

  const handleMouseEnter = () => {
    setHovering(true);
    window.setTimeout(() => {
      setOpen((prev) => (hovering ? true : prev));
    }, 300);
  };

  const handleMouseLeave = () => {
    setHovering(false);
    setOpen(false);
  };

  const previewScreenshots = screenshots.slice(0, 3);

  return (
    <div
      className="relative inline-flex max-w-xs flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="cursor-default select-none text-sm text-foreground">
        {briefName}
      </span>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-md border border-border bg-card p-2 shadow-lg">
          <p className="mb-1 truncate text-xs font-semibold text-foreground">
            {briefName}
          </p>
          {previewScreenshots.length === 0 ? (
            <p className="text-xs text-muted-foreground">No screenshots</p>
          ) : (
            <div className="flex gap-1">
              {previewScreenshots.map((s) => (
                <BriefThumbnail key={s.id} screenshot={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BriefThumbnail({ screenshot }: { screenshot: BriefScreenshot }) {
  const resolvedUrl = useStorageUrl(screenshot.storagePath ?? null);
  const imgSrc = resolvedUrl ?? screenshot.url ?? undefined;
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !imgSrc || imgError;

  return (
    <div className="flex-1 overflow-hidden rounded-md bg-muted">
      {!showPlaceholder ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={screenshot.caption || "Brief screenshot"}
          className="h-20 w-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-20 w-full items-center justify-center text-[10px] text-muted-foreground">
          No preview
        </div>
      )}
    </div>
  );
}

