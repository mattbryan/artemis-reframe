// SERVER ONLY — do not import in client components or pages

import type { BrandContextBlock } from "@/types/generation";
import type { CollateralContextBlock } from "@/types/generation";
import type { ProjectInputBlock } from "@/types/generation";
import type { DesignBriefContextBlock } from "@/types/generation";
import type { OutputTargetType } from "@/types/collateralType";

/** Human-readable label for output target type (for logs and prompts). */
export function formatTargetType(targetType: string): string {
  const labels: Record<string, string> = {
    "print-pdf": "Print PDF",
    "web-html": "Web HTML",
    "social-image": "Social Image",
    "email-html": "Email HTML",
  };
  return labels[targetType] ?? targetType;
}

/** Human-readable label for brief section type. */
export function formatSectionType(type: string): string {
  const labels: Record<string, string> = {
    tokens: "Design Tokens",
    "component-spec": "Component Specifications",
    "layout-ref": "Layout Reference",
    principles: "Design Principles",
    prompt: "AI Prompt Guidance",
    custom: "Notes",
  };
  return labels[type] ?? type;
}

/** Schema description injected into system prompt so the model returns valid JSON. */
function buildOutputSchema(): string {
  return `{
  "targetType": "string — the output target type (e.g. print-pdf)",
  "headline": "string — primary headline, brand voice, punchy",
  "subheadline": "string — supporting headline, expands on headline",
  "sections": [
    {
      "sectionId": "string — use the section name slugified (e.g. property-overview)",
      "sectionName": "string — human-readable section name",
      "fields": {
        "[fieldLabel]": "string — generated value for this field"
      },
      "narrative": "string — cohesive prose for this section, incorporating all field values"
    }
  ],
  "assetRecommendations": [
    {
      "category": "string — elemental asset category (photography, illustrations, icons, other-design-elements)",
      "rationale": "string — why this category is relevant to this collateral piece",
      "tags": ["string — suggested tags to filter by"]
    }
  ],
  "generationNotes": "string — brief self-commentary on key brand alignment decisions made",
  "designSpec": {
    "palette": {
      "primary": "string — hex e.g. #0a0d1a; MUST be an exact hex from brand COLOR INTENTS",
      "secondary": "string — hex from brand",
      "accent": "string — hex from brand",
      "background": "string — hex, page background",
      "surface": "string — hex, card/section surface",
      "text": "string — hex, body text",
      "textInverse": "string — hex, text on primary/dark (e.g. headers)"
    },
    "typography": {
      "fontFamilyHeading": "string — one of: Helvetica, Helvetica-Bold, Times-Roman, Times-Bold, Courier",
      "fontFamilyBody": "string — one of same set",
      "fontFamilyCaption": "string — optional, one of same set; omit to use body",
      "headingFontSize": "number — pt, e.g. 14",
      "bodyFontSize": "number — pt, e.g. 10",
      "captionFontSize": "number — pt, e.g. 9"
    },
    "layout": {
      "pagePadding": "number — pt, e.g. 40",
      "sectionSpacing": "number — pt, space between sections",
      "headerTreatment": "string — exactly one of: fullBleed, inline, minimal",
      "coverPage": "boolean — true to include a cover page",
      "sectionDensity": "string — exactly one of: compact, balanced, airy"
    },
    "sectionOverrides": "object — optional; keys are sectionId, values are { backgroundColor?: hex } for sections needing a different background (e.g. financials)"
  }
}

Generate one section object for each section defined in the collateral definition.
Match sectionName exactly to the section names provided.

For designSpec: when the target is print-pdf (or social-image), derive designSpec from the brand visual identity only. Use EXACT hex values from the brand COLOR INTENTS. For typography, choose only from the allowed font families. If no brand visual is provided, use a neutral professional default (e.g. dark primary, light background, Helvetica).`;
}

/**
 * Build the system prompt with brand identity, voice, personas, optional visual,
 * policies, exemplary references, proprietary context, collateral definition,
 * and strict JSON output instructions.
 */
