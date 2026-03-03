/**
 * Flatten section fields to displayable key-value pairs so objects are never
 * rendered as React children. Nested objects become multiple rows.
 */
export function flattenFields(
  fields: Record<string, string | unknown>
): Array<{ key: string; value: string }> {
  const out: Array<{ key: string; value: string }> = [];
  for (const [key, v] of Object.entries(fields)) {
    if (v == null) continue;
    if (typeof v === "string") {
      if (v.trim() !== "") out.push({ key, value: v });
      continue;
    }
    if (typeof v === "number" || typeof v === "boolean") {
      out.push({ key, value: String(v) });
      continue;
    }
    if (typeof v === "object" && !Array.isArray(v)) {
      for (const [subKey, subVal] of Object.entries(v as Record<string, unknown>)) {
        const display =
          subVal != null && typeof subVal === "object"
            ? JSON.stringify(subVal)
            : String(subVal ?? "");
        if (display.trim() !== "")
          out.push({ key: `${key} — ${subKey}`, value: display });
      }
      continue;
    }
    if (Array.isArray(v)) {
      out.push({
        key,
        value: v
          .map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x)))
          .join(", "),
      });
    }
  }
  return out;
}
