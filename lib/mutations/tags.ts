/**
 * Tag mutations — create, update, delete, merge.
 * Tags are Category: Value or Parent/Category: Value; stored as parent, category, value, key.
 */

import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { getTagKey } from "@/types/tag";
import { parseTagInput, parsedToTagSpecs } from "@/lib/tag-utils";
import type { Tag } from "@/types/tag";

function isLegacyTag(tag: Tag): boolean {
  return Boolean(tag.name && !tag.key);
}

/** Create one tag by segments. Reuses existing tag if key exists. Returns tag id. */
export async function createTagBySegments(
  parent: string | undefined,
  category: string,
  value: string
): Promise<string> {
  const key = getTagKey(parent, category, value);
  if (!key) throw new Error("Category and value are required.");

  const tagId = id();
  await db.transact(
    db.tx.tags[tagId].update({
      parent: parent?.trim() || undefined,
      category: category.trim(),
      value: value.trim(),
      key,
    })
  );
  return tagId;
}

/**
 * Parse full string (e.g. "Apparel/Color: Red,Blue") and create one tag per value.
 * Skips values whose key is in existingKeys. Returns created count.
 */
export async function createTagsFromString(
  input: string,
  existingKeys: Set<string> = new Set()
): Promise<number> {
  const parsed = parseTagInput(input);
  if (!parsed) return 0;

  const specs = parsedToTagSpecs(parsed).filter((s) => !existingKeys.has(s.key));
  if (specs.length === 0) return 0;

  const tx = specs.map((spec) => {
    const tagId = id();
    return db.tx.tags[tagId].update({
      parent: spec.parent?.trim() || undefined,
      category: spec.category,
      value: spec.value,
      key: spec.key,
    });
  });
  await db.transact(tx);
  return specs.length;
}

/**
 * Parse multiple lines, each as "Category: Value" or "Parent/Category: Value1,Value2".
 * Skips invalid lines and keys in existingKeys. Returns created count.
 */
export async function createTagsFromMultipleStrings(
  input: string,
  existingKeys: Set<string> = new Set()
): Promise<number> {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const allSpecs: { parent?: string; category: string; value: string; key: string }[] = [];
  const seenKeys = new Set(existingKeys);

  for (const line of lines) {
    const parsed = parseTagInput(line);
    if (!parsed) continue;
    for (const spec of parsedToTagSpecs(parsed)) {
      if (!seenKeys.has(spec.key)) {
        allSpecs.push(spec);
        seenKeys.add(spec.key);
      }
    }
  }

  if (allSpecs.length === 0) return 0;

  const tx = allSpecs.map((spec) => {
    const tagId = id();
    return db.tx.tags[tagId].update({
      parent: spec.parent?.trim() || undefined,
      category: spec.category,
      value: spec.value,
      key: spec.key,
    });
  });
  await db.transact(tx);
  return allSpecs.length;
}

/** Update an existing tag's segments (and key). */
export async function updateTag(
  tagId: string,
  updates: {
    parent?: string;
    category?: string;
    value?: string;
    name?: string;
    slug?: string;
  }
): Promise<void> {
  const next: Record<string, unknown> = { ...updates };
  if (updates.category != null && updates.value != null) {
    next.key = getTagKey(updates.parent, updates.category, updates.value);
  }
  if (updates.name !== undefined) next.name = updates.name;
  if (updates.slug !== undefined) next.slug = updates.slug;
  await db.transact(db.tx.tags[tagId].update(next));
}

/** Migrate a legacy tag (name, no key) to Uncategorized: name. */
export async function migrateTag(tag: Tag): Promise<void> {
  if (!isLegacyTag(tag) || !tag.name) return;
  const category = "Uncategorized";
  const value = tag.name.trim();
  const key = getTagKey(undefined, category, value);
  await db.transact(
    db.tx.tags[tag.id].update({
      category,
      value,
      key,
      name: undefined,
      slug: undefined,
    })
  );
}

export async function deleteTag(tagId: string): Promise<void> {
  await db.transact(db.tx.tags[tagId].delete());
}

/**
 * Merge source tag into target. Reassigns all exemplary assets from source to target,
 * then deletes the source tag.
 */
export async function mergeTags(
  sourceId: string,
  targetId: string,
  exemplaryAssetIds: string[]
): Promise<void> {
  if (exemplaryAssetIds.length === 0) {
    await db.transact(db.tx.tags[sourceId].delete());
    return;
  }
  await db.transact([
    db.tx.tags[sourceId].unlink({ exemplaryAssets: exemplaryAssetIds }),
    db.tx.tags[targetId].link({ exemplaryAssets: exemplaryAssetIds }),
    db.tx.tags[sourceId].delete(),
  ]);
}