export function buildSystemPrompt(
  brand: BrandContextBlock,
  collateral: CollateralContextBlock
): string {
  const parts: string[] = [];

  parts.push(`<brand_identity>
Brand: ${brand.brand.name} (${brand.brand.legalName})
Tagline: ${brand.brand.tagline}
Market Position: ${brand.brand.marketPositionStatement}
Geographic Markets: ${brand.brand.geographicMarkets}
Asset Class Focus: ${brand.brand.assetClassFocus}

ESSENCE STATEMENT — MOST IMPORTANT INSTRUCTION IN THIS SYSTEM:
${brand.brand.essenceStatement}

Follow the essence statement above all other guidance. When in doubt about any
content decision, return to the essence statement as your north star.
</brand_identity>`);

  parts.push(`<brand_voice>
PREFERRED VOCABULARY: ${brand.voice.vocabularyPreferred}
AVOIDED VOCABULARY: ${brand.voice.vocabularyAvoided}
JARGON STANDARDS: ${brand.voice.jargonStandards}
SENTENCE RHYTHM: ${brand.voice.sentenceRhythm}

TONE DIMENSIONS: ${brand.voice.toneDimensions}
(This is a JSON array of tone axes. Each axis has a label1/label2 pair and a
value 1-10 indicating where the brand sits. Use this to calibrate tone.)

EXAMPLE PAIRS: ${brand.voice.examplePairs}
(This is a JSON array of on-brand vs off-brand writing examples.
Study these carefully — they are the most concrete voice guidance available.)
</brand_voice>`);

  parts.push(`<target_personas>
${brand.personas
  .map(
    (p) => `PERSONA: ${p.name} (${p.personaType})
Priorities: ${p.priorities}
Resonant language: ${p.resonantLanguage}
Language to avoid: ${p.avoidedLanguage}
Deal contexts: ${p.dealContexts}`
  )
  .join("\n\n")}

Write primarily for these personas. Language that resonates with them takes
priority over generic clarity.
</target_personas>`);

  if (brand.visual) {
    parts.push(`<visual_identity>
LOGO USAGE: ${brand.visual.logoUsageNotes}
COLOR INTENTS: ${brand.visual.colorIntents}
(JSON array of {hex, name, intent} — use intent descriptions to guide color references in content)
TYPOGRAPHY INTENT: ${brand.visual.typographyIntent}
LAYOUT PERSONALITY: ${brand.visual.layoutPersonality}
</visual_identity>`);
  }

  if (brand.policies.length > 0) {
    parts.push(`<policies>
These are hard rules. Every rule must be followed. Output that violates any
rule must be corrected before delivery.

${brand.policies
  .sort((a, b) => a.priority - b.priority)
  .map((p) => `RULE: ${p.name}\n${p.rule}`)
  .join("\n\n")}
</policies>`);
  }

  if (brand.exemplaryAssets.length > 0) {
    parts.push(`<exemplary_references>
These are best-in-class examples for this brand. Use them to calibrate tone,
depth, and quality — not to copy content.

${brand.exemplaryAssets.map((a) => `- ${a.title}: ${a.description}`).join("\n")}
</exemplary_references>`);
  }

  if (brand.proprietaryDocs.length > 0) {
    parts.push(`<proprietary_context>
Use this internal research and perspective to inform claims, positioning,
and market intelligence. Do not fabricate statistics or claims not supported here.

${brand.proprietaryDocs.map((d) => `[${d.title}]\n${d.excerpt}`).join("\n\n")}
</proprietary_context>`);
  }

  const sectionsDescription = collateral.sections
    .map((section) => {
      const fieldList = section.fields
        .map((f) => `${f.label} (${f.fieldType}${f.required ? ", required" : ""})`)
        .join(", ");
      return `Section: ${section.name}
Description: ${section.description}
Content Guidelines: ${section.contentGuidelines}
Fields: ${fieldList}`;
    })
    .join("\n\n");

  parts.push(`<collateral_definition>
COLLATERAL TYPE: ${collateral.name}
DESCRIPTION: ${collateral.description}
CATEGORY: ${collateral.category}

AI INTENT (primary generation instruction):
${collateral.aiIntent}

SECTIONS TO GENERATE:
${sectionsDescription}
</collateral_definition>`);

  parts.push(`<output_instructions>
Return ONLY valid JSON. No markdown fences, no explanation, no preamble.
Your entire response must be parseable by JSON.parse().

Required output shape:
${buildOutputSchema()}
</output_instructions>`);

  return parts.join("\n\n");
}

