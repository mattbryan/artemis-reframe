/**
 * Brand & Philosophy types — match InstantDB schema.
 * Used as the data layer for Brand Context Block (future generation phase).
 */

export type BrandTabId = "identity" | "voice" | "visual" | "audience";

export type BrandScreenshotMemoryType = "identity" | "voice" | "visual" | "audience";

export interface Brand {
  id: string;
  name: string;
  legalName: string;
  tagline: string;
  marketPositionStatement: string;
  geographicMarkets: string;
  assetClassFocus: string;
  essenceStatement: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ToneDimension {
  axis: string;
  label1: string;
  label2: string;
  value: number;
}

export interface BrandVoice {
  id: string;
  brandId: string;
  toneDimensions: string;
  vocabularyPreferred: string;
  vocabularyAvoided: string;
  jargonStandards: string;
  sentenceRhythm: string;
  examplePairs: string;
}

export interface ColorIntent {
  hex: string;
  name: string;
  intent: string;
}

export interface BrandVisual {
  id: string;
  brandId: string;
  logoUsageNotes: string;
  colorIntents: string;
  typographyIntent: string;
  layoutPersonality: string;
}

export interface BrandScreenshot {
  id: string;
  brandId: string;
  url: string;
  caption: string;
  memoryType: BrandScreenshotMemoryType;
  order: number;
}

export type BrandLogoContext = "light" | "dark";

export interface BrandLogo {
  id: string;
  brandId: string;
  url: string;
  context: BrandLogoContext;
  order: number;
}

export interface ExamplePair {
  label: string;
  onBrand: string;
  offBrand: string;
}

export interface BrandPersona {
  id: string;
  brandId: string;
  name: string;
  personaType: string;
  priorities: string;
  resonantLanguage: string;
  avoidedLanguage: string;
  dealContexts: string;
  order: number;
}

export type SavingState = "idle" | "saving" | "saved" | "error";
