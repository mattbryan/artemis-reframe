/**
 * Client-side Cowork Package ZIP assembly.
 * No server required — all data is passed in from the calling component.
 */

import JSZip from "jszip";

export type ProjectCoworkInput = {
  projectName: string;
  collateralTypeName: string;
  targetType: string;
  brand: { philosophy?: string; voice?: string; visual?: string; personas?: string } | null;
  brandScreenshotUrls: string[];
  brandLogos: Array<{ url: string; context: "light" | "dark" }>;
  policies: Array<{ title: string; body: string }>;
  brief: {
    name: string;
    description?: string;
    guidelines?: string;
    audience?: string;
    sections?: Array<{ title: string; content: string }>;
  } | null;
  briefScreenshotUrls: string[];
  collateralTypeDef: {
    description?: string;
    aiIntent?: string;
    sections?: Array<{ name: string; guidelines?: string }>;
  } | null;
  projectFormData: Record<string, string>;
  projectImages: Array<{ label: string; url: string }>;
  generatedAt: string;
  /** When set and non-empty, only these personas are included in the package; otherwise all personas. */
  selectedPersonaIds?: string[];
  /** Full list of brand personas; used with selectedPersonaIds to build filtered personas section. */
  brandPersonas?: Array<{
    id: string;
    name: string;
    personaType: string;
    priorities: string;
    resonantLanguage: string;
    avoidedLanguage: string;
  }>;
};

export type BrandCoworkInput = {
  brand: { philosophy?: string; voice?: string; visual?: string; personas?: string } | null;
  brandScreenshotUrls: string[];
  brandLogos: Array<{ url: string; context: "light" | "dark" }>;
  policies: Array<{ title: string; body: string }>;
  briefs: Array<{
    name: string;
    description?: string;
    guidelines?: string;
    audience?: string;
    screenshotUrls: string[];
  }>;
  collateralTypes: Array<{ name: string; description?: string; targets: string[] }>;
  generatedAt: string;
  /** When set and non-empty, only these personas are included; empty/omit = all personas. */
  selectedPersonaIds?: string[];
};

function safeSlug(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "export";
}

function dateSegment(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function formatPersonasForContext(
  input: Pick<ProjectCoworkInput, "brand" | "selectedPersonaIds" | "brandPersonas">
): string {
  const { brandPersonas, selectedPersonaIds } = input;
  if (
    brandPersonas &&
    selectedPersonaIds &&
    selectedPersonaIds.length > 0
  ) {
    const set = new Set(selectedPersonaIds);
    const filtered = brandPersonas.filter((p) => set.has(p.id));
    return filtered
      .map(
        (p) =>
          `${p.name} (${p.personaType}): ${p.priorities || ""} ${p.resonantLanguage || ""} ${p.avoidedLanguage || ""}`
      )
      .filter(Boolean)
      .join("\n\n");
  }
  return input.brand?.personas ?? "";
}

/** Fetch image: blob URLs client-side only (no proxy); storage URLs via server proxy to avoid CORS. */
async function fetchImageBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    if (url.startsWith("blob:")) {
      const res = await fetch(url);
      return res.ok ? await res.arrayBuffer() : null;
    }
    const proxied = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxied);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

const GENERATION_RULES_BLOCK = [
  "## Generation Rules",
  "",
  "These rules apply to all content created from this package:",
  "",
  "### PDF Output",
  "- Default orientation is **Landscape** unless the project information explicitly requests portrait.",
  "- Do not overlap text layers under any circumstances. If a layout feels too dense, reduce content, increase spacing, or break into additional pages — do not stack or z-index text elements.",
  "- Avoid dynamic or fluid layout techniques that risk text collision. Prefer fixed, grid-based layouts with explicit positioning.",
  "",
  "### General",
  "- Treat the Brand Guidelines, Design Brief, and Policy Rules sections as hard constraints, not suggestions.",
  "- Treat the Project Information section as the specific brief for this generation run.",
  "- When in doubt about tone or visual direction, defer to the Design Brief over general brand guidelines.",
  "",
  "---",
  "",
];