/**
 * Build the user prompt with project inputs, design brief, and task instruction.
 */
export function buildUserPrompt(
  projectInput: ProjectInputBlock,
  brief: DesignBriefContextBlock,
  targetType: OutputTargetType
): string {
  const formLines = Object.entries(projectInput.formData)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

  const sectionLines = Object.entries(projectInput.sectionData)
    .map(([sectionName, fields]) => {
      const fieldLines = Object.entries(fields)
        .map(([fieldLabel, value]) => `${fieldLabel}: ${value}`)
        .join("\n");
      return `[${sectionName}]\n${fieldLines}`;
    })
    .join("\n\n");

  const imageLines =
    projectInput.images.length > 0
      ? projectInput.images
          .map(
            (img) =>
              `- ${img.mediaFieldLabel}: ${img.filename}${img.isHero ? " [HERO IMAGE — use as primary visual reference]" : ""}`
          )
          .join("\n")
      : "";

  const briefSectionLines = brief.sections
    .map((s) => `[${formatSectionType(s.type)}]\n${s.body}`)
    .join("\n\n");

  return `<project_inputs>
Project: ${projectInput.projectName}

${formLines}

${sectionLines}

${imageLines ? `IMAGES PROVIDED:\n${imageLines}` : ""}
</project_inputs>

<design_brief>
Brief: ${brief.name}
${brief.description}

Usage Guidelines: ${brief.usageGuidelines}
Target Audience: ${brief.targetAudience}

${briefSectionLines}
</design_brief>

<task>
Generate a complete ${formatTargetType(targetType)} for the project above.
Follow all brand guidelines, policies, and the design brief exactly.
${targetType === "print-pdf" ? "Include a designSpec derived from the brand visual identity (exact hex from brand colors, allowed fonts only). " : ""}
Return structured JSON matching the schema in your system prompt.
</task>`;
}

/**
 * Build user prompt for regenerating a single section.
 * Same context as buildUserPrompt but task asks for one section only.
 */
export function buildRegenerateSectionUserPrompt(
  projectInput: ProjectInputBlock,
  brief: DesignBriefContextBlock,
  targetType: OutputTargetType,
  sectionId: string,
  sectionName: string
): string {
  const formLines = Object.entries(projectInput.formData)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

  const sectionLines = Object.entries(projectInput.sectionData)
    .map(([secName, fields]) => {
      const fieldLines = Object.entries(fields)
        .map(([fieldLabel, value]) => `${fieldLabel}: ${value}`)
        .join("\n");
      return `[${secName}]\n${fieldLines}`;
    })
    .join("\n\n");

  const imageLines =
    projectInput.images.length > 0
      ? projectInput.images
          .map(
            (img) =>
              `- ${img.mediaFieldLabel}: ${img.filename}${img.isHero ? " [HERO IMAGE]" : ""}`
          )
          .join("\n")
      : "";

  const briefSectionLines = brief.sections
    .map((s) => `[${formatSectionType(s.type)}]\n${s.body}`)
    .join("\n\n");

  return `<project_inputs>
Project: ${projectInput.projectName}

${formLines}

${sectionLines}

${imageLines ? `IMAGES PROVIDED:\n${imageLines}` : ""}
</project_inputs>

<design_brief>
Brief: ${brief.name}
${brief.description}

Usage Guidelines: ${brief.usageGuidelines}
Target Audience: ${brief.targetAudience}

${briefSectionLines}
</design_brief>

<task>
Regenerate only the "${sectionName}" section (sectionId: "${sectionId}") for this ${formatTargetType(targetType)}.
Follow all brand guidelines, policies, and the design brief exactly.
Return a single JSON object with keys: sectionId, sectionName, fields (object of field labels to string values), narrative (string).
Use sectionId "${sectionId}" and sectionName "${sectionName}" exactly. No other text or markdown.
</task>`;
}
