"use client";

import { flattenFields } from "./previewFieldUtils";
import { colors } from "./previewStyles";

interface PreviewFinancialSummaryProps {
  fields: Record<string, string>;
  narrative: string;
}

export function PreviewFinancialSummary({
  fields,
  narrative,
}: PreviewFinancialSummaryProps) {
  const entries = flattenFields(fields as Record<string, string | unknown>);

  return (
    <section
      className="border-b p-6 last:border-b-0"
      style={{ backgroundColor: colors.white, color: colors.deepNavy }}
    >
      <h2
        className="mb-4 text-lg font-semibold"
        style={{
          fontFamily: "Georgia, serif",
          color: colors.deepNavy,
        }}
      >
        Financial Summary
      </h2>
      <div
        className="rounded-md border p-4"
        style={{ borderColor: colors.grey200, backgroundColor: colors.grey100 }}
      >
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {entries.map(({ key, value }) => (
            <div key={key} className="flex justify-between gap-4">
              <span className="font-medium opacity-80">{key}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>
      {narrative && (
        <p className="mt-4 text-sm leading-relaxed" style={{ color: colors.midNavy }}>
          {narrative}
        </p>
      )}
    </section>
  );
}
