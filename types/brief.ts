/**
 * Design Brief types — match InstantDB schema.
 * Used for collateral generation as the design source of truth.
 */

export type BriefStatus = "draft" | "active" | "archived";

export type BriefSectionType =
  | "tokens"
  | "component-spec"
  | "layout-ref"
  | "principles"
  | "prompt"
  | "custom";

export interface Brief {
  id: string;
  name: string;
  slug: string;
  description: string;
  usageGuidelines: string;
  /** @deprecated Prefer collateralTypeIds. */
  collateralType: string;
  /** IDs of collateral types this brief applies to. */
  collateralTypeIds?: string[];
  status: BriefStatus;
  createdAt: number;
  updatedAt: number;
  isDefault: boolean;
}

export interface BriefSection {
  id: string;
  briefId: string;
  type: BriefSectionType;
  body: string;
  order: number;
}

export interface BriefScreenshot {
  id: string;
  briefId: string;
  /** @deprecated Use sectionIds. Kept for backward compatibility. */
  sectionId: string | null;
  /** Section IDs this screenshot is relevant to (multiple allowed). */
  sectionIds: string[];
  url: string;
  caption: string;
  order: number;
}

export interface BriefMeta {
  id: string;
  briefId: string;
  targetAudience: string;
  collateralExamples: string;
  figmaFileUrl: string;
  tags: string;
}

export type BriefTabId = "overview" | "sections" | "screenshots" | "metadata";
