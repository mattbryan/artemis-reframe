/**
 * Collateral type mutations — create, update, duplicate, archive, delete,
 * sections, global fields, media fields, output targets. All writes via InstantDB transact.
 */

import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import {
  slugify,
  ensureUniqueSlug,
  parseOutputTargets,
  parseSectionFields,
} from "@/lib/collateralTypeUtils";
import type {
  OutputTargetDef,
  OutputTargetType,
  FieldDef,
  CollateralFieldType,
  CollateralMediaType,
} from "@/types/collateralType";

const now = () => Date.now();

// ——— Type CRUD ———

/** Returns the new type's slug for navigation. */
export async function createCollateralType(params: {
  name: string;
  category?: string;
  description?: string;
  aiIntent?: string;
}): Promise<string> {
  const typeId = id();
  const ts = now();
  const baseSlug = slugify(params.name);
  const { data } = await db.queryOnce({ collateralType: {} });
  const all = data?.collateralType ?? [];
  const list = (Array.isArray(all) ? all : Object.values(all)) as { slug?: string }[];
  const existingSlugs = list.map((t) => t.slug ?? "");
  const slug = ensureUniqueSlug(baseSlug, existingSlugs);

  await db.transact(
    db.tx.collateralType[typeId].update({
      name: params.name.trim(),
      slug,
      description: params.description?.trim() ?? "",
      category: params.category?.trim() ?? "",
      aiIntent: params.aiIntent?.trim() ?? "",
      outputTargets: "[]",
      isDefault: false,
      isArchived: false,
      createdAt: ts,
      updatedAt: ts,
    })
  );
  return slug;
}

export async function updateCollateralType(
  typeId: string,
  updates: Partial<{
    name: string;
    slug: string;
    description: string;
    category: string;
    aiIntent: string;
    outputTargets: string;
    isArchived: boolean;
  }>
): Promise<void> {
  const payload: Record<string, unknown> = { ...updates, updatedAt: now() };
  if (updates.name != null) {
    const baseSlug = slugify(updates.name);
    const { data } = await db.queryOnce({ collateralType: {} });
    const all = data?.collateralType ?? [];
    const list = (Array.isArray(all) ? all : Object.values(all)) as { id?: string; slug?: string }[];
    const existingSlugs = list
      .filter((t) => t.id !== typeId)
      .map((t) => t.slug ?? "");
    payload.slug = ensureUniqueSlug(baseSlug, existingSlugs);
  }
  await db.transact(db.tx.collateralType[typeId].update(payload));
}

