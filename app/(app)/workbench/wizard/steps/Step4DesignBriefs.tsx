"use client";

import { useMemo, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { db } from "@/lib/db";
import { useWizardStore } from "@/store/wizardStore";
import { parseOutputTargets, formatTargetType } from "@/lib/collateralTypeUtils";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OutputTargetDef } from "@/types/collateralType";
import type { BriefScreenshot } from "@/types/brief";
import { useStorageUrl } from "@/lib/hooks/useStorageUrl";
import { BriefScreenshotPreviewModal } from "@/components/briefs/BriefScreenshotPreviewModal";

interface Step4DesignBriefsProps {
  onStepValidChange: (valid: boolean) => void;
}

export function Step4DesignBriefs({ onStepValidChange }: Step4DesignBriefsProps) {
  const selectedCollateralType = useWizardStore((s) => s.selectedCollateralType);
  const outputTargetAssignments = useWizardStore((s) => s.outputTargetAssignments);
  const setOutputTargetBrief = useWizardStore((s) => s.setOutputTargetBrief);

  const { data } = db.useQuery({
    brief: {
      $: { where: { status: "active" } },
      meta: {},
    },
  });

  const { data: screenshotData } = db.useQuery({
    briefScreenshot: {},
  });

  const allBriefs = useMemo(() => {
    const rows = data?.brief ?? [];
    const list = Array.isArray(rows) ? rows : Object.values(rows);
    return (list as Record<string, unknown>[]).map((b) => {
      const ids = b.collateralTypeIds as string[] | undefined;
      return {
        id: b.id as string,
        name: (b.name as string) ?? "",
        slug: (b.slug as string) ?? "",
        description: (b.description as string) ?? "",
        status: b.status as string,
        collateralTypeIds: Array.isArray(ids) ? ids : [],
      };
    });
  }, [data]);

  const filteredBriefs = useMemo(() => {
    const currentId = selectedCollateralType?.id;
    if (!currentId) return [];
    return allBriefs.filter((b) => {
      const ids = b.collateralTypeIds ?? [];
      return ids.length > 0 && ids.includes(currentId);
    });
  }, [allBriefs, selectedCollateralType?.id]);

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

  const outputTargets = useMemo((): OutputTargetDef[] => {
    if (!selectedCollateralType) return [];
    return parseOutputTargets(selectedCollateralType.outputTargets);
  }, [selectedCollateralType]);

  const isValid = useMemo(() => {
    if (outputTargets.length === 0) return true;
    return outputTargets.every(
      (t) =>
        outputTargetAssignments[t.targetType] &&
        filteredBriefs.some((b) => b.id === outputTargetAssignments[t.targetType])
    );
  }, [outputTargets, outputTargetAssignments, filteredBriefs]);

  useEffect(() => {
    onStepValidChange(isValid);
  }, [isValid, onStepValidChange]);

  const [previewBriefId, setPreviewBriefId] = useState<string | null>(null);
  const [previewBriefName, setPreviewBriefName] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!selectedCollateralType) return null;

  if (filteredBriefs.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          Design briefs
        </h2>
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/25 p-8 text-center text-sm text-muted-foreground">
          <p>No active briefs exist for this collateral type.</p>
          <p>In Design Briefs, open a brief, set Status to Active, and in the Metadata tab add this collateral type to Collateral Types. Then return here to select it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-foreground">
        Design briefs
      </h2>
      <p className="text-sm text-muted-foreground">
        Assign a design brief to each output target.
      </p>

      {outputTargets.map((target) => {
        const optionIds = target.briefOptionIds ?? [];
        const availableBriefs =
          optionIds.length > 0
            ? filteredBriefs.filter((b) => optionIds.includes(b.id))
            : [];
        const effectiveBriefs =
          availableBriefs.length > 0 ? availableBriefs : filteredBriefs;

        const selectedBriefId = outputTargetAssignments[target.targetType];

        const handleSelect = (briefId: string) => {
          setOutputTargetBrief(target.targetType, briefId);
        };

        const handlePreview = (briefId: string, briefName: string) => {
          setPreviewBriefId(briefId);
          setPreviewBriefName(briefName);
          setPreviewOpen(true);
        };

        return (
          <div key={target.targetType} className="space-y-2">
            {optionIds.length === 0 ? (
              <>
                <LegacyBriefSelectorCard
                  target={target}
                  briefs={effectiveBriefs}
                  selectedBriefId={selectedBriefId}
                  onSelect={handleSelect}
                />
                <p className="text-xs text-destructive/80">
                  No design brief options configured for this output target.
                  Configure them in Collateral Types.
                </p>
              </>
            ) : (
              <BriefCardSelector
                target={target}
                briefs={effectiveBriefs}
                selectedBriefId={selectedBriefId}
                onSelect={handleSelect}
                screenshotsByBriefId={screenshotsByBriefId}
                onPreview={handlePreview}
              />
            )}
          </div>
        );
      })}
      <BriefScreenshotPreviewModal
        briefId={previewBriefId}
        briefName={previewBriefName}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

interface LegacyBriefSelectorCardProps {
  target: OutputTargetDef;
  briefs: { id: string; name: string; description: string }[];
  selectedBriefId: string | undefined;
  onSelect: (briefId: string) => void;
}

function LegacyBriefSelectorCard({
  target,
  briefs,
  selectedBriefId,
  onSelect,
}: LegacyBriefSelectorCardProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selectedBrief = briefs.find((b) => b.id === selectedBriefId);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return briefs;
    return briefs.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
    );
  }, [briefs, search]);

  useEffect(() => {
    if (!selectedBriefId && briefs.length === 1) {
      onSelect(briefs[0].id);
    }
  }, [briefs, onSelect, selectedBriefId]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-foreground">
          {formatTargetType(target.targetType)}
        </h3>
        {target.layoutNotes && (
          <p className="text-xs text-muted-foreground">
            {target.layoutNotes}
          </p>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm"
          )}
        >
          <span className={selectedBrief ? "text-foreground" : "text-muted-foreground"}>
            {selectedBrief ? selectedBrief.name : "Select a brief…"}
          </span>
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <div className="absolute top-full left-0 z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-background shadow-md">
              <div className="p-2">
                <Input
                  type="search"
                  placeholder="Search briefs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mb-2"
                  autoFocus
                />
              </div>
              <ul className="max-h-48 overflow-auto p-2">
                {filtered.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(b.id);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "w-full rounded px-3 py-2 text-left text-sm hover:bg-accent",
                        selectedBriefId === b.id && "bg-accent"
                      )}
                    >
                      <div className="font-medium">{b.name}</div>
                      {b.description && (
                        <div className="truncate text-xs text-muted-foreground">
                          {b.description}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface BriefCardSelectorProps {
  target: OutputTargetDef;
  briefs: { id: string; name: string; description: string }[];
  selectedBriefId: string | undefined;
  onSelect: (briefId: string) => void;
  screenshotsByBriefId: Record<string, BriefScreenshot[]>;
  onPreview: (briefId: string, briefName: string) => void;
}

function BriefCardSelector({
  target,
  briefs,
  selectedBriefId,
  onSelect,
  screenshotsByBriefId,
  onPreview,
}: BriefCardSelectorProps) {
  useEffect(() => {
    if (!selectedBriefId && briefs.length === 1) {
      onSelect(briefs[0].id);
    }
  }, [briefs, onSelect, selectedBriefId]);

  const gridCols = briefs.length > 1 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="mb-1">
        <h3 className="text-sm font-medium text-foreground">
          {formatTargetType(target.targetType)}
        </h3>
        {target.layoutNotes && (
          <p className="text-xs text-muted-foreground">
            {target.layoutNotes}
          </p>
        )}
      </div>
      <div className={cn("grid gap-3 sm:grid-cols-1", gridCols)}>
        {briefs.map((brief) => (
          <BriefCard
            key={brief.id}
            brief={brief}
            screenshots={screenshotsByBriefId[brief.id] ?? []}
            selected={selectedBriefId === brief.id}
            onSelect={() => onSelect(brief.id)}
            onPreview={() => onPreview(brief.id, brief.name)}
          />
        ))}
      </div>
    </div>
  );
}

interface BriefCardProps {
  brief: { id: string; name: string; description: string };
  screenshots: BriefScreenshot[];
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

function BriefCard({
  brief,
  screenshots,
  selected,
  onSelect,
  onPreview,
}: BriefCardProps) {
  const primaryScreenshot = screenshots[0] ?? null;
  const resolvedUrl = useStorageUrl(primaryScreenshot?.storagePath ?? null);
  const imgSrc = resolvedUrl ?? primaryScreenshot?.url ?? undefined;
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !imgSrc || imgError;

  const initials = useMemo(() => {
    const parts = brief.name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "";
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }, [brief.name]);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col overflow-hidden border bg-card transition hover:border-primary/70 hover:shadow-sm",
        selected && "border-primary ring-2 ring-primary"
      )}
    >
      <div className="relative h-32 w-full bg-muted">
        {!showPlaceholder ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={brief.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-xl font-semibold text-muted-foreground">
            {initials || "—"}
          </div>
        )}
        {selected && (
          <div className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div>
          <p className="text-sm font-medium text-foreground">{brief.name}</p>
          {brief.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {brief.description}
            </p>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <button
            type="button"
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            Preview
          </button>
          {selected && (
            <span className="text-xs font-medium text-primary">Selected</span>
          )}
        </div>
      </div>
    </Card>
  );
}
