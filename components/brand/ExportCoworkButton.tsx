"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { buildBrandCoworkPackage } from "@/lib/buildCoworkPackage";
import { useBrand } from "@/lib/hooks/useBrand";
import { usePolicies } from "@/lib/hooks/usePolicies";
import { useCollateralTypes } from "@/lib/hooks/useCollateralTypes";
import { db } from "@/lib/db";
import { parseOutputTargets } from "@/lib/collateralTypeUtils";

export function ExportCoworkButton() {
  const [loading, setLoading] = useState(false);
  const { brand, voice, visual, screenshots: brandScreenshots, logos: brandLogos, personas } = useBrand();
  const { rules } = usePolicies();
  const { data: collateralTypes } = useCollateralTypes();

  const { data: briefsData } = db.useQuery({
    brief: {
      meta: {},
      screenshots: {},
    },
  });

  const policies = useMemo(() => {
    return rules
      .filter((r) => r.isActive)
      .map((r) => ({
        title: r.name,
        body: (() => {
          try {
            const obj = typeof r.fieldValues === "string" ? JSON.parse(r.fieldValues) : r.fieldValues;
            if (obj && typeof obj === "object")
              return Object.entries(obj)
                .map(([k, v]) => `${k}: ${v}`)
                .join("\n");
          } catch {
            // ignore
          }
          return String(r.fieldValues ?? "");
        })(),
      }));
  }, [rules]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const resolveUrl = async (path: string | undefined, fallback: string): Promise<string> => {
        if (!path) return fallback;
        try {
          const url = await db.storage.getDownloadUrl(path);
          return url ?? fallback;
        } catch {
          return fallback;
        }
      };

      const philosophy = brand?.essenceStatement ?? "";
      const voiceText = voice
        ? [
            voice.toneDimensions && voice.toneDimensions !== "[]" ? `Tone: ${voice.toneDimensions}` : "",
            voice.vocabularyPreferred ? `Preferred: ${voice.vocabularyPreferred}` : "",
            voice.vocabularyAvoided ? `Avoid: ${voice.vocabularyAvoided}` : "",
            voice.jargonStandards ? `Jargon: ${voice.jargonStandards}` : "",
            voice.sentenceRhythm ? `Rhythm: ${voice.sentenceRhythm}` : "",
            voice.examplePairs && voice.examplePairs !== "[]" ? `Examples: ${voice.examplePairs}` : "",
          ]
            .filter(Boolean)
            .join("\n")
        : "";
      const visualText = visual
        ? [
            visual.logoUsageNotes ? `Logos: ${visual.logoUsageNotes}` : "",
            visual.colorIntents && visual.colorIntents !== "[]" ? `Colors: ${visual.colorIntents}` : "",
            visual.typographyIntent ? `Typography: ${visual.typographyIntent}` : "",
            visual.layoutPersonality ? `Layout: ${visual.layoutPersonality}` : "",
          ]
            .filter(Boolean)
            .join("\n")
        : "";
      const personasText = personas
        .map(
          (p) =>
            `${p.name} (${p.personaType}): ${p.priorities || ""} ${p.resonantLanguage || ""} ${p.avoidedLanguage || ""}`
        )
        .filter(Boolean)
        .join("\n\n");

      const brandScreenshotUrls = await Promise.all(
        brandScreenshots.map((s) =>
          s.url?.startsWith("http") ? s.url : resolveUrl(s.url, s.url)
        )
      );

      const rows = briefsData?.brief ?? [];
      const briefList = Array.isArray(rows) ? rows : Object.values(rows);
      const briefsWithScreenshots = (briefList as Record<string, unknown>[]).map((b) => {
        const screenshots = (b.screenshots ?? []) as Array<{ url?: string; storagePath?: string }>;
        return {
          id: String(b.id),
          name: String(b.name ?? ""),
          description: String(b.description ?? ""),
          guidelines: String(b.usageGuidelines ?? ""),
          audience: (b.meta as { targetAudience?: string } | undefined)?.targetAudience ?? "",
          screenshots,
        };
      });

      const briefs = await Promise.all(
        briefsWithScreenshots.map(async (b) => {
          const screenshotUrls = await Promise.all(
            b.screenshots.map((s) =>
              s.url?.startsWith("http") ? s.url : resolveUrl(s.storagePath ?? s.url, s.url ?? "")
            )
          );
          return {
            name: b.name,
            description: b.description,
            guidelines: b.guidelines,
            audience: b.audience,
            screenshotUrls,
          };
        })
      );

      const collateralTypesList = (collateralTypes ?? []).map((ct) => ({
        name: ct.name,
        description: ct.description,
        targets: parseOutputTargets(ct.outputTargets).map((t) => t.targetType),
      }));

      await buildBrandCoworkPackage({
        brand:
          philosophy || voiceText || visualText || personasText
            ? {
                philosophy: philosophy || undefined,
                voice: voiceText || undefined,
                visual: visualText || undefined,
                personas: personasText || undefined,
              }
            : null,
        brandScreenshotUrls,
        brandLogos: brandLogos.map((l) => ({ url: l.url, context: l.context })),
        policies,
        briefs,
        collateralTypes: collateralTypesList,
        generatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [
    brand,
    voice,
    visual,
    personas,
    brandScreenshots,
    brandLogos,
    briefsData,
    rules,
    collateralTypes,
    policies,
  ]);

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export Cowork Package
    </Button>
  );
}
