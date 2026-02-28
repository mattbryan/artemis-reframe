"use client";

import { ImagePlaceholder, isImageField } from "./ImagePlaceholder";
import { colors } from "./previewStyles";

interface PreviewPropertySummaryProps {
  fields: Record<string, string>;
  narrative: string;
}

export function PreviewPropertySummary({
  fields,
  narrative,
}: PreviewPropertySummaryProps) {
  const entries = Object.entries(fields).filter(
    ([k]) => k.toLowerCase() !== "narrative"
  );
  const imageEntries = entries.filter(([k]) => isImageField(k));
  const textEntries = entries.filter(([k]) => !isImageField(k));

  return (
    <section
      className="border-b p-6 last:border-b-0"
      style={{ backgroundColor: colors.white, color: colors.deepNavy }}
    >
      <h2
        className="mb-4 text-lg font-semibold"
        style={{
          fontFamily: "Georgia, serif",
          borderBottom: `2px solid ${colors.grey200}`,
          paddingBottom: 8,
        }}
      >
        Property Summary
      </h2>
      {imageEntries.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-4">
          {imageEntries.map(([key, value]) => (
            <ImagePlaceholder key={key} label={value || key} className="w-40" />
          ))}
        </div>
      )}
      <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        {textEntries.map(([key, value]) => (
          <p key={key}>
            <span className="font-medium text-[#1a3a5c]">{key}: </span>
            {value}
          </p>
        ))}
      </div>
      {narrative && (
        <p className="mt-4 text-sm leading-relaxed" style={{ color: colors.midNavy }}>
          {narrative}
        </p>
      )}
    </section>
  );
}
