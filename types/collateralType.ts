/**
 * Collateral type definitions — structure, guidelines, and output targets.
 * Used by Workbench at generation time to drive the input wizard and AI generation.
 */

export const OUTPUT_TARGET_TYPES = [
  "print-pdf",
  "web-html",
  "social-image",
  "email-html",
  "cowork-package",
] as const;

export type OutputTargetType = (typeof OUTPUT_TARGET_TYPES)[number];

export interface OutputTargetDef {
  targetType: OutputTargetType;
  briefOptionIds: string[];
  layoutNotes: string;
}

export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "toggle",
] as const;

export type CollateralFieldType = (typeof FIELD_TYPES)[number];

/** Stored as JSON in collateralSection.fields — same shape as Policy FieldDef with order. */
export interface FieldDef {
  id: string;
  label: string;
  fieldType: CollateralFieldType;
  helperText: string;
  placeholder: string;
  options: string[];
  required: boolean;
  order: number;
}

export const MEDIA_TYPES = ["image", "video", "document"] as const;

export type CollateralMediaType = (typeof MEDIA_TYPES)[number];

export interface CollateralType {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  aiIntent: string;
  outputTargets: string; // JSON array of OutputTargetDef
  isDefault: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CollateralSection {
  id: string;
  collateralTypeId: string;
  name: string;
  description: string;
  contentGuidelines: string;
  fields: string; // JSON array of FieldDef
  order: number;
}

export interface CollateralGlobalField {
  id: string;
  collateralTypeId: string;
  label: string;
  fieldType: CollateralFieldType;
  helperText: string;
  placeholder: string;
  options: string; // JSON array of strings
  required: boolean;
  order: number;
}

export interface CollateralMediaField {
  id: string;
  collateralTypeId: string;
  label: string;
  description: string;
  mediaType: CollateralMediaType;
  required: boolean;
  maxCount: number;
  order: number;
}

export type CollateralTabId =
  | "identity"
  | "sections"
  | "fields"
  | "media"
  | "output-targets"
  | "audience";