function buildProjectContextMd(input: ProjectCoworkInput): string {
  const date = dateSegment(input.generatedAt);
  const lines: string[] = [
    "# Brand & Project Context",
    `${input.projectName}`,
    `Collateral Type: ${input.collateralTypeName} | Target: ${input.targetType} | Date: ${date}`,
    "",
    "---",
    "",
    ...GENERATION_RULES_BLOCK,
    "## Brand Philosophy",
    "_Use this to establish voice, tone, and visual boundaries. These are non-negotiable constraints._",
    "",
    input.brand?.philosophy ?? "Not configured",
    "",
    "## Brand Voice & Tone",
    input.brand?.voice ?? "",
    "",
    "## Visual Identity",
    input.brand?.visual ?? "",
    "",
    "## Brand Personas",
    formatPersonasForContext(input),
    "",
    "## Brand Logos",
    "Logo files are included in brand/logos/. Light background variants: " +
      String(input.brandLogos.filter((l) => l.context === "light").length) +
      ". Dark background variants: " +
      String(input.brandLogos.filter((l) => l.context === "dark").length) +
      ".",
    "Use the appropriate variant based on the background of the layout being created.",
    "",
    "---",
    "",
  ];

  if (input.brief) {
    lines.push(`## Design Brief: ${input.brief.name}`, "");
    lines.push("_Use this as the primary creative direction for this output. It overrides general brand defaults where they conflict._", "");
    lines.push("**Description:**", input.brief.description ?? "", "");
    lines.push("**Target Audience:**", input.brief.audience ?? "", "");
    lines.push("**Guidelines:**", input.brief.guidelines ?? "", "");
    lines.push("### Brief Sections", "");
    for (const s of input.brief.sections ?? []) {
      lines.push(`### ${s.title}`, s.content, "");
    }
    lines.push("---", "");
  }

  lines.push("## Collateral Type: " + input.collateralTypeName, "");
  lines.push("_Use this to understand the structural requirements and intended purpose of the asset being created._", "");
  lines.push("**Description:**", input.collateralTypeDef?.description ?? "", "");
  lines.push("**AI Intent:**", input.collateralTypeDef?.aiIntent ?? "", "");
  lines.push("### Output Sections", "");
  for (const s of input.collateralTypeDef?.sections ?? []) {
    lines.push(`- **${s.name}**:`, s.guidelines ?? "", "");
  }
  lines.push("---", "");
  lines.push("## Policies & Rules", "");
  lines.push("_These are hard rules. Do not violate them regardless of other instructions._", "");
  for (const p of input.policies) {
    lines.push(`### ${p.title}`, p.body, "");
  }
  lines.push("## Project Information", "");
  lines.push("_This is the specific input for this generation run — the \"brief\" in the traditional sense._", "");
  for (const [key, value] of Object.entries(input.projectFormData)) {
    lines.push(`${key}: ${value}`);
  }
  lines.push("", "### Section Inputs", "");
  lines.push("(See Project Information above for form and section data.)", "");
  lines.push("---", "");
  lines.push("## Reference Images", "");
  lines.push("Images are included in the images/ subdirectories alongside this file.");
  lines.push("Brand screenshots: brand/screenshots/");
  lines.push("Brand logos: brand/logos/");
  lines.push("Brief screenshots: design-brief/screenshots/");
  lines.push("Project images: project/images/");
  return lines.join("\n");
}

function buildBrandContextMd(input: BrandCoworkInput): string {
  const date = dateSegment(input.generatedAt);
  const lines: string[] = [
    "# Brand & Project Context",
    "Brand Export",
    `Date: ${date}`,
    "",
    "---",
    "",
    ...GENERATION_RULES_BLOCK,
    "## Brand Philosophy",
    "_Use this to establish voice, tone, and visual boundaries. These are non-negotiable constraints._",
    "",
    input.brand?.philosophy ?? "Not configured",
    "",
    "## Brand Voice & Tone",
    input.brand?.voice ?? "",
    "",
    "## Visual Identity",
    input.brand?.visual ?? "",
    "",
    "## Brand Personas",
    input.brand?.personas ?? "",
    "",
    "## Brand Logos",
    "Logo files are included in brand/logos/. Light background variants: " +
      String(input.brandLogos.filter((l) => l.context === "light").length) +
      ". Dark background variants: " +
      String(input.brandLogos.filter((l) => l.context === "dark").length) +
      ".",
    "Use the appropriate variant based on the background of the layout being created.",
    "",
    "---",
    "",
  ];

  for (const b of input.briefs) {
    lines.push(`## Design Brief: ${b.name}`, "");
    lines.push("_Use this as the primary creative direction for this output. It overrides general brand defaults where they conflict._", "");
    lines.push("**Description:**", b.description ?? "", "");
    lines.push("**Target Audience:**", b.audience ?? "", "");
    lines.push("**Guidelines:**", b.guidelines ?? "", "");
    lines.push("", "---", "");
  }

  lines.push("## Collateral Types", "");
  lines.push("_Use this to understand the structural requirements and intended purpose of the asset being created._", "");
  for (const ct of input.collateralTypes) {
    lines.push(`- **${ct.name}**: ${ct.description ?? ""} (targets: ${(ct.targets ?? []).join(", ")})`, "");
  }
  lines.push("---", "");
  lines.push("## Policies & Rules", "");
  lines.push("_These are hard rules. Do not violate them regardless of other instructions._", "");
  for (const p of input.policies) {
    lines.push(`### ${p.title}`, p.body, "");
  }
  lines.push("", "---", "");
  lines.push("## Reference Images", "");
  lines.push("Brand screenshots: brand/screenshots/");
  lines.push("Brand logos: brand/logos/");
  lines.push("Brief screenshots: design-brief/screenshots/ (per brief)");
  return lines.join("\n");
}

