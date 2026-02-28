// SERVER ONLY — do not import in client components or pages

import { adminDb } from "@/lib/instantAdmin";
import type {
  BrandContextBlock,
  CollateralContextBlock,
  ProjectInputBlock,
  DesignBriefContextBlock,
} from "@/types/generation";
import type { OutputTargetType } from "@/types/collateralType";
import type { FieldDef } from "@/types/collateralType";
import type { Project } from "@/types/project";
import type {
  CollateralType,
  CollateralSection,
  CollateralGlobalField,
  CollateralMediaField,
} from "@/types/collateralType";

/** Coerce unknown query result values to string for type safety. */
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Turn policy rule fieldValues JSON into human-readable rule text. */
function safeParseFieldValues(fieldValuesJson: string): string {
  try {
    const obj = JSON.parse(fieldValuesJson ?? "{}");
    if (typeof obj !== "object" || obj === null) return String(fieldValuesJson ?? "");
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  } catch {
    return fieldValuesJson ?? "";
  }
}

/**
 * Assemble brand context for prompt building. Includes visual block only for
 * print-pdf and social-image targets.
 */
export async function assembleBrandContext(
  targetType: OutputTargetType
): Promise<BrandContextBlock> {
  const result = await adminDb.query({
    brand: {
      $: { where: { isActive: true } },
      voice: {},
      visual: {},
      personas: {},
      screenshots: {},
      logos: {},
    },
  });

  const brandRow = result.brand?.[0];
  if (!brandRow) throw new Error("No active brand found");

  const voiceRaw = brandRow.voice;
  const voice = Array.isArray(voiceRaw) ? voiceRaw[0] : voiceRaw;
  const visualRaw = brandRow.visual;
  const visual = Array.isArray(visualRaw) ? visualRaw[0] : visualRaw;
  const personasRaw = brandRow.personas ?? [];
  const personas = Array.isArray(personasRaw) ? personasRaw : Object.values(personasRaw);

  const policyResult = await adminDb.query({
    policyRule: { $: { where: { isActive: true } } },
    policyTypeSchema: {},
  });

  const policyRules = Array.isArray(policyResult.policyRule)
    ? policyResult.policyRule
    : Object.values(policyResult.policyRule ?? {});
  const policies = (policyRules as Array<{ name: unknown; fieldValues: unknown }>)
    .map((rule) => ({
      name: str(rule.name),
      rule: safeParseFieldValues(str(rule.fieldValues)),
      priority: 0,
    }))
    .sort((a, b) => a.priority - b.priority);

  const exemplaryResult = await adminDb.query({
    exemplaryAssets: {},
  });
  const exemplaryList = Array.isArray(exemplaryResult.exemplaryAssets)
    ? exemplaryResult.exemplaryAssets
    : Object.values(exemplaryResult.exemplaryAssets ?? {});
  const exemplaryAssets = (exemplaryList as Array<{ title?: unknown; description?: unknown }>)
    .slice(0, 5)
    .map((a) => ({ title: str(a.title), description: str(a.description) }));

  const docsResult = await adminDb.query({
    proprietaryDocs: {},
  });
  const docsList = Array.isArray(docsResult.proprietaryDocs)
    ? docsResult.proprietaryDocs
    : Object.values(docsResult.proprietaryDocs ?? {});
  const proprietaryDocs = (docsList as Array<{ title?: unknown; content?: unknown }>).map((d) => ({
    title: str(d.title),
    excerpt: str(d.content).slice(0, 500),
  }));

  const isVisualTarget = targetType === "print-pdf" || targetType === "social-image";

  const row = brandRow as Record<string, unknown>;
  const voiceObj = voice as Record<string, unknown> | undefined;
  const visualObj = visual as Record<string, unknown> | undefined;
  return {
    brand: {
      name: str(row.name),
      legalName: str(row.legalName),
      tagline: str(row.tagline),
      marketPositionStatement: str(row.marketPositionStatement),
      geographicMarkets: str(row.geographicMarkets),
      assetClassFocus: str(row.assetClassFocus),
      essenceStatement: str(row.essenceStatement),
    },
    voice: voiceObj
      ? {
          toneDimensions: str(voiceObj.toneDimensions) || "[]",
          vocabularyPreferred: str(voiceObj.vocabularyPreferred),
          vocabularyAvoided: str(voiceObj.vocabularyAvoided),
          jargonStandards: str(voiceObj.jargonStandards),
          sentenceRhythm: str(voiceObj.sentenceRhythm),
          examplePairs: str(voiceObj.examplePairs) || "[]",
        }
      : {
          toneDimensions: "[]",
          vocabularyPreferred: "",
          vocabularyAvoided: "",
          jargonStandards: "",
          sentenceRhythm: "",
          examplePairs: "[]",
        },
    personas: (personas as Array<Record<string, unknown>>).map((p) => ({
      name: str(p.name),
      personaType: str(p.personaType),
      priorities: str(p.priorities),
      resonantLanguage: str(p.resonantLanguage),
      avoidedLanguage: str(p.avoidedLanguage),
      dealContexts: str(p.dealContexts),
    })),
    visual:
      isVisualTarget && visualObj
        ? {
            logoUsageNotes: str(visualObj.logoUsageNotes),
            colorIntents: str(visualObj.colorIntents) || "[]",
            typographyIntent: str(visualObj.typographyIntent),
            layoutPersonality: str(visualObj.layoutPersonality),
          }
        : undefined,
    policies,
    exemplaryAssets,
    proprietaryDocs,
  };
}