/** Deep copy type + all sections, global fields, media fields. Returns new type's slug. */
export async function duplicateCollateralType(typeId: string): Promise<string> {
  const { data } = await db.queryOnce({
    collateralType: {
      $: { where: { id: typeId } },
      sections: { $: { order: { order: "asc" as const } } },
      globalFields: { $: { order: { order: "asc" as const } } },
      mediaFields: { $: { order: { order: "asc" as const } } },
    },
  });
  const rows = data?.collateralType ?? [];
  const source = Array.isArray(rows) ? rows[0] : (rows as Record<string, unknown>)[typeId];
  if (!source || typeof source !== "object") throw new Error("Collateral type not found");
  const s = source as Record<string, unknown>;
  const sections = (s.sections ?? []) as Array<Record<string, unknown>>;
  const globalFields = (s.globalFields ?? []) as Array<Record<string, unknown>>;
  const mediaFields = (s.mediaFields ?? []) as Array<Record<string, unknown>>;

  const newTypeId = id();
  const ts = now();
  const { data: allData } = await db.queryOnce({ collateralType: {} });
  const all = allData?.collateralType ?? [];
  const slugList = (Array.isArray(all) ? all : Object.values(all)) as { slug?: string }[];
  const existingSlugs = slugList.map((t) => t.slug ?? "");
  const baseSlug = slugify(((s.name as string) ?? "Copy") + " (Copy)");
  const newSlug = ensureUniqueSlug(baseSlug, existingSlugs);

  const ops: unknown[] = [
    db.tx.collateralType[newTypeId].update({
      name: ((s.name as string) ?? "") + " (Copy)",
      slug: newSlug,
      description: (s.description as string) ?? "",
      category: (s.category as string) ?? "",
      aiIntent: (s.aiIntent as string) ?? "",
      outputTargets: (s.outputTargets as string) ?? "[]",
      isDefault: false,
      isArchived: false,
      createdAt: ts,
      updatedAt: ts,
    }),
  ];

  const sectionIdMap: Record<string, string> = {};
  sections.forEach((sec) => {
    const newSectionId = id();
    sectionIdMap[sec.id as string] = newSectionId;
    ops.push(
      db.tx.collateralSection[newSectionId].update({
        collateralTypeId: newTypeId,
        name: (sec.name as string) ?? "",
        description: (sec.description as string) ?? "",
        contentGuidelines: (sec.contentGuidelines as string) ?? "",
        fields: (sec.fields as string) ?? "[]",
        order: typeof sec.order === "number" ? sec.order : 0,
      })
    );
  });

  const newGlobalFieldIds: string[] = [];
  (s.globalFields as Array<Record<string, unknown>> ?? []).forEach((f) => {
    const fid = id();
    newGlobalFieldIds.push(fid);
    ops.push(
      db.tx.collateralGlobalField[fid].update({
        collateralTypeId: newTypeId,
        label: (f.label as string) ?? "",
        fieldType: (f.fieldType as string) ?? "text",
        helperText: (f.helperText as string) ?? "",
        placeholder: (f.placeholder as string) ?? "",
        options: (f.options as string) ?? "[]",
        required: Boolean(f.required),
        order: typeof f.order === "number" ? f.order : 0,
      })
    );
  });

  const newMediaFieldIds: string[] = [];
  (s.mediaFields as Array<Record<string, unknown>> ?? []).forEach((m) => {
    const mid = id();
    newMediaFieldIds.push(mid);
    ops.push(
      db.tx.collateralMediaField[mid].update({
        collateralTypeId: newTypeId,
        label: (m.label as string) ?? "",
        description: (m.description as string) ?? "",
        mediaType: (m.mediaType as string) ?? "image",
        required: Boolean(m.required),
        maxCount: typeof m.maxCount === "number" ? m.maxCount : 1,
        order: typeof m.order === "number" ? m.order : 0,
      })
    );
  });

  Object.values(sectionIdMap).forEach((sid) => {
    ops.push(db.tx.collateralType[newTypeId].link({ sections: sid }));
  });
  newGlobalFieldIds.forEach((fid) => {
    ops.push(db.tx.collateralType[newTypeId].link({ globalFields: fid }));
  });
  newMediaFieldIds.forEach((mid) => {
    ops.push(db.tx.collateralType[newTypeId].link({ mediaFields: mid }));
  });

  await db.transact(ops as Parameters<typeof db.transact>[0]);
  return newSlug;
}

export async function archiveCollateralType(typeId: string): Promise<void> {
  await db.transact(
    db.tx.collateralType[typeId].update({ isArchived: true, updatedAt: now() })
  );
}

export async function deleteCollateralType(typeId: string): Promise<void> {
  const { data } = await db.queryOnce({
    collateralType: {
      $: { where: { id: typeId } },
      sections: {},
      globalFields: {},
      mediaFields: {},
    },
  });
  const rows = data?.collateralType ?? [];
  const typeRow = Array.isArray(rows) ? rows[0] : (rows as Record<string, unknown>)[typeId];
  if (!typeRow || typeof typeRow !== "object") return;
  const sections = ((typeRow as Record<string, unknown>).sections ?? []) as { id: string }[];
  const globalFields = ((typeRow as Record<string, unknown>).globalFields ?? []) as { id: string }[];
  const mediaFields = ((typeRow as Record<string, unknown>).mediaFields ?? []) as { id: string }[];
  const ops: unknown[] = [
    ...sections.map((sec) => db.tx.collateralSection[sec.id].delete()),
    ...globalFields.map((f) => db.tx.collateralGlobalField[f.id].delete()),
    ...mediaFields.map((m) => db.tx.collateralMediaField[m.id].delete()),
    db.tx.collateralType[typeId].delete(),
  ];
  await db.transact(ops as Parameters<typeof db.transact>[0]);
}

