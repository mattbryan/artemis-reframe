"use client";

/**
 * useActiveBrief — for the collateral generator and detail panel.
 * Reads activeBriefId from Zustand; if none and there is an isDefault brief, auto-selects it.
 * Returns full brief with sections, screenshots, and meta from InstantDB.
 */

import { useEffect, useMemo } from "react";
import { db } from "@/lib/db";
import { useBriefStore, useActiveBriefId } from "@/store/briefStore";
import { useBriefs } from "@/lib/hooks/useBriefs";
import { getDefaultBrief } from "@/lib/briefUtils";
import type {
  Brief,
  BriefSection,
  BriefScreenshot,
  BriefMeta,
} from "@/types/brief";

interface ActiveBriefResult {
  brief: Brief | null;
  sections: BriefSection[];
  screenshots: BriefScreenshot[];
  meta: BriefMeta | null;
  isLoading: boolean;
  error: Error | null;
}

function mapBrief(b: {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  usageGuidelines?: string;
  collateralType?: string;
  status?: string;
  createdAt?: number;
  updatedAt?: number;
  isDefault?: boolean;
}): Brief {
  return {
    id: b.id,
    name: b.name ?? "",
    slug: b.slug ?? "",
    description: b.description ?? "",
    usageGuidelines: b.usageGuidelines ?? "",
    collateralType: b.collateralType ?? "",
    status: (b.status ?? "draft") as Brief["status"],
    createdAt: typeof b.createdAt === "number" ? b.createdAt : 0,
    updatedAt: typeof b.updatedAt === "number" ? b.updatedAt : 0,
    isDefault: Boolean(b.isDefault),
  };
}

function mapSection(s: {
  id: string;
  briefId?: string;
  type?: string;
  body?: string;
  order?: number;
}): BriefSection {
  return {
    id: s.id,
    briefId: s.briefId ?? "",
    type: (s.type ?? "custom") as BriefSection["type"],
    body: s.body ?? "",
    order: typeof s.order === "number" ? s.order : 0,
  };
}

function mapScreenshot(s: {
  id: string;
  briefId?: string;
  sectionId?: string | null;
  sectionIds?: string[] | null;
  url?: string;
  caption?: string;
  order?: number;
}): BriefScreenshot {
  const sectionIds = Array.isArray(s.sectionIds) && s.sectionIds.length > 0
    ? s.sectionIds
    : s.sectionId
      ? [s.sectionId]
      : [];
  return {
    id: s.id,
    briefId: s.briefId ?? "",
    sectionId: s.sectionId ?? null,
    sectionIds,
    url: s.url ?? "",
    caption: s.caption ?? "",
    order: typeof s.order === "number" ? s.order : 0,
  };
}

function mapMeta(m: {
  id: string;
  briefId?: string;
  targetAudience?: string;
  collateralExamples?: string;
  figmaFileUrl?: string;
  tags?: string;
}): BriefMeta {
  return {
    id: m.id,
    briefId: m.briefId ?? "",
    targetAudience: m.targetAudience ?? "",
    collateralExamples: m.collateralExamples ?? "",
    figmaFileUrl: m.figmaFileUrl ?? "",
    tags: m.tags ?? "",
  };
}

export function useActiveBrief(): ActiveBriefResult {
  const activeBriefId = useActiveBriefId();
  const setActiveBriefId = useBriefStore((s) => s.setActiveBriefId);
  const { data: allBriefs, isLoading: briefsLoading } = useBriefs();

  // Auto-select default brief when none selected
  useEffect(() => {
    if (activeBriefId != null || allBriefs.length === 0) return;
    const defaultBrief = getDefaultBrief(allBriefs);
    if (defaultBrief) setActiveBriefId(defaultBrief.id);
  }, [activeBriefId, allBriefs, setActiveBriefId]);

  const effectiveId = activeBriefId ?? getDefaultBrief(allBriefs)?.id ?? null;

  const query = useMemo(() => {
    if (effectiveId == null) return null;
    return {
      brief: {
        $: { where: { id: effectiveId } },
        sections: { $: { order: { order: "asc" as const } } },
        screenshots: { $: { order: { order: "asc" as const } } },
        meta: {},
      },
    };
  }, [effectiveId]);

  const { isLoading: detailLoading, error, data } = db.useQuery(query);

  return useMemo(() => {
    const isLoading = briefsLoading || detailLoading;
    if (effectiveId == null) {
      return {
        brief: null,
        sections: [],
        screenshots: [],
        meta: null,
        isLoading,
        error: error
          ? error instanceof Error
            ? error
            : new Error(String(error))
          : null,
      };
    }
    const briefRow = data?.brief?.[0];
    if (!briefRow) {
      return {
        brief: null,
        sections: [],
        screenshots: [],
        meta: null,
        isLoading,
        error: null,
      };
    }
    const sections = (briefRow.sections ?? []).map(mapSection);
    const screenshots = (briefRow.screenshots ?? []).map(mapScreenshot);
    const metaRow = briefRow.meta;
    return {
      brief: mapBrief(briefRow),
      sections,
      screenshots,
      meta: metaRow ? mapMeta(metaRow) : null,
      isLoading,
      error: error
        ? error instanceof Error
          ? error
          : new Error(String(error))
        : null,
    };
  }, [effectiveId, data, briefsLoading, detailLoading, error]);
}
