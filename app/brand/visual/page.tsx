"use client";

import { useCallback } from "react";
import { useBrand } from "@/lib/hooks/useBrand";
import { useBrandStore } from "@/store/brandStore";
import { updateBrandVisual } from "@/lib/mutations/brand";
import { LogoUploadSection } from "@/components/brand/visual/LogoUploadSection";
import { ColorIntentSection } from "@/components/brand/visual/ColorIntentSection";
import { ScreenshotGrid } from "@/components/brand/visual/ScreenshotGrid";

const MAX_TEXTAREA = 10000;

export default function BrandVisualPage() {
  const { brand, visual, screenshots, logos, isLoading } = useBrand();
  const setSavingState = useBrandStore((s) => s.setSavingState);

  const handleSaveVisual = useCallback(
    async (
      visualId: string,
      updates: Parameters<typeof updateBrandVisual>[1]
    ) => {
      setSavingState("saving");
      try {
        await updateBrandVisual(visualId, updates);
        setSavingState("saved");
      } catch {
        setSavingState("error");
      }
    },
    [setSavingState]
  );

  if (isLoading || !brand) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  if (!visual) {
    return (
      <div className="text-muted-foreground">
        No visual profile found. Save the identity tab first.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-10">
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-foreground">
            Logo & Color
          </h2>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              Logo assets
            </label>
            <p className="text-xs text-muted-foreground">
              Upload SVG or PNG logos for use in generated collateral. Set whether each version is for light or dark contexts.
            </p>
            <LogoUploadSection
              brandId={brand.id}
              logos={logos}
              setSavingState={setSavingState}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="logo-usage"
              className="block text-sm font-medium text-foreground"
            >
              Logo Usage Notes
            </label>
            <p className="text-xs text-muted-foreground">
              Variant contexts, background color rules, clear space, what not to
              place near the logo
            </p>
            <textarea
              id="logo-usage"
              rows={4}
              maxLength={MAX_TEXTAREA}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={visual.logoUsageNotes}
              onBlur={(e) =>
                handleSaveVisual(visual.id, { logoUsageNotes: e.target.value })
              }
            />
          </div>
          <ColorIntentSection
            colorIntentsJson={visual.colorIntents}
            visualId={visual.id}
            onSave={handleSaveVisual}
          />
        </section>

        <section className="space-y-1">
          <h2 className="text-sm font-medium text-foreground">
            Typography Hierarchy Intent
          </h2>
          <p className="text-xs text-muted-foreground">
            Describe typography as purpose and hierarchy, not specs. e.g.
            &quot;H1 is always the property name — never use it for anything else. Body
            copy should feel dense but not crowded — always 14px minimum.&quot;
          </p>
          <textarea
            rows={4}
            maxLength={MAX_TEXTAREA}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue={visual.typographyIntent}
            onBlur={(e) =>
              handleSaveVisual(visual.id, { typographyIntent: e.target.value })
            }
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-foreground">
            Layout Personality & Reference Screenshots
          </h2>
          <div className="space-y-1">
            <label
              htmlFor="layout-personality"
              className="block text-sm font-medium text-foreground"
            >
              Layout Personality
            </label>
            <p className="text-xs text-muted-foreground">
              How does this brand use space? What signals quality — density or
              whitespace? How structured vs. organic?
            </p>
            <textarea
              id="layout-personality"
              rows={4}
              maxLength={MAX_TEXTAREA}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={visual.layoutPersonality}
              onBlur={(e) =>
                handleSaveVisual(visual.id, { layoutPersonality: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              Visual Reference Library
            </label>
            <p className="text-xs text-muted-foreground">
              Upload annotated screenshots from best-performing collateral. The
              caption is as important as the image — write it as an instruction,
              not a description.
            </p>
            <ScreenshotGrid
              brandId={brand.id}
              screenshots={screenshots}
              setSavingState={setSavingState}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
