/**
 * Tag type — hierarchical taxonomy for Exemplary Work.
 * Format: Category: Value or Parent/Category: Value.
 */

export interface Tag {
  id: string;
  /** Optional parent segment (e.g. "Apparel") */
  parent?: string;
  /** Category (e.g. "Color"); optional on legacy tags until migrated */
  category?: string;
  /** Value (e.g. "Blue"); optional on legacy tags until migrated */
  value?: string;
  /** Unique key for dedup: parent|category|value (empty parent omitted) */
  key?: string;
  /** Legacy: present on migrated tags until normalized */
  name?: string;
  slug?: string;
}

/** Build display string: "Parent/Category: Value" or "Category: Value" */
export function formatTagDisplay(tag: Tag): string {
  if (tag.category && tag.value) {
    return tag.parent
      ? `${tag.parent}/${tag.category}: ${tag.value}`
      : `${tag.category}: ${tag.value}`;
  }
  return tag.name ?? `${tag.category ?? "Uncategorized"}: ${tag.value ?? ""}`;
}

/** Build unique key from segments (normalized for comparison). */
export function getTagKey(
  parent: string | undefined,
  category: string,
  value: string
): string {
  const p = (parent ?? "").trim().toLowerCase();
  const c = category.trim().toLowerCase();
  const v = value.trim().toLowerCase();
  if (!c || !v) return "";
  return p ? `${p}|${c}|${v}` : `${c}|${v}`;
}
