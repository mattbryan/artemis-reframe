"use client";

import { ImagePlaceholder, isImageField } from "./ImagePlaceholder";
import { colors } from "./previewStyles";

interface PreviewTenantOverviewProps {
  fields: Record<string, string>;
  narrative: string;
}

export function PreviewTenantOverview({
  fields,
  narrative,
}: PreviewTenantOverviewProps) {
  const imageEntries = Object.entries(fields).filter(([k]) => isImageField(k));
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
        Tenant Overview
      </h2>
      {imageEntries.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-4">
          {imageEntries.map(([key, value]) => (
            <ImagePlaceholder key={key} label={value || key} className="w-32" />
          ))}
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
