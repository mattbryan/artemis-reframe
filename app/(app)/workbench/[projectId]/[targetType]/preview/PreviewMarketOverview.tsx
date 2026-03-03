"use client";

import { ImagePlaceholder, isImageField } from "./ImagePlaceholder";
import { flattenFields } from "./previewFieldUtils";
import { colors } from "./previewStyles";

interface PreviewMarketOverviewProps {
  fields: Record<string, string>;
  narrative: string;
}

export function PreviewMarketOverview({
  fields,
  narrative,
}: PreviewMarketOverviewProps) {
  const rawEntries = Object.entries(fields).filter(
    ([k]) => k.toLowerCase() !== "narrative"
  );
  const imageEntries = rawEntries.filter(([k]) => isImageField(k));
  const textFields = Object.fromEntries(rawEntries.filter(([k]) => !isImageField(k)));
  const textEntries = flattenFields(textFields as Record<string, string | unknown>);

  return (
    <section
      className="border-b p-6 last:border-b-0"
      style={{ backgroundColor: colors.white, color: colors.deepNavy }}
    >
      <h2
        className="mb-4 text-lg font-semibold"
        style={{
          fontFamily: "Georgia, serif",
          borderLeft: `4px solid ${colors.accentBlue}`,
          paddingLeft: 12,
        }}
      >
        Market Overview
      </h2>
      {imageEntries.length > 0 && (
        <div className="mb-4 space-y-2">
          {imageEntries.map(([key, value]) => (
            <ImagePlaceholder
              key={key}
              label={typeof value === "string" ? value : key}
            />
          ))}
        </div>
      )}
      <div className="space-y-2 text-sm">
        {textEntries.map(({ key, value }) => (
          <p key={key}>
            <span className="font-medium opacity-80">{key}: </span>
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
