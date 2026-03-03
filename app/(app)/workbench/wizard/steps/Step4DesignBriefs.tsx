"use client";

import { useMemo, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useWizardStore } from "@/store/wizardStore";
import { parseOutputTargets, formatTargetType } from "@/lib/collateralTypeUtils";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OutputTargetDef } from "@/types/collateralType";

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

      {outputTargets.map((target) => (
        <BriefSelectorCard
          key={target.targetType}
          target={target}
          briefs={filteredBriefs}
          selectedBriefId={outputTargetAssignments[target.targetType]}
          onSelect={(briefId) =>
            setOutputTargetBrief(target.targetType, briefId)
          }
          defaultBriefId={target.defaultBriefId}
        />
      ))}
    </div>
  );
}

interface BriefSelectorCardProps {
  target: OutputTargetDef;
  briefs: { id: string; name: string; description: string }[];
  selectedBriefId: string | undefined;
  onSelect: (briefId: string) => void;
  defaultBriefId: string | null;
}

function BriefSelectorCard({
  target,
  briefs,
  selectedBriefId,
  onSelect,
  defaultBriefId,
}: BriefSelectorCardProps) {
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
    if (
      defaultBriefId &&
      briefs.some((b) => b.id === defaultBriefId) &&
      !selectedBriefId
    ) {
      onSelect(defaultBriefId);
    }
  }, [defaultBriefId, briefs, selectedBriefId, onSelect]);

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
