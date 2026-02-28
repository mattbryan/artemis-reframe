/**
 * Design brief utilities: slugify, default brief resolution, etc.
 */

/**
 * Converts a name to a URL-safe slug (lowercase, hyphens, no leading/trailing hyphens).
 */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "brief";
}

/**
 * Ensures a slug is unique among existing slugs by appending -2, -3, etc. if needed.
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  const set = new Set(existingSlugs.map((s) => s.toLowerCase()));
  let candidate = baseSlug;
  let n = 2;
  while (set.has(candidate.toLowerCase())) {
    candidate = `${baseSlug}-${n}`;
    n += 1;
  }
  return candidate;
}

/**
 * Returns the brief that has isDefault === true, or undefined.
 */
export function getDefaultBrief<T extends { isDefault?: boolean }>(briefs: T[]): T | undefined {
  return briefs.find((b) => b.isDefault === true);
}

/**
 * Human-readable label for a brief's collateral types (for list/header display).
 * Uses collateralTypeIds + type list when available; falls back to legacy collateralType string.
 */
export function formatBriefCollateralTypes(
  brief: { collateralTypeIds?: string[]; collateralType?: string },
  types: { id: string; name: string }[]
): string {
  const ids = brief.collateralTypeIds;
  if (Array.isArray(ids) && ids.length > 0 && types.length > 0) {
    const names = ids
      .map((id) => types.find((t) => t.id === id)?.name)
      .filter(Boolean) as string[];
    if (names.length > 0) return names.join(", ");
  }
  return (brief.collateralType ?? "").trim() || "—";
}

export const BRIEF_SECTION_TYPES = [
  "tokens",
  "component-spec",
  "layout-ref",
  "principles",
  "prompt",
  "custom",
] as const;

export type BriefSectionTypeLabel = (typeof BRIEF_SECTION_TYPES)[number];
