/**
 * Collateral type utilities: slugify, JSON parsing, unique slug.
 */

import {
  slugify as briefSlugify,
  ensureUniqueSlug as briefEnsureUniqueSlug,
} from "@/lib/briefUtils";
import type { OutputTargetDef, FieldDef } from "@/types/collateralType";
import { OUTPUT_TARGET_TYPES } from "@/types/collateralType";

export const slugify = briefSlugify;
export const ensureUniqueSlug = briefEnsureUniqueSlug;

const VALID_FIELD_TYPES = new Set([
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "toggle",
]);

/** Safe parse of collateralType.outputTargets JSON. Returns empty array on invalid. */
export function parseOutputTargets(raw: string): OutputTargetDef[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is OutputTargetDef =>
        x != null &&
        typeof x === "object" &&
        OUTPUT_TARGET_TYPES.includes(x.targetType) &&
        (x.defaultBriefId === null || typeof x.defaultBriefId === "string") &&
        typeof x.layoutNotes === "string"
    );
  } catch {
    return [];
  }
}

/** Safe parse of collateralSection.fields JSON. Returns empty array on invalid. */
export function parseSectionFields(raw: string): FieldDef[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is FieldDef =>
        x != null &&
        typeof x === "object" &&
        typeof x.id === "string" &&
        typeof x.label === "string" &&
        VALID_FIELD_TYPES.has(x.fieldType) &&
        typeof x.helperText === "string" &&
        typeof x.placeholder === "string" &&
        Array.isArray(x.options) &&
        x.options.every((o: unknown) => typeof o === "string") &&
        typeof x.required === "boolean" &&
        typeof x.order === "number"
    );
  } catch {
    return [];
  }
}

/** Safe parse of collateralGlobalField.options JSON. Returns empty array on invalid. */
export function parseOptions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((o): o is string => typeof o === "string");
  } catch {
    return [];
  }
}

export const OUTPUT_TARGET_LABELS: Record<string, string> = {
  "print-pdf": "Print PDF",
  "web-html": "Web Page",
  "social-image": "Social",
  "email-html": "Email",
};

/** Human-readable label for generation log and progress UI (spec: Print PDF, Web HTML, etc.). */
export function formatTargetType(targetType: string): string {
  const map: Record<string, string> = {
    "print-pdf": "Print PDF",
    "web-html": "Web HTML",
    "social-image": "Social Image",
    "email-html": "Email HTML",
  };
  return map[targetType] ?? targetType;
}

export const OUTPUT_TARGET_BADGE_CLASS: Record<string, string> = {
  "print-pdf": "bg-slate-700 text-slate-100 dark:bg-slate-600 dark:text-slate-100",
  "web-html": "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  "social-image": "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  "email-html": "bg-green-500/20 text-green-700 dark:text-green-400",
};
