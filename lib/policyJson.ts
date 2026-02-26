/**
 * Safe parse for Policy & Rules JSON fields (policyTypeSchema.fields, policyRule.fieldValues).
 */

import type { FieldDef } from "@/types/policy";

export function parsePolicyFields(raw: string): FieldDef[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is FieldDef =>
        x != null &&
        typeof x === "object" &&
        typeof x.id === "string" &&
        typeof x.label === "string" &&
        (x.fieldType === "text" || x.fieldType === "textarea" || x.fieldType === "toggle") &&
        typeof x.helperText === "string" &&
        typeof x.required === "boolean" &&
        typeof x.order === "number"
    );
  } catch {
    return [];
  }
}

export function parseFieldValues(raw: string): Record<string, string | boolean> {
  try {
    const parsed = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object") return {};
    const out: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k !== "string") continue;
      if (typeof v === "string" || typeof v === "boolean") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}
