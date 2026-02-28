"use client";

import { ImagePlaceholder, isImageField } from "./ImagePlaceholder";
import { colors } from "./previewStyles";

interface PreviewInvestmentHighlightsProps {
  fields: Record<string, string>;
  narrative: string;
}

export function PreviewInvestmentHighlights({
  fields,
  narrative,
}: PreviewInvestmentHighlightsProps) {
  const bulletKeys = Object.keys(fields)
    .filter((k) => /bullet|highlight|point/i.test(k))
    .sort();
  const otherEntries = Object.entries(fields).filter(
    ([k]) => !bulletKeys.includes(k) && !isImageField(k)
  );
  const imageEntry = Object.entries(fields).find(([k]) => isImageField(k));

  return (
    <section
      className="border-b p-6 last:border-b-0"
      style={{ backgroundColor: colors.white, color: colors.deepNavy }}
    >
      <h2
        className="mb-4 text-lg font-semibold"
        style={{
          color: colors.deepNavy,
          fontFamily: "Georgia, serif",
          borderLeft: `4px solid ${colors.accentBlue}`,
          paddingLeft: 12,
        }}
      >
        Investment Highlights
      </h2>
      {imageEntry && (
        <div className="mb-4">
          <ImagePlaceholder label={imageEntry[1] || imageEntry[0]} />
        </div>
      )}
      <div className="space-y-2 text-sm">
        {otherEntries.map(([key, value]) => (
          <p key={key}>
            <span className="font-medium">{key}: </span>
            {value}
          </p>
        ))}
        {bulletKeys.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {bulletKeys.map((key) => (
              <li key={key}>{fields[key]}</li>
            ))}
          </ul>
        )}
      </div>
      {narrative && (
        <p className="mt-4 text-sm leading-relaxed" style={{ color: colors.midNavy }}>
          {narrative}
        </p>
      )}
    </section>
  );
}
