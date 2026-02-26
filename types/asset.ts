/**
 * Base Asset interface shared by ExemplaryAsset, ElementalAsset, and ProprietaryDoc.
 * Maps to InstantDB entities via the type field — each concrete type is its own entity.
 */

export interface BaseAsset {
  id: string;
  type: "exemplary" | "elemental" | "proprietary";
  tags: string[];
  schema_version: string;
  created_at: string; // ISO 8601
  metadata: Record<string, unknown>;
}

export interface ExemplaryAsset extends BaseAsset {
  type: "exemplary";
  title: string;
  description?: string;
  url?: string;
}

export type ElementalAssetType =
  | "photography"
  | "illustrations"
  | "icons"
  | "other-design-elements";

export interface ElementalAsset extends BaseAsset {
  type: "elemental";
  title: string;
  assetType: ElementalAssetType | "photo" | "illustration" | "design-element"; // legacy values supported
  url?: string;
}

export interface ProprietaryDoc extends BaseAsset {
  type: "proprietary";
  title: string;
  content?: string;
}
