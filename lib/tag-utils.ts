/**
 * Tag parsing and normalization for Category: Value and Parent/Category: Value.
 */

import { getTagKey } from "@/types/tag";
import type { Tag } from "@/types/tag";

export type ParsedTagInput = {
  parent?: string;
  category: string;
  values: string[];
};

/**
 * Parse full string into segments. "Category: Value" or "Parent/Category: Value1,Value2".
 * Returns one parent/category and one or more values (each value becomes a separate tag).
 */
export function parseTagInput(input: string): ParsedTagInput | null {
  const trimmed = input.trim();
  const colonIdx = trimmed.indexOf(":");
  if (colonIdx === -1) return null;

  const afterColon = trimmed.slice(colonIdx + 1).trim();
  const values = afterColon
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (values.length === 0) return null;

  const beforeColon = trimmed.slice(0, colonIdx).trim();
  if (!beforeColon) return null;

  const slashIdx = beforeColon.indexOf("/");
  let parent: string | undefined;
  let category: string;

  if (slashIdx !== -1 && slashIdx < beforeColon.length - 1) {
    const parts = beforeColon.split("/").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      parent = parts[0];
      category = parts.slice(1).join("/");
    } else {
      category = parts[0] ?? beforeColon;
    }
  } else {
    category = beforeColon;
  }

  return { parent, category, values };
}

/**
 * Expand parsed input into one tag spec per value.
 */
export function parsedToTagSpecs(parsed: ParsedTagInput): { parent?: string; category: string; value: string; key: string }[] {
  return parsed.values.map((value) => {
    const key = getTagKey(parsed.parent, parsed.category, value);
    return {
      parent: parsed.parent,
      category: parsed.category,
      value,
      key,
    };
  });
}

/** Segment being edited: "parent" | "category" | "value" */
export type TagInputSegment = "parent" | "category" | "value";

export type TagInputState = {
  segment: TagInputSegment;
  parent: string;
  category: string;
  value: string;
  prefix: string; // current token being typed (for filtering suggestions)
};

/**
 * Parse the current input and cursor position into which segment we're in
 * and what prefix to use for filtering suggestions.
 */
export function getTagInputState(input: string, cursorPosition: number): TagInputState {
  const beforeCursor = input.slice(0, cursorPosition);
  const colonIdx = beforeCursor.indexOf(":");
  const hasColon = colonIdx !== -1;

  if (!hasColon) {
    const slashIdx = beforeCursor.indexOf("/");
    if (slashIdx !== -1) {
      const afterSlash = beforeCursor.slice(slashIdx + 1).trim();
      return {
        segment: "category",
        parent: beforeCursor.slice(0, slashIdx).trim(),
        category: "",
        value: "",
        prefix: afterSlash,
      };
    }
    return {
      segment: "parent",
      parent: "",
      category: "",
      value: "",
      prefix: beforeCursor.trim(),
    };
  }

  const beforeColon = input.slice(0, colonIdx);
  const afterColon = beforeCursor.slice(colonIdx + 1).trim();
  const slashIdx = beforeColon.indexOf("/");

  if (slashIdx !== -1) {
    return {
      segment: "value",
      parent: beforeColon.slice(0, slashIdx).trim(),
      category: beforeColon.slice(slashIdx + 1).trim(),
      value: "",
      prefix: afterColon.split(",").pop()?.trim() ?? "",
    };
  }
  return {
    segment: "value",
    parent: "",
    category: beforeColon.trim(),
    value: "",
    prefix: afterColon.split(",").pop()?.trim() ?? "",
  };
}

/** Collect unique parents from tags (excluding empty). */
export function getUniqueParents(tags: Tag[]): string[] {
  const set = new Set<string>();
  for (const t of tags) {
    if (t.parent?.trim()) set.add(t.parent.trim());
  }
  return Array.from(set).sort();
}

/** Collect unique categories, optionally filtered by parent. */
export function getUniqueCategories(tags: Tag[], parent?: string): string[] {
  const set = new Set<string>();
  for (const t of tags) {
    if (!t.category) continue;
    if (parent != null && (t.parent ?? "") !== parent) continue;
    set.add(t.category.trim());
  }
  return Array.from(set).sort();
}

/** Collect unique values, optionally filtered by parent and category. */
export function getUniqueValues(
  tags: Tag[],
  parent?: string,
  category?: string
): string[] {
  const set = new Set<string>();
  for (const t of tags) {
    if (!t.value) continue;
    if (parent != null && (t.parent ?? "") !== parent) continue;
    if (category != null && (t.category ?? "") !== category) continue;
    set.add(t.value.trim());
  }
  return Array.from(set).sort();
}

/** Get suggestions for the current segment (filtered by prefix). */
export function getSuggestions(
  tags: Tag[],
  state: TagInputState
): string[] {
  const lower = state.prefix.toLowerCase();
  if (state.segment === "parent") {
    const parents = getUniqueParents(tags).filter((p) =>
      p.toLowerCase().startsWith(lower)
    );
    const categories = getUniqueCategories(tags).filter((c) =>
      c.toLowerCase().startsWith(lower)
    );
    return Array.from(new Set([...parents, ...categories])).sort();
  }
  if (state.segment === "category") {
    return getUniqueCategories(tags, state.parent || undefined).filter((c) =>
      c.toLowerCase().startsWith(lower)
    );
  }
  return getUniqueValues(
    tags,
    state.parent || undefined,
    state.category || undefined
  ).filter((v) => v.toLowerCase().startsWith(lower));
}
