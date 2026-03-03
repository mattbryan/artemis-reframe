"use client";

import { useEffect, useMemo } from "react";
import { db } from "@/lib/db";
import { useWizardStore } from "@/store/wizardStore";
import {
  parseOutputTargets,
  parseSectionFields,
  formatTargetType,
} from "@/lib/collateralTypeUtils";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { FieldDef } from "@/types/collateralType";

interface Step5ReviewProps {
  onStepValidChange: (valid: boolean) => void;
  onGenerate: () => Promise<void>;
}

export function Step5Review({
  onStepValidChange,
}: Step5ReviewProps) {
  const projectName = useWizardStore((s) => s.projectName);
  const selectedCollateralType = useWizardStore((s) => s.selectedCollateralType);
  const formData = useWizardStore((s) => s.formData);
  const sectionData = useWizardStore((s) => s.sectionData);
  const images = useWizardStore((s) => s.images);
  const outputTargetAssignments = useWizardStore((s) => s.outputTargetAssignments);
  const setStep = useWizardStore((s) => s.setStep);

  const globalFields = useMemo(() => {
    if (!selectedCollateralType) return [];
    const raw = (selectedCollateralType as { globalFields?: unknown[] }).globalFields;
    return ((raw ?? []) as Array<Record<string, unknown>>).sort(
      (a, b) => (Number(a.order) ?? 0) - (Number(b.order) ?? 0)
    );
  }, [selectedCollateralType]);

  const sectionsWithFields = useMemo(() => {
    if (!selectedCollateralType) return [];
    const raw = (selectedCollateralType as { sections?: unknown[] }).sections;
    const list = (raw ?? []) as Array<Record<string, unknown>>;
    return list
      .sort((a, b) => (Number(a.order) ?? 0) - (Number(b.order) ?? 0))
      .map((s) => ({
        id: s.id as string,
        name: (s.name as string) ?? "",
        fields: parseSectionFields((s.fields as string) ?? "[]") as FieldDef[],
      }));
  }, [selectedCollateralType]);

  const outputTargets = useMemo(() => {
    if (!selectedCollateralType) return [];
    return parseOutputTargets(selectedCollateralType.outputTargets);
  }, [selectedCollateralType]);

  const { data: briefData } = db.useQuery({ brief: {} });
  const briefsById = useMemo(() => {
    const rows = briefData?.brief ?? [];
    const list = Array.isArray(rows) ? rows : Object.values(rows);
    const map: Record<string, { name: string; description: string }> = {};
    for (const b of list as Record<string, unknown>[]) {
      map[b.id as string] = {
        name: (b.name as string) ?? "",
        description: (b.description as string) ?? "",
      };
    }
    return map;
  }, [briefData]);

  useEffect(() => {
    onStepValidChange(true);
  }, [onStepValidChange]);

  if (!selectedCollateralType) return null;

  const formatValue = (v: string | boolean | number | undefined): string => {
    if (v === undefined || v === null || v === "") return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    return String(v);
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-foreground">
        Review: {projectName || "Untitled project"}
      </h2>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Collateral Type
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedCollateralType.name} · {selectedCollateralType.category}
              </p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {selectedCollateralType.description}
              </p>
            </div>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setStep(1);
              }}
              className="text-sm text-primary underline hover:no-underline"
            >
              Edit
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-foreground">
              Project Information
            </h3>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setStep(2);
              }}
              className="text-sm text-primary underline hover:no-underline"
            >
              Edit
            </Link>
          </div>
          <dl className="mt-3 space-y-2">
            <div>
              <dt className="text-xs text-muted-foreground">Project name</dt>
              <dd className="text-sm font-medium">{projectName || "—"}</dd>
            </div>
            {globalFields.map((f: Record<string, unknown>) => (
              <div key={f.id as string}>
                <dt className="text-xs text-muted-foreground">{String(f.label)}</dt>
                <dd className="text-sm">
                  {formatValue(formData[f.id as string])}
                </dd>
              </div>
            ))}
            {sectionsWithFields.map((sec) => (
              <div key={sec.id}>
                <dt className="text-xs font-medium text-muted-foreground">
                  {sec.name}
                </dt>
                <dd className="mt-1 space-y-1">
                  {sec.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <div key={field.id} className="text-sm">
                        <span className="text-muted-foreground">
                          {field.label}:{" "}
                        </span>
                        {formatValue(sectionData[sec.id]?.[field.id])}
                      </div>
                    ))}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-foreground">Images</h3>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setStep(3);
              }}
              className="text-sm text-primary underline hover:no-underline"
            >
              Edit
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => (
              <div
                key={img.id}
                className={cn(
                  "relative overflow-hidden rounded-md border",
                  img.isHero && "ring-2 ring-primary"
                )}
              >
                {img.url && (
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="aspect-square object-cover"
                  />
                )}
                {img.isHero && (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1 text-xs text-primary-foreground">
                    Hero
                  </span>
                )}
                <p className="truncate p-1 text-xs text-muted-foreground">
                  {img.filename}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-foreground">
              Output Targets
            </h3>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setStep(4);
              }}
              className="text-sm text-primary underline hover:no-underline"
            >
              Edit
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {outputTargets.map((t) => {
              const briefId = outputTargetAssignments[t.targetType];
              const brief = briefId ? briefsById[briefId] : null;
              return (
                <li key={t.targetType} className="text-sm">
                  <span className="font-medium">
                    {formatTargetType(t.targetType)}:
                  </span>{" "}
                  {brief ? brief.name : "—"}
                  {brief?.description && (
                    <span className="block text-xs text-muted-foreground">
                      {brief.description}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
