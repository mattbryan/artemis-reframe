"use client";

/**
 * useCollateralType — loads a single collateral type by slug with all related
 * sections, global fields, and media fields from InstantDB.
 *
 * WORKBENCH INTEGRATION POINT: The Workbench will call this hook at generation
 * time to load the type definition and drive the input wizard (Step 1: global +
 * section fields in order; Step 2: media fields). Do not build generation,
 * preview, or rendering logic here — this is definition/configuration only.
 */

import { useMemo } from "react";
import { db } from "@/lib/db";
import type {
  CollateralType,
  CollateralSection,
  CollateralGlobalField,
  CollateralMediaField,
} from "@/types/collateralType";
import { parseOutputTargets, parseSectionFields, parseOptions } from "@/lib/collateralTypeUtils";

interface CollateralTypeWithRelations extends CollateralType {
  sections: (CollateralSection & { fieldsParsed: ReturnType<typeof parseSectionFields> })[];
  globalFields: (CollateralGlobalField & { optionsParsed: string[] })[];
  mediaFields: CollateralMediaField[];
}

export function useCollateralType(slug: string | null): {
  type: CollateralTypeWithRelations | null;
  sections: CollateralSection[];
  globalFields: CollateralGlobalField[];
  mediaFields: CollateralMediaField[];
  linkedPersonaIds: string[];
  isLoading: boolean;
  error: Error | null;
} {
  const query = useMemo(() => {
    if (!slug) return null;
    return {
      collateralType: {
        $: { where: { slug } },
        sections: { $: { order: { order: "asc" as const } } },
        globalFields: { $: { order: { order: "asc" as const } } },
        mediaFields: { $: { order: { order: "asc" as const } } },
        personas: {},
      },
    };
  }, [slug]);

  const { isLoading, error, data } = db.useQuery(query);

  return useMemo(() => {
    if (!slug || !data?.collateralType) {
      return {
        type: null,
        sections: [],
        globalFields: [],
        mediaFields: [],
        linkedPersonaIds: [],
        isLoading,
        error:
          error != null
            ? (error as unknown) instanceof Error
              ? (error as Error)
              : new Error(String(error))
            : null,
      };
    }
    const rows = data.collateralType;
    const typeRow = Array.isArray(rows) ? rows[0] : (rows as Record<string, unknown>)[slug as string] ?? Object.values(rows)[0];
    if (!typeRow || typeof typeRow !== "object") {
      return {
        type: null,
        sections: [],
        globalFields: [],
        mediaFields: [],
        linkedPersonaIds: [],
        isLoading,
        error: null,
      };
    }
    const t = typeRow as Record<string, unknown>;
    const sectionsRaw = (t.sections ?? []) as Array<Record<string, unknown>>;
    const globalFieldsRaw = (t.globalFields ?? []) as Array<Record<string, unknown>>;
    const mediaFieldsRaw = (t.mediaFields ?? []) as Array<Record<string, unknown>>;
    const personasRaw = t.personas;
    const personasList = Array.isArray(personasRaw)
      ? (personasRaw as Array<Record<string, unknown>>)
      : personasRaw != null && typeof personasRaw === "object"
        ? (Object.values(personasRaw) as Array<Record<string, unknown>>)
        : [];
    const linkedPersonaIds = personasList
      .map((p) => (typeof p?.id === "string" ? p.id : undefined))
      .filter((id): id is string => id != null);

    const sections: (CollateralSection & { fieldsParsed: ReturnType<typeof parseSectionFields> })[] = sectionsRaw.map((s) => {
      const fieldsJson = (s.fields as string) ?? "[]";
      return {
        id: s.id as string,
        collateralTypeId: s.collateralTypeId as string,
        name: (s.name as string) ?? "",
        description: (s.description as string) ?? "",
        contentGuidelines: (s.contentGuidelines as string) ?? "",
        fields: fieldsJson,
        order: typeof s.order === "number" ? s.order : 0,
        fieldsParsed: parseSectionFields(fieldsJson),
      };
    });

    const globalFields: (CollateralGlobalField & { optionsParsed: string[] })[] = globalFieldsRaw.map((f) => {
      const optionsJson = (f.options as string) ?? "[]";
      return {
        id: f.id as string,
        collateralTypeId: f.collateralTypeId as string,
        label: (f.label as string) ?? "",
        fieldType: (f.fieldType as CollateralGlobalField["fieldType"]) ?? "text",
        helperText: (f.helperText as string) ?? "",
        placeholder: (f.placeholder as string) ?? "",
        options: optionsJson,
        required: Boolean(f.required),
        order: typeof f.order === "number" ? f.order : 0,
        optionsParsed: parseOptions(optionsJson),
      };
    });

    const mediaFields: CollateralMediaField[] = mediaFieldsRaw.map((m) => ({
      id: m.id as string,
      collateralTypeId: m.collateralTypeId as string,
      label: (m.label as string) ?? "",
      description: (m.description as string) ?? "",
      mediaType: (m.mediaType as CollateralMediaField["mediaType"]) ?? "image",
      required: Boolean(m.required),
      maxCount: typeof m.maxCount === "number" ? m.maxCount : 1,
      order: typeof m.order === "number" ? m.order : 0,
    }));

    const type: CollateralTypeWithRelations = {
      id: t.id as string,
      name: (t.name as string) ?? "",
      slug: (t.slug as string) ?? "",
      description: (t.description as string) ?? "",
      category: (t.category as string) ?? "",
      aiIntent: (t.aiIntent as string) ?? "",
      outputTargets: (t.outputTargets as string) ?? "[]",
      isDefault: Boolean(t.isDefault),
      isArchived: Boolean(t.isArchived),
      createdAt: typeof t.createdAt === "number" ? t.createdAt : 0,
      updatedAt: typeof t.updatedAt === "number" ? t.updatedAt : 0,
      sections,
      globalFields,
      mediaFields,
    };

    return {
      type,
      sections,
      globalFields,
      mediaFields,
      linkedPersonaIds,
      isLoading,
      error:
        error != null
          ? (error as unknown) instanceof Error
            ? (error as Error)
            : new Error(String(error))
          : null,
    };
  }, [slug, data, isLoading, error]);
}
