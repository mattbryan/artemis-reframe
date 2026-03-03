"use client";

import { ImagePlaceholder, isImageField } from "./ImagePlaceholder";
import { colors } from "./previewStyles";

interface PreviewExclusivelyListedByProps {
  fields: Record<string, string>;
  narrative: string;
}

export function PreviewExclusivelyListedBy({
  fields,
  narrative,
}: PreviewExclusivelyListedByProps) {
  const entries = Object.entries(fields).filter(
    ([k]) => !isImageField(k) && k.toLowerCase() !== "narrative"
  );
  const imageEntry = Object.entries(fields).find(([k]) => isImageField(k));

  return (
    <section
      className="border-b p-6 last:border-b-0"
      style={{ backgroundColor: colors.white, color: colors.deepNavy }}
    >
      <div
        className="mb-4 flex items-center gap-3 border-b pb-3"
        style={{ borderColor: colors.accentBlue }}
      >
        <div
          className="h-1 w-12 shrink-0"
          style={{ backgroundColor: colors.accentBlue }}
        />
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Exclusively Listed By
        </h2>
      </div>
      {imageEntry && (
        <div className="mb-4">
          <ImagePlaceholder
            label={imageEntry[1] || imageEntry[0]}
            className="max-w-[200px]"
          />
        </div>
      )}
      <div className="space-y-2 text-sm">
        {entries.map(([key, value]) => (
          <p key={key}>
            <span className="font-medium opacity-80">{key}: </span>
            {value}
          </p>
        ))}
      </div>
      {narrative && (
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: colors.midNavy }}
        >
          {narrative}
        </p>
      )}
    </section>
  );
}
