"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Check, FileText, Palette, BookOpen, Shield, FolderOpen, Image } from "lucide-react";
import { buildProjectCoworkPackage, type ProjectCoworkInput } from "@/lib/buildCoworkPackage";
import { useBrand } from "@/lib/hooks/useBrand";
import { usePolicies } from "@/lib/hooks/usePolicies";
import { useCollateralType } from "@/lib/hooks/useCollateralType";
import { db } from "@/lib/db";
import type { Project, ProjectOutput } from "@/types/project";

interface CoworkPackageViewProps {
  project: Project;
  output: ProjectOutput;
}

function useBriefById(briefId: string | null) {
  const query = useMemo(() => {
    if (!briefId) return null;
    return {
      brief: {
        $: { where: { id: briefId } },
        sections: { $: { order: { order: "asc" as const } } },
        screenshots: { $: { order: { order: "asc" as const } } },
        meta: {},
      },
    };
  }, [briefId]);
  const { data } = db.useQuery(query);
  return useMemo(() => {
    if (!briefId || !data?.brief) return null;
    const rows = data.brief;
    const row = Array.isArray(rows) ? rows[0] : (rows as Record<string, unknown>)[briefId] ?? Object.values(rows as object)[0];
    if (!row || typeof row !== "object") return null;
    const r = row as Record<string, unknown>;
    const sectionsRaw = (r.sections ?? []) as Array<Record<string, unknown>>;
    const screenshotsRaw = (r.screenshots ?? []) as Array<Record<string, unknown>>;
    const metaRow = Array.isArray(r.meta) ? (r.meta as unknown[])[0] : r.meta;
    const meta = metaRow as Record<string, unknown> | undefined;
    return {
      name: String(r.name ?? ""),
      description: String(r.description ?? ""),
      guidelines: String(r.usageGuidelines ?? ""),
      audience: meta ? String(meta.targetAudience ?? "") : "",
      sections: sectionsRaw
        .sort((a, b) => (Number(a.order) ?? 0) - (Number(b.order) ?? 0))
        .map((s) => ({
          title: String(s.type ?? "Section"),
          content: String(s.body ?? ""),
        })),
      screenshots: screenshotsRaw
        .sort((a, b) => (Number(a.order) ?? 0) - (Number(b.order) ?? 0))
        .map((s) => ({ url: String(s.url ?? ""), storagePath: s.storagePath != null ? String(s.storagePath) : undefined })),
    };
  }, [briefId, data]);
}

export function CoworkPackageView({ project, output }: CoworkPackageViewProps) {
  const [assembling, setAssembling] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const { brand, voice, visual, screenshots: brandScreenshots, logos: brandLogos, personas } = useBrand();
  const { rules } = usePolicies();
  const { type: collateralType, linkedPersonaIds } = useCollateralType(project.collateralTypeSlug || null);
  const briefData = useBriefById(output.briefId || null);

  const policies = useMemo(() => {
    return rules
      .filter((r) => r.isActive)
      .map((r) => ({
        title: r.name,
        body: (() => {
          try {
            const obj = typeof r.fieldValues === "string" ? JSON.parse(r.fieldValues) : r.fieldValues;
            if (obj && typeof obj === "object") return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join("\n");
          } catch {
            // ignore
          }
          return String(r.fieldValues ?? "");
        })(),
      }));
  }, [rules]);

  const handleDownload = useCallback(async () => {
    setAssembling(true);
    setSuccessToast(false);
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

      const brandScreenshotUrls = await Promise.all(
        brandScreenshots.map((s) =>
          s.url?.startsWith("http")
            ? s.url
            : resolveUrl(s.url, s.url)
        )
      );
      const briefScreenshotUrls = briefData?.screenshots
        ? await Promise.all(
            briefData.screenshots.map((s) =>
              resolveUrl(s.storagePath, s.url)
            )
          )
        : [];
      const projectImageUrls = await Promise.all(
        project.images.map((img) =>
          resolveUrl(img.storagePath, img.url)
        )
      );

      const philosophy =
        brand?.essenceStatement ?? "";
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

      const projectFormData: Record<string, string> = {
        ...Object.fromEntries(
          Object.entries(project.formData).map(([k, v]) => [k, String(v ?? "")])
        ),
      };
      for (const [sectionId, fields] of Object.entries(project.sectionData ?? {})) {
        for (const [fieldId, value] of Object.entries(fields ?? {})) {
          projectFormData[`${sectionId}.${fieldId}`] = String(value ?? "");
        }
      }

      const input: ProjectCoworkInput = {
        projectName: project.name,
        collateralTypeName: collateralType?.name ?? project.collateralTypeSlug ?? "",
        targetType: output.targetType,
        brand:
          philosophy || voiceText || visualText || personasText
            ? { philosophy: philosophy || undefined, voice: voiceText || undefined, visual: visualText || undefined, personas: personasText || undefined }
            : null,
        brandScreenshotUrls,
        brandLogos: brandLogos.map((l) => ({ url: l.url, context: l.context })),
        policies,
        brief: briefData
          ? {
              name: briefData.name,
              description: briefData.description,
              guidelines: briefData.guidelines,
              audience: briefData.audience,
              sections: briefData.sections,
            }
          : null,
        briefScreenshotUrls,
        collateralTypeDef: collateralType
          ? {
              description: collateralType.description,
              aiIntent: collateralType.aiIntent,
              sections: collateralType.sections?.map((s) => ({
                name: s.name,
                guidelines: s.contentGuidelines,
              })) ?? undefined,
            }
          : null,
        projectFormData,
        projectImages: project.images.map((img, i) => ({
          label: img.filename || `Image ${i + 1}`,
          url: projectImageUrls[i] ?? img.url,
        })),
        generatedAt: new Date().toISOString(),
        selectedPersonaIds: linkedPersonaIds.length > 0 ? linkedPersonaIds : undefined,
        brandPersonas: personas.map((p) => ({
          id: p.id,
          name: p.name,
          personaType: p.personaType,
          priorities: p.priorities,
          resonantLanguage: p.resonantLanguage,
          avoidedLanguage: p.avoidedLanguage,
        })),
      };

      await buildProjectCoworkPackage(input);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } finally {
      setAssembling(false);
    }
  }, [
    project,
    output,
    brand,
    voice,
    visual,
    personas,
    linkedPersonaIds,
    brandScreenshots,
    brandLogos,
    briefData,
    rules,
    collateralType,
    policies,
  ]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-foreground">Cowork Package</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Download a portable context package for use with Claude.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              { icon: Palette, label: "Brand guidelines and reference screenshots" },
              { icon: BookOpen, label: "Design brief and reference images" },
              { icon: FileText, label: "Collateral type definition and target specs" },
              { icon: Shield, label: "Policy rules and constraints" },
              { icon: FolderOpen, label: "Project form data" },
              { icon: Image, label: "Project reference images" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                {label}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-2">
            <Button
              onClick={handleDownload}
              disabled={assembling}
              className="w-full"
            >
              {assembling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assembling package…
                </>
              ) : successToast ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Downloaded
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Package
                </>
              )}
            </Button>
            {successToast && (
              <p className="text-center text-xs text-muted-foreground">
                Package downloaded. Check your downloads folder.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