// ——— Sections ———

export async function createCollateralSection(
  collateralTypeId: string,
  params: { name: string; description?: string; contentGuidelines?: string; order: number }
): Promise<string> {
  const sectionId = id();
  await db.transact([
    db.tx.collateralSection[sectionId].update({
      collateralTypeId,
      name: params.name.trim(),
      description: params.description?.trim() ?? "",
      contentGuidelines: params.contentGuidelines?.trim() ?? "",
      fields: "[]",
      order: params.order,
    }),
    db.tx.collateralType[collateralTypeId].link({ sections: sectionId }),
  ]);
  return sectionId;
}

export async function updateCollateralSection(
  sectionId: string,
  updates: Partial<{
    name: string;
    description: string;
    contentGuidelines: string;
    fields: string;
    order: number;
  }>
): Promise<void> {
  await db.transact(db.tx.collateralSection[sectionId].update(updates));
}

export async function deleteCollateralSection(sectionId: string): Promise<void> {
  await db.transact(db.tx.collateralSection[sectionId].delete());
}

export async function reorderCollateralSections(
  collateralTypeId: string,
  sectionIdsInOrder: string[]
): Promise<void> {
  const ops = sectionIdsInOrder.map((sectionId, index) =>
    db.tx.collateralSection[sectionId].update({ order: index })
  );
  await db.transact(ops);
}

// ——— Section fields (JSON on section) ———

export async function updateSectionFields(
  sectionId: string,
  fields: FieldDef[]
): Promise<void> {
  const sorted = [...fields].sort((a, b) => a.order - b.order);
  await db.transact(
    db.tx.collateralSection[sectionId].update({
      fields: JSON.stringify(sorted),
    })
  );
}

export async function addFieldToSection(
  sectionId: string,
  currentFieldsJson: string,
  field: Omit<FieldDef, "id" | "order">
): Promise<void> {
  const fields = parseSectionFields(currentFieldsJson);
  const maxOrder = fields.length ? Math.max(...fields.map((f) => f.order)) : -1;
  const newField: FieldDef = {
    ...field,
    id: id(),
    order: maxOrder + 1,
    options: field.options ?? [],
  };
  fields.push(newField);
  await updateSectionFields(sectionId, fields);
}

export async function reorderSectionFields(
  sectionId: string,
  currentFieldsJson: string,
  fieldIdsInOrder: string[]
): Promise<void> {
  const fields = parseSectionFields(currentFieldsJson);
  const byId = new Map(fields.map((f) => [f.id, f]));
  const reordered = fieldIdsInOrder
    .map((fid) => byId.get(fid))
    .filter(Boolean) as FieldDef[];
  reordered.forEach((f, i) => {
    f.order = i;
  });
  await updateSectionFields(sectionId, reordered);
}

// ——— Global fields ———

export async function createCollateralGlobalField(
  collateralTypeId: string,
  params: {
    label: string;
    fieldType: CollateralFieldType;
    helperText?: string;
    placeholder?: string;
    options?: string[];
    required: boolean;
    order: number;
  }
): Promise<string> {
  const fieldId = id();
  await db.transact([
    db.tx.collateralGlobalField[fieldId].update({
      collateralTypeId,
      label: params.label.trim(),
      fieldType: params.fieldType,
      helperText: params.helperText?.trim() ?? "",
      placeholder: params.placeholder?.trim() ?? "",
      options: JSON.stringify(params.options ?? []),
      required: params.required,
      order: params.order,
    }),
    db.tx.collateralType[collateralTypeId].link({ globalFields: fieldId }),
  ]);
  return fieldId;
}

export async function updateCollateralGlobalField(
  fieldId: string,
  updates: Partial<{
    label: string;
    fieldType: CollateralFieldType;
    helperText: string;
    placeholder: string;
    options: string;
    required: boolean;
    order: number;
  }>
): Promise<void> {
  await db.transact(db.tx.collateralGlobalField[fieldId].update(updates));
}