function buildReadmeMd(name: string, date: string): string {
  return `# Cowork Package — ${name}
Generated: ${date}

## How to use with Claude

1. Start a new Claude Project at claude.ai
2. Upload this entire package (or the context.md file plus the images/ folders)
3. In your first message, tell Claude:
   "I've uploaded a Cowork Package from Artemis Reframe. Use the context.md as 
   your brand and project brief. I'd like you to help me create [describe what you need]."

### PDF generation
When creating PDFs, default to **landscape orientation** unless the project information
specifies portrait. Avoid overlapping text — use fixed grid layouts and add pages
rather than compressing content.

## What's included
- context.md — Master context document (start here)
- brand/ — Brand guidelines and reference screenshots
- design-brief/ — Design brief and reference images  
- collateral-type/ — Collateral type definition and target specs
- policies/ — Policy rules and constraints
- project/ — Project form data and reference images (project packages only)
`;
}

/** Add images to zip; filenames 0001.jpg, 0002.jpg, ...; skip failed fetches. */
async function addImagesToZip(
  zip: JSZip,
  folderPath: string,
  urls: string[]
): Promise<void> {
  for (let i = 0; i < urls.length; i++) {
    const buf = await fetchImageBuffer(urls[i]);
    if (buf) {
      const num = String(i + 1).padStart(4, "0");
      zip.file(`${folderPath}/${num}.jpg`, buf);
    }
  }
}

const LOGO_CONTEXT_LABEL: Record<"light" | "dark", string> = {
  light: "Light backgrounds",
  dark: "Dark backgrounds",
};

/** Add brand logos to zip: brand/logos/ with logo-{context}-0001.png and index.md. */
async function addLogosToZip(
  zip: JSZip,
  folderPath: string,
  brandLogos: Array<{ url: string; context: "light" | "dark" }>
): Promise<void> {
  const indexLines: string[] = [];
  const counters: Record<"light" | "dark", number> = { light: 0, dark: 0 };
  for (const logo of brandLogos) {
    const buf = await fetchImageBuffer(logo.url);
    if (!buf) continue;
    counters[logo.context]++;
    const num = String(counters[logo.context]).padStart(4, "0");
    const filename = `logo-${logo.context}-${num}.png`;
    zip.file(`${folderPath}/${filename}`, buf);
    indexLines.push(`${filename} — ${LOGO_CONTEXT_LABEL[logo.context]}`);
  }
  if (indexLines.length > 0) {
    zip.file(`${folderPath}/index.md`, indexLines.join("\n"));
  }
}