/**
 * Assemble collateral type context (structure and AI intent) for one collateral type.
 */
export async function assembleCollateralContext(
  collateralTypeId: string
): Promise<CollateralContextBlock> {
  const ctResult = await adminDb.query({
    collateralType: {
      $: { where: { id: collateralTypeId } },
      sections: {},
      globalFields: {},
    },
  });

  const ct = ctResult.collateralType?.[0];
  if (!ct) throw new Error(`Collateral type not found: ${collateralTypeId}`);

  const ctRecord = ct as Record<string, unknown>;
  const sectionsRaw = ctRecord.sections ?? [];
  const sectionsList = Array.isArray(sectionsRaw) ? sectionsRaw : Object.values(sectionsRaw);

  const sections = (sectionsList as Array<Record<string, unknown>>)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map((section) => {
      let fields: FieldDef[] = [];
      try {
        fields = JSON.parse(str(section.fields) || "[]");
      } catch {
        fields = [];
      }
      const fieldList = Array.isArray(fields) ? fields : [];
      return {
        name: str(section.name),
        description: str(section.description),
        contentGuidelines: str(section.contentGuidelines),
        fields: fieldList
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((f) => ({
            label: f.label,
            fieldType: f.fieldType,
            helperText: f.helperText ?? "",
            required: Boolean(f.required),
          })),
      };
    });

  return {
    name: str(ctRecord.name),
    description: str(ctRecord.description),
    category: str(ctRecord.category),
    aiIntent: str(ctRecord.aiIntent),
    sections,
  };
}

/**
 * Assemble project inputs with human-readable labels (from collateral type).
 */
export async function assembleProjectInput(
  project: Project,
  collateralType: CollateralType & {
    globalFields: CollateralGlobalField[];
    sections: CollateralSection[];
    mediaFields: CollateralMediaField[];
  }
): Promise<ProjectInputBlock> {
  const globalFieldMap = new Map(
    (collateralType.globalFields ?? []).map((f) => [f.id, f.label])
  );
  const formData: Record<string, string | boolean | number> = {};
  for (const [fieldId, value] of Object.entries(project.formData ?? {})) {
    const label = globalFieldMap.get(fieldId) ?? fieldId;
    formData[label] = value;
  }

  const sectionData: Record<string, Record<string, string | boolean | number>> = {};
  const sectionsList = collateralType.sections ?? [];
  for (const section of sectionsList) {
    let fieldDefs: FieldDef[] = [];
    try {
      fieldDefs = JSON.parse(section.fields ?? "[]");
    } catch {
      fieldDefs = [];
    }
    const fieldMap = new Map(
      (Array.isArray(fieldDefs) ? fieldDefs : []).map((f) => [f.id, f.label])
    );
    const sectionValues = project.sectionData?.[section.id] ?? {};
    const resolvedSection: Record<string, string | boolean | number> = {};
    for (const [fieldId, value] of Object.entries(sectionValues)) {
      const label = fieldMap.get(fieldId) ?? fieldId;
      resolvedSection[label] = value;
    }
    if (Object.keys(resolvedSection).length > 0) {
      sectionData[section.name] = resolvedSection;
    }
  }

  const mediaFieldMap = new Map(
    (collateralType.mediaFields ?? []).map((f) => [f.id, f.label])
  );
  const images = (project.images ?? []).map((img) => ({
    filename: img.filename,
    isHero: img.isHero,
    mediaFieldLabel: mediaFieldMap.get(img.mediaFieldId) ?? "Image",
  }));

  return {
    projectName: project.name,
    formData,
    sectionData,
    images,
  };
}

/**
 * Assemble design brief context for one output target.
 */
export async function assembleDesignBriefContext(
  briefId: string
): Promise<DesignBriefContextBlock> {
  const briefResult = await adminDb.query({
    brief: {
      $: { where: { id: briefId } },
      sections: {},
      meta: {},
    },
  });

  const brief = briefResult.brief?.[0];
  if (!brief) throw new Error(`Brief not found: ${briefId}`);

  const briefRecord = brief as Record<string, unknown>;
  const sectionsRaw = briefRecord.sections ?? [];
  const sectionsList = Array.isArray(sectionsRaw) ? sectionsRaw : Object.values(sectionsRaw);
  const sections = (sectionsList as Array<Record<string, unknown>>)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map((s) => ({
      type: str(s.type) || "custom",
      body: str(s.body),
    }));

  const metaRaw = briefRecord.meta;
  const meta = Array.isArray(metaRaw) ? metaRaw[0] : metaRaw;
  const metaRecord = meta as Record<string, unknown> | undefined;

  return {
    name: str(briefRecord.name),
    description: str(briefRecord.description),
    usageGuidelines: str(briefRecord.usageGuidelines),
    targetAudience: metaRecord ? str(metaRecord.targetAudience) : "",
    sections,
  };
}
