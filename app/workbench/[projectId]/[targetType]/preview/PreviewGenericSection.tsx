"use client";

import { ImagePlaceholder, isImageField } from "./ImagePlaceholder";
import { flattenFields } from "./previewFieldUtils";
import { colors } from "./previewStyles";

interface PreviewGenericSectionProps {
  sectionName: string;
  fields: Record<string, string>;
  narrative: string;
}

function camelToTitle(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function PreviewGenericSection({
  sectionName,
  fields,
  narrative,
}: PreviewGenericSectionProps) {
  const rawEntries = Object.entries(fields).filter(
    ([k]) => k.toLowerCase() !== "narrative"
  );
  const imageEntries = rawEntries.filter(([k]) => isImageField(k));
  const textFields = Object.fromEntries(
    rawEntries.filter(([k]) => !isImageField(k))
  );
  const textEntries = flattenFields(
    textFields as Record<string, string | unknown>
  );

  return (
    <section
      className="border-b p-6 last:border-b-0"
      style={{ backgroundColor: colors.white, color: colors.deepNavy }}
    >
      <h2
        className="mb-4 border-b pb-2 text-lg font-semibold"
        style={{
          borderColor: colors.grey200,
          color: colors.deepNavy,
          fontFamily: "Georgia, serif",
        }}
      >
        {sectionName}
      </h2>
      <div className="space-y-3">
        {imageEntries.map(([key, value]) => (
          <ImagePlaceholder
            key={key}
            label={typeof value === "string" ? value : key}
          />
        ))}
        {textEntries.map(({ key, value }) => (
          <div key={key}>
            <span className="text-xs font-medium opacity-70">
              {camelToTitle(key)}:{" "}
            </span>
            <span className="text-sm">{value}</span>
          </div>
        ))}
      </div>
      {narrative && (
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: colors.midNavy, fontFamily: "system-ui, sans-serif" }}
        >
          {narrative}
        </p>
      )}
    </section>
  );
}
