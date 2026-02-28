"use client";

import { useMemo, useState, useEffect } from "react";
import { db } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useWizardStore } from "@/store/wizardStore";
import { parseOutputTargets } from "@/lib/collateralTypeUtils";
import { OUTPUT_TARGET_BADGE_CLASS } from "@/lib/collateralTypeUtils";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  CollateralType,
  CollateralSection,
  CollateralGlobalField,
  CollateralMediaField,
} from "@/types/collateralType";
import { parseOptions } from "@/lib/collateralTypeUtils";
import { parseSectionFields } from "@/lib/collateralTypeUtils";

interface CollateralTypeRow extends CollateralType {
  globalFields: (CollateralGlobalField & { optionsParsed: string[] })[];
  sections: (CollateralSection & { fieldsParsed: { id: string; order: number }[] })[];
  mediaFields: CollateralMediaField[];
}

function normalizeCollateralTypes(data: unknown): CollateralTypeRow[] {
  const ct = (data as { collateralType?: unknown })?.collateralType;
  if (!ct) return [];
  const list = Array.isArray(ct) ? ct : Object.values(ct as Record<string, unknown>);
  return (list as Record<string, unknown>[])
    .filter((t) => t && typeof t === "object" && !(t as { isArchived?: boolean }).isArchived)
    .map((t) => {
      const row = t as Record<string, unknown>;
      const globalFieldsRaw = (row.globalFields ?? []) as Array<Record<string, unknown>>;
      const sectionsRaw = (row.sections ?? []) as Array<Record<string, unknown>>;
      const mediaFieldsRaw = (row.mediaFields ?? []) as Array<Record<string, unknown>>;
      const globalFields = globalFieldsRaw
        .sort((a, b) => (Number(a.order) ?? 0) - (Number(b.order) ?? 0))
        .map((f) => ({
          id: f.id as string,
          collateralTypeId: f.collateralTypeId as string,
          label: (f.label as string) ?? "",
          fieldType: (f.fieldType as string) ?? "text",
          helperText: (f.helperText as string) ?? "",
          placeholder: (f.placeholder as string) ?? "",
          options: (f.options as string) ?? "[]",
          required: Boolean(f.required),
          order: Number(f.order) ?? 0,
          optionsParsed: parseOptions((f.options as string) ?? "[]"),
        }));
      const sections = sectionsRaw
        .sort((a, b) => (Number(a.order) ?? 0) - (Number(b.order) ?? 0))
        .map((s) => ({
          id: s.id as string,
          collateralTypeId: s.collateralTypeId as string,
          name: (s.name as string) ?? "",
          description: (s.description as string) ?? "",
          contentGuidelines: (s.contentGuidelines as string) ?? "",
          fields: (s.fields as string) ?? "[]",
          order: Number(s.order) ?? 0,
          fieldsParsed: parseSectionFields((s.fields as string) ?? "[]"),
        }));
      const mediaFields = mediaFieldsRaw
        .sort((a, b) => (Number(a.order) ?? 0) - (Number(b.order) ?? 0))
        .map((m) => ({
          id: m.id as string,
          collateralTypeId: m.collateralTypeId as string,
          label: (m.label as string) ?? "",
          description: (m.description as string) ?? "",
          mediaType: (m.mediaType as string) ?? "image",
          required: Boolean(m.required),
          maxCount: Number(m.maxCount) ?? 1,
          order: Number(m.order) ?? 0,
        }));
      return {
        id: row.id as string,
        name: (row.name as string) ?? "",
        slug: (row.slug as string) ?? "",
        description: (row.description as string) ?? "",
        category: (row.category as string) ?? "",
        aiIntent: (row.aiIntent as string) ?? "",
        outputTargets: (row.outputTargets as string) ?? "[]",
        isDefault: Boolean(row.isDefault),
        isArchived: Boolean(row.isArchived),
        createdAt: Number(row.createdAt) ?? 0,
        updatedAt: Number(row.updatedAt) ?? 0,
        globalFields,
        sections,
        mediaFields,
      } as CollateralTypeRow;
    });
}

interface Step1CollateralTypeProps {
  onStepValidChange: (valid: boolean) => void;
}

export function Step1CollateralType({ onStepValidChange }: Step1CollateralTypeProps) {
  const [search, setSearch] = useState("");
  const selectedCollateralType = useWizardStore((s) => s.selectedCollateralType);
  const setCollateralType = useWizardStore((s) => s.setCollateralType);
  const setStep = useWizardStore((s) => s.setStep);

  const { data } = db.useQuery({
    collateralType: {
      $: { where: { isArchived: false } },
      globalFields: {},
      sections: {},
      mediaFields: {},
    },
  });

  const types = useMemo(() => {
    const list = normalizeCollateralTypes(data ?? {});
    return list.filter((t) => !t.isArchived);
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return types;
    return types.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [types, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => (a.isDefault ? 0 : 1) - (b.isDefault ? 0 : 1));
  }, [filtered]);

  const isValid = selectedCollateralType !== null;
  useEffect(() => {
    onStepValidChange(isValid);
  }, [isValid, onStepValidChange]);

  const handleSelect = (ct: CollateralTypeRow) => {
    setCollateralType(ct);
    setStep(2);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">
        Select a collateral type
      </h2>
      <Input
        type="search"
        placeholder="Search by name, description, or category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      <div className="max-h-[400px] overflow-y-auto rounded-md border border-border">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
            {types.length === 0 ? (
              <>
                <p>No collateral types exist yet.</p>
                <Link
                  href="/collateral-types/new"
                  className="text-primary underline hover:no-underline"
                >
                  Create a collateral type
                </Link>
              </>
            ) : (
              <p>No results match your search.</p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((ct) => {
              const targets = parseOutputTargets(ct.outputTargets);
              return (
                <li key={ct.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(ct)}
                    className={cn(
                      "flex w-full flex-col gap-1 p-4 text-left transition-colors hover:bg-accent/50",
                      selectedCollateralType?.id === ct.id && "bg-accent/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {ct.isDefault && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                      )}
                      <span className="font-semibold text-foreground">
                        {ct.name}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-medium",
                          OUTPUT_TARGET_BADGE_CLASS[ct.category] ??
                            "bg-muted text-muted-foreground"
                        )}
                      >
                        {ct.category}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {ct.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {targets.map((t) => (
                        <span
                          key={t.targetType}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-xs font-medium",
                            OUTPUT_TARGET_BADGE_CLASS[t.targetType] ??
                              "bg-muted text-muted-foreground"
                          )}
                        >
                          {t.targetType}
                        </span>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        {targets.length} target{targets.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
