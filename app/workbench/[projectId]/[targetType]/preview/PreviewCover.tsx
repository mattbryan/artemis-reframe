"use client";

import { ImagePlaceholder, isImageField } from "./ImagePlaceholder";
import { colors } from "./previewStyles";

interface PreviewCoverProps {
  fields: Record<string, string>;
  narrative: string;
}

function get(fields: Record<string, string>, key: string): string {
  return fields[key] ?? "";
}

export function PreviewCover({ fields, narrative }: PreviewCoverProps) {
  const tenantName = get(fields, "tenantName") || "Property Name";
  const propertyAddress = get(fields, "propertyAddress") || "";
  const listPrice = get(fields, "listPrice") || "";
  const capRate = get(fields, "capRate") || "";
  const leaseType = get(fields, "leaseType") || "";
  const buildingSize = get(fields, "buildingSize") || "";
  const imageField = Object.entries(fields).find(([k]) => isImageField(k));
  const imageLabel = imageField ? imageField[1] || imageField[0] : "Cover image";
  const matthewsWordmark = get(fields, "matthewsWordmark") || "Matthews™";

  return (
    <section
      className="flex min-h-[320px] flex-col md:flex-row"
      style={{ color: colors.white }}
    >
      <div
        className="flex flex-1 flex-col justify-between p-8 md:w-[40%]"
        style={{ backgroundColor: colors.deepNavy }}
      >
        <div>
          <h1
            className="text-2xl font-semibold leading-tight md:text-3xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {tenantName}
          </h1>
          {propertyAddress && (
            <p className="mt-2 text-sm opacity-90">{propertyAddress}</p>
          )}
        </div>
        <div className="mt-6 space-y-1 text-sm">
          {(listPrice || capRate || leaseType) && (
            <p>
              {[listPrice, capRate, leaseType].filter(Boolean).join(" · ")}
            </p>
          )}
          {buildingSize && <p>{buildingSize}</p>}
        </div>
        <p className="mt-4 text-xs opacity-80">{matthewsWordmark}</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-4 md:w-[60%]">
        <ImagePlaceholder label={imageLabel} className="h-full min-h-[200px] w-full" />
      </div>
      {narrative && (
        <div
          className="w-full border-t p-4 text-sm"
          style={{ backgroundColor: colors.grey100, color: colors.deepNavy }}
        >
          <p style={{ fontFamily: "system-ui, sans-serif" }}>{narrative}</p>
        </div>
      )}
    </section>
  );
}
