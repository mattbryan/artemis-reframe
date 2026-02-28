/**
 * Design brief mutations — create, update, delete, set default.
 * All writes via InstantDB transact.
 */

import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { slugify, ensureUniqueSlug } from "@/lib/briefUtils";
import type { BriefStatus } from "@/types/brief";

/** Returns the new brief's slug for navigation. */
export async function createBrief(params: {
  name: string;
  description?: string;
  usageGuidelines?: string;
  collateralType?: string;
  collateralTypeIds?: string[];
  status?: BriefStatus;
}): Promise<string> {
  const briefId = id();
  const now = Date.now();
  const baseSlug = slugify(params.name);
  const { data } = await db.queryOnce({ brief: {} });
  const allBriefs = data?.brief ?? [];
  const existingSlugs = Array.isArray(allBriefs)
    ? allBriefs.map((b: { slug?: string }) => b.slug ?? "")
    : (Object.values(allBriefs) as { slug?: string }[]).map((b) => b.slug ?? "");
  const slug = ensureUniqueSlug(baseSlug, existingSlugs);

  const payload: Record<string, unknown> = {
    name: params.name,
    slug,
    description: params.description ?? "",
    usageGuidelines: params.usageGuidelines ?? "",
    collateralType: params.collateralType ?? "",
    status: params.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    isDefault: false,
  };
  if (params.collateralTypeIds != null) payload.collateralTypeIds = params.collateralTypeIds;

  await db.transact(db.tx.brief[briefId].update(payload));
  return slug;
}

export async function updateBrief(
  briefId: string,
  updates: Partial<{
    name: string;
    description: string;
    usageGuidelines: string;
    collateralType: string;
    collateralTypeIds: string[];
    status: BriefStatus;
  }>
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: Date.now() };
  if (updates.name != null) payload.name = updates.name;
  if (updates.description != null) payload.description = updates.description;
  if (updates.usageGuidelines != null) payload.usageGuidelines = updates.usageGuidelines;
  if (updates.collateralType != null) payload.collateralType = updates.collateralType;
  if (updates.collateralTypeIds != null) payload.collateralTypeIds = updates.collateralTypeIds;
  if (updates.status != null) payload.status = updates.status;
  await db.transact(db.tx.brief[briefId].update(payload));
}

export async function setDefaultBrief(briefId: string): Promise<void> {
  const { data } = await db.queryOnce({ brief: {} });
  const all = data?.brief ?? [];
  const tx = all
    .filter((b: { id: string }) => b.id !== briefId)
    .map((b: { id: string }) => db.tx.brief[b.id].update({ isDefault: false }));
  tx.push(db.tx.brief[briefId].update({ isDefault: true, updatedAt: Date.now() }));
  await db.transact(tx);
}

export async function deleteBrief(briefId: string): Promise<void> {
  const { data } = await db.queryOnce({
    brief: {
      $: { where: { id: briefId } },
      sections: {},
      screenshots: {},
      meta: {},
    },
  });
  const raw = data?.brief;
  const brief = Array.isArray(raw) ? raw[0] : (raw as Record<string, unknown> | undefined)?.[briefId] as { sections?: { id: string }[]; screenshots?: { id: string }[]; meta?: { id: string } } | undefined;
  const sections = (brief?.sections ?? []) as { id: string }[];
  const screenshots = (brief?.screenshots ?? []) as { id: string }[];
  const metaObj = brief?.meta;
  const ops = [
    ...sections.map((s) => db.tx.briefSection[s.id].delete()),
    ...screenshots.map((s) => db.tx.briefScreenshot[s.id].delete()),
    ...(metaObj?.id ? [db.tx.briefMeta[metaObj.id].delete()] : []),
    db.tx.brief[briefId].delete(),
  ];
  await db.transact(ops);
}

/** Returns the new brief's slug so the client can navigate. */
export async function duplicateBrief(briefId: string): Promise<string> {
  const { data } = await db.queryOnce({
    brief: {
      $: { where: { id: briefId } },
      sections: {},
      screenshots: {},
      meta: {},
    },
  });
  const raw = data?.brief;
  const sourceRaw = Array.isArray(raw) ? raw[0] : (raw as Record<string, unknown> | undefined)?.[briefId];
  if (!sourceRaw) throw new Error("Brief not found");
  type SourceBrief = {
    name?: string;
    description?: string;
    usageGuidelines?: string;
    collateralType?: string;
    collateralTypeIds?: string[];
    sections?: { id: string; type?: string; body?: string; order?: number }[];
    screenshots?: { id: string; url?: string; caption?: string; sectionId?: string | null; order?: number }[];
    meta?: { id: string; targetAudience?: string; collateralExamples?: string; figmaFileUrl?: string; tags?: string };
  };
  const source = sourceRaw as SourceBrief;
  const newId = id();
  const now = Date.now();
  const { data: allData } = await db.queryOnce({ brief: {} });
  const allBriefs = allData?.brief ?? [];
  const existingSlugs = Array.isArray(allBriefs)
    ? allBriefs.map((b: { slug?: string }) => b.slug ?? "")
    : (Object.values(allBriefs) as { slug?: string }[]).map((b) => b.slug ?? "");
  const baseSlug = slugify((source.name ?? "Copy") + " copy");
  const slug = ensureUniqueSlug(baseSlug, existingSlugs);

  const briefPayload: Record<string, unknown> = {
    name: (source.name ?? "") + " (copy)",
    slug,
    description: source.description ?? "",
    usageGuidelines: source.usageGuidelines ?? "",
    collateralType: source.collateralType ?? "",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    isDefault: false,
  };
  if (source.collateralTypeIds != null) briefPayload.collateralTypeIds = source.collateralTypeIds;

  const ops: unknown[] = [db.tx.brief[newId].update(briefPayload)];
  const sections = source.sections ?? [];
  const sectionIdMap: Record<string, string> = {};
  sections.forEach((s: { id: string; type?: string; body?: string; order?: number }) => {
    const newSectionId = id();
    sectionIdMap[s.id] = newSectionId;
    ops.push(
      db.tx.briefSection[newSectionId].update({
        briefId: newId,
        type: s.type ?? "custom",
        body: s.body ?? "",
        order: typeof s.order === "number" ? s.order : 0,
      })
    );
  });
  const screenshots = source.screenshots ?? [];
  screenshots.forEach(
    (s: { id: string; url?: string; caption?: string; sectionId?: string | null; order?: number }) => {
      const newScreenId = id();
      ops.push(
        db.tx.briefScreenshot[newScreenId].update({
          briefId: newId,
          sectionId: s.sectionId != null ? sectionIdMap[s.sectionId] ?? null : null,
          url: s.url ?? "",
          caption: s.caption ?? "",
          order: typeof s.order === "number" ? s.order : 0,
        })
      );
    }
  );
  const meta = source.meta;
  if (meta && typeof meta === "object" && "id" in meta) {
    const m = meta as {
      targetAudience?: string;
      collateralExamples?: string;
      figmaFileUrl?: string;
      tags?: string;
    };
    ops.push(
      db.tx.briefMeta[id()].update({
        briefId: newId,
        targetAudience: m.targetAudience ?? "",
        collateralExamples: m.collateralExamples ?? "",
        figmaFileUrl: m.figmaFileUrl ?? "",
        tags: m.tags ?? "",
      })
    );
  }
  await db.transact(ops as Parameters<typeof db.transact>[0]);
  return slug;
}

export async function archiveBrief(briefId: string): Promise<void> {
  await db.transact(
    db.tx.brief[briefId].update({ status: "archived" as const, updatedAt: Date.now() })
  );
}