export async function buildProjectCoworkPackage(input: ProjectCoworkInput): Promise<void> {
  const zip = new JSZip();
  const date = dateSegment(input.generatedAt);
  const name = safeSlug(input.projectName);
  const root = `cowork-${name}-${date}`;

  const contextMd = buildProjectContextMd(input);
  zip.file(`${root}/context.md`, contextMd);
  zip.file(
    `${root}/README.md`,
    buildReadmeMd(input.projectName, new Date(input.generatedAt).toLocaleDateString(undefined, { dateStyle: "medium" }))
  );

  const brandPhilosophy = [
    "## Philosophy",
    input.brand?.philosophy ?? "Not configured",
    "",
    "## Voice & Tone",
    input.brand?.voice ?? "",
    "",
    "## Visual",
    input.brand?.visual ?? "",
    "",
    "## Personas",
    formatPersonasForContext(input),
  ].join("\n");
  zip.file(`${root}/brand/guidelines.md`, brandPhilosophy);

  if (input.brief) {
    const briefMd = [
      `# ${input.brief.name}`,
      "",
      "**Description:**",
      input.brief.description ?? "",
      "",
      "**Audience:**",
      input.brief.audience ?? "",
      "",
      "**Guidelines:**",
      input.brief.guidelines ?? "",
      "",
      "## Sections",
      ...(input.brief.sections ?? []).map((s) => `### ${s.title}\n\n${s.content}`),
    ].join("\n\n");
    zip.file(`${root}/design-brief/brief.md`, briefMd);
  }

  const collateralMd = [
    `# ${input.collateralTypeName}`,
    "",
    "**Description:**",
    input.collateralTypeDef?.description ?? "",
    "",
    "**AI Intent:**",
    input.collateralTypeDef?.aiIntent ?? "",
    "",
    "## Sections",
    ...(input.collateralTypeDef?.sections ?? []).map(
      (s) => `### ${s.name}\n\n${s.guidelines ?? ""}`
    ),
  ].join("\n\n");
  zip.file(`${root}/collateral-type/definition.md`, collateralMd);

  const rulesMd = input.policies
    .map((p) => `## ${p.title}\n\n${p.body}`)
    .join("\n\n");
  zip.file(`${root}/policies/rules.md`, rulesMd);

  const projectInfoMd = [
    "# Project Information",
    "",
    ...Object.entries(input.projectFormData).map(([k, v]) => `${k}: ${v}`),
  ].join("\n");
  zip.file(`${root}/project/project-info.md`, projectInfoMd);

  await addImagesToZip(zip, `${root}/brand/screenshots`, input.brandScreenshotUrls);
  await addLogosToZip(zip, `${root}/brand/logos`, input.brandLogos);
  await addImagesToZip(zip, `${root}/design-brief/screenshots`, input.briefScreenshotUrls);
  const projectImageUrls = input.projectImages.map((i) => i.url);
  await addImagesToZip(zip, `${root}/project/images`, projectImageUrls);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cowork-${name}-${date}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function buildBrandCoworkPackage(input: BrandCoworkInput): Promise<void> {
  const zip = new JSZip();
  const date = dateSegment(input.generatedAt);
  const name = "brand-export";
  const root = `cowork-${name}-${date}`;

  const contextMd = buildBrandContextMd(input);
  zip.file(`${root}/context.md`, contextMd);
  zip.file(
    `${root}/README.md`,
    buildReadmeMd("Brand Export", new Date(input.generatedAt).toLocaleDateString(undefined, { dateStyle: "medium" }))
  );

  const brandPhilosophy = [
    "## Philosophy",
    input.brand?.philosophy ?? "Not configured",
    "",
    "## Voice & Tone",
    input.brand?.voice ?? "",
    "",
    "## Visual",
    input.brand?.visual ?? "",
    "",
    "## Personas",
    input.brand?.personas ?? "",
  ].join("\n");
  zip.file(`${root}/brand/guidelines.md`, brandPhilosophy);

  const allBriefScreenshotUrls: string[] = [];
  const briefParts: string[] = [];
  for (let i = 0; i < input.briefs.length; i++) {
    const b = input.briefs[i];
    briefParts.push(
      [
        `# ${b.name}`,
        "",
        "**Description:**",
        b.description ?? "",
        "",
        "**Audience:**",
        b.audience ?? "",
        "",
        "**Guidelines:**",
        b.guidelines ?? "",
      ].join("\n")
    );
    if (b.screenshotUrls?.length) allBriefScreenshotUrls.push(...b.screenshotUrls);
  }
  zip.file(`${root}/design-brief/brief.md`, briefParts.join("\n\n---\n\n"));
  await addImagesToZip(zip, `${root}/design-brief/screenshots`, allBriefScreenshotUrls);

  const collateralMd = input.collateralTypes
    .map(
      (ct) =>
        `## ${ct.name}\n\n${ct.description ?? ""}\n\nTargets: ${(ct.targets ?? []).join(", ")}`
    )
    .join("\n\n");
  zip.file(`${root}/collateral-type/definition.md`, collateralMd);

  const rulesMd = input.policies
    .map((p) => `## ${p.title}\n\n${p.body}`)
    .join("\n\n");
  zip.file(`${root}/policies/rules.md`, rulesMd);

  await addImagesToZip(zip, `${root}/brand/screenshots`, input.brandScreenshotUrls);
  await addLogosToZip(zip, `${root}/brand/logos`, input.brandLogos);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cowork-${name}-${date}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
