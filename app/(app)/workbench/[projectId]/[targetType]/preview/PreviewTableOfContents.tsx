"use client";

import { colors } from "./previewStyles";

interface PreviewTableOfContentsProps {
  fields: Record<string, string>;
  narrative: string;
}

export function PreviewTableOfContents({
  fields,
  narrative,
}: PreviewTableOfContentsProps) {
  const entries = Object.entries(fields).filter(
    ([_, v]) => v != null && String(v).trim() !== ""
  );

  return (
    <section
      className="border-b p-6 last:border-b-0"
      style={{ backgroundColor: colors.white, color: colors.deepNavy }}
    >
      <h2
        className="mb-4 text-lg font-semibold"
        style={{
          borderBottom: `2px solid ${colors.accentBlue}`,
          paddingBottom: 8,
          fontFamily: "Georgia, serif",
        }}
      >
        Table of Contents
      </h2>
      <ul className="space-y-2 text-sm">
        {entries.map(([key, value]) => (
          <li key={key} className="flex justify-between gap-4 border-b border-dotted border-[#e5e5e0] pb-1">
            <span>{value}</span>
          </li>
        ))}
      </ul>
      {narrative && (
        <p className="mt-4 text-sm leading-relaxed" style={{ color: colors.midNavy }}>
          {narrative}
        </p>
      )}
    </section>
  );
}