export async function deleteCollateralGlobalField(fieldId: string): Promise<void> {
  await db.transact(db.tx.collateralGlobalField[fieldId].delete());
}

export async function reorderCollateralGlobalFields(
  collateralTypeId: string,
  fieldIdsInOrder: string[]
): Promise<void> {
  const ops = fieldIdsInOrder.map((fieldId, index) =>
    db.tx.collateralGlobalField[fieldId].update({ order: index })
  );
  await db.transact(ops);
}

// ——— Media fields ———

export async function createCollateralMediaField(
  collateralTypeId: string,
  params: {
    label: string;
    description?: string;
    mediaType: CollateralMediaType;
    required: boolean;
    maxCount: number;
    order: number;
  }
): Promise<string> {
  const fieldId = id();
  await db.transact([
    db.tx.collateralMediaField[fieldId].update({
      collateralTypeId,
      label: params.label.trim(),
      description: params.description?.trim() ?? "",
      mediaType: params.mediaType,
      required: params.required,
      maxCount: Math.max(1, params.maxCount),
      order: params.order,
    }),
    db.tx.collateralType[collateralTypeId].link({ mediaFields: fieldId }),
  ]);
  return fieldId;
}

export async function updateCollateralMediaField(
  fieldId: string,
  updates: Partial<{
    label: string;
    description: string;
    mediaType: CollateralMediaType;
    required: boolean;
    maxCount: number;
    order: number;
  }>
): Promise<void> {
  const payload = { ...updates };
  if (payload.maxCount != null) payload.maxCount = Math.max(1, payload.maxCount);
  await db.transact(db.tx.collateralMediaField[fieldId].update(payload));
}

export async function deleteCollateralMediaField(fieldId: string): Promise<void> {
  await db.transact(db.tx.collateralMediaField[fieldId].delete());
}

export async function reorderCollateralMediaFields(
  collateralTypeId: string,
  fieldIdsInOrder: string[]
): Promise<void> {
  const ops = fieldIdsInOrder.map((fieldId, index) =>
    db.tx.collateralMediaField[fieldId].update({ order: index })
  );
  await db.transact(ops);
}

// ——— Output targets (JSON on type) ———

export async function getOutputTargets(typeId: string): Promise<OutputTargetDef[]> {
  const { data } = await db.queryOnce({
    collateralType: { $: { where: { id: typeId } } },
  });
  const rows = data?.collateralType ?? [];
  const t = Array.isArray(rows) ? rows[0] : (rows as Record<string, unknown>)[typeId];
  const raw = (t as Record<string, unknown>)?.outputTargets as string | undefined;
  return parseOutputTargets(raw ?? "[]");
}

export async function updateCollateralTypeOutputTargets(
  typeId: string,
  targets: OutputTargetDef[]
): Promise<void> {
  await db.transact(
    db.tx.collateralType[typeId].update({
      outputTargets: JSON.stringify(targets),
      updatedAt: now(),
    })
  );
}

export async function addOutputTarget(
  typeId: string,
  targetType: OutputTargetType,
  layoutNotes: string = ""
): Promise<void> {
  const targets = await getOutputTargets(typeId);
  if (targets.some((t) => t.targetType === targetType)) return;
  targets.push({ targetType, briefOptionIds: [], layoutNotes });
  await updateCollateralTypeOutputTargets(typeId, targets);
}

export async function removeOutputTarget(typeId: string, targetType: OutputTargetType): Promise<void> {
  const targets = (await getOutputTargets(typeId)).filter((t) => t.targetType !== targetType);
  await updateCollateralTypeOutputTargets(typeId, targets);
}

export async function updateOutputTarget(
  typeId: string,
  targetType: OutputTargetType,
  updates: { briefOptionIds?: string[]; layoutNotes?: string }
): Promise<void> {
  const targets = await getOutputTargets(typeId);
  const idx = targets.findIndex((t) => t.targetType === targetType);
  if (idx === -1) return;
  targets[idx] = { ...targets[idx], ...updates };
  await updateCollateralTypeOutputTargets(typeId, targets);
}
