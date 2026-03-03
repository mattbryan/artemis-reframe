"use client";

import { ImagePlaceholder, isImageField } from "./ImagePlaceholder";
import { colors } from "./previewStyles";

interface PreviewSitePlanProps {
  fields: Record<string, string>;
  narrative: string;
}

export function PreviewSitePlan({ fields, narrative }: PreviewSitePlanProps) {
  const imageEntry = Object.entries(fields).find(([k]) => isImageField(k));
  const textEntries = Object.entries(fields).filter(([k]) => !isImageField(k));

  return (
    <section
      className="border-b p-6 last:border-b-0"
      style={{ backgroundColor: colors.white, color: colors.deepNavy }}
    >
      <h2
        className="mb-4 text-lg font-semibold"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Site Plan
      </h2>
      {imageEntry && (
        <div className="mb-4">
          <ImagePlaceholder
            label={imageEntry[1] || imageEntry[0]}
            className="min-h-[200px] w-full"
          />
        </div>
      )}
      <div className="space-y-2 text-sm">
        {textEntries.map(([key, value]) => (
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
