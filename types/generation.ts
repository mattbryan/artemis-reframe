// SERVER AND CLIENT — safe to import anywhere (no server-only APIs used)

import type { OutputTargetType } from "./collateralType";

/** Structured output for one collateral section */
export interface GeneratedSection {
  sectionId: string;
  sectionName: string;
  fields: Record<string, string>; // fieldDefId → generated string value
  narrative: string; // AI-generated prose for this section
}

/** Elemental asset category recommended by the AI — resolved in Stage 3 */
export interface AssetRecommendation {
  category: string; // e.g. "photography", "illustrations"
  rationale: string;
  tags: string[]; // suggested tags to filter by in the asset library
}

/** PDF palette: role → hex. All values must be valid hex (e.g. #0a0d1a). Used by design agent and PDF renderer. */
export interface DesignSpecPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textInverse: string;
}

/** Typography for PDF: family names (Helvetica, Times-Roman, Courier supported by @react-pdf/renderer) and sizes in pt. */
export interface DesignSpecTypography {
  fontFamilyHeading: string;
  fontFamilyBody: string;
  fontFamilyCaption?: string; // optional, defaults to body
  headingFontSize: number;
  bodyFontSize: number;
  captionFontSize: number;
}

/** Layout options for PDF. Sizes in pt. */
export interface DesignSpecLayout {
  pagePadding: number;
  sectionSpacing: number;
  headerTreatment: "fullBleed" | "inline" | "minimal";
  coverPage: boolean;
  sectionDensity: "compact" | "balanced" | "airy";
}

/** Optional overrides for a specific section (e.g. background for financials). */
export interface DesignSpecSectionOverride {
  backgroundColor?: string;
}

/** Full design specification for PDF — concrete values (hex, numbers, enums) for reliable rendering. */
export interface DesignSpec {
  palette: DesignSpecPalette;
  typography: DesignSpecTypography;
  layout: DesignSpecLayout;
  sectionOverrides?: Record<string, DesignSpecSectionOverride>; // sectionId → overrides
}

/** Full structured output for one output target — stored in projectOutput.contentJson */
export interface GeneratedOutputContent {
  targetType: OutputTargetType;
  headline: string;
  subheadline: string;
  sections: GeneratedSection[];
  assetRecommendations: AssetRecommendation[];
  generationNotes: string; // AI self-commentary on brand alignment decisions
  /** Design specification for PDF; derived from brand + brief. Omitted in legacy content. */
  designSpec?: DesignSpec;
  /** Full brief (sections + screenshots) at generation time; used by PDF renderer for layout and design-reference page. */
  briefSnapshot?: BriefSnapshot;
}

/** Brand context assembled from InstantDB — passed to prompt builder */
export interface BrandContextBlock {
  brand: {
    name: string;
    legalName: string;
    tagline: string;
    marketPositionStatement: string;
    geographicMarkets: string;
    assetClassFocus: string;
    essenceStatement: string;
  };
  voice: {
    toneDimensions: string; // raw JSON string — passed as-is to prompt
    vocabularyPreferred: string;
    vocabularyAvoided: string;
    jargonStandards: string;
    sentenceRhythm: string;
    examplePairs: string; // raw JSON string — passed as-is to prompt
  };
  personas: Array<{
    name: string;
    personaType: string;
    priorities: string;
    resonantLanguage: string;
    avoidedLanguage: string;
    dealContexts: string;
  }>;
  visual?: {
    // only included for print-pdf and social-image targets
    logoUsageNotes: string;
    colorIntents: string; // raw JSON string
    typographyIntent: string;
    layoutPersonality: string;
  };
  policies: Array<{
    name: string;
    rule: string;
    priority: number;
  }>;
  exemplaryAssets: Array<{
    title: string;
    description: string;
  }>;
  proprietaryDocs: Array<{
    title: string;
    excerpt: string; // first 500 chars of content
  }>;
}

/** Collateral type context — structure and AI intent */
export interface CollateralContextBlock {
  name: string;
  description: string;
  category: string;
  aiIntent: string;
  sections: Array<{
    name: string;
    description: string;
    contentGuidelines: string;
    fields: Array<{
      label: string;
      fieldType: string;
      helperText: string;
      required: boolean;
    }>;
  }>;
}

/** Project inputs — human-readable labels mapped to user-entered values */
export interface ProjectInputBlock {
  projectName: string;
  formData: Record<string, string | boolean | number>; // label → value
  sectionData: Record<string, Record<string, string | boolean | number>>; // sectionName → fieldLabel → value
  images: Array<{
    filename: string;
    isHero: boolean;
    mediaFieldLabel: string;
  }>;
}

/** Reference screenshot in a design brief (for context and snapshot). */
export interface DesignBriefScreenshotRef {
  url: string;
  caption: string;
  sectionIds: string[];
}

/** Design brief context for one output target */
export interface DesignBriefContextBlock {
  name: string;
  description: string;
  usageGuidelines: string;
  targetAudience: string;
  sections: Array<{
    type: string;
    body: string;
  }>;
  /** Reference screenshots (url, caption, sectionIds); populated by assembleDesignBriefContext. */
  screenshots?: DesignBriefScreenshotRef[];
}

/** Snapshot of the design brief at generation time — stored in content so PDF pipeline has full context. */
export interface BriefSnapshot {
  name: string;
  description: string;
  usageGuidelines: string;
  targetAudience: string;
  sections: Array<{ type: string; body: string }>;
  screenshots?: DesignBriefScreenshotRef[];
}
