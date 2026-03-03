import type { GeneratedOutputContent } from "./generation";
import type { OutputTargetType } from "./collateralType";

export type ProjectStatus = "draft" | "generating" | "complete" | "approved" | "failed";

export type ProjectOutputStatus =
  | "pending"
  | "generating"
  | "complete"
  | "failed";

export type ProjectOutputApprovalStatus = "approved" | "not_approved";

export interface ProjectOutput {
  id: string;
  projectId: string;
  targetType: OutputTargetType;
  briefId: string;
  status: ProjectOutputStatus;
  approvalStatus?: ProjectOutputApprovalStatus;
  contentJson: GeneratedOutputContent;
  editedContentJson?: GeneratedOutputContent;
  rawPrompt?: string;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectImage {
  id: string;
  url: string;
  filename: string;
  fileSize: number;
  isHero: boolean;
  mediaFieldId: string;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  collateralTypeId: string;
  collateralTypeSlug: string;
  formData: Record<string, string | boolean | number>;
  sectionData: Record<string, Record<string, string | boolean | number>>;
  images: ProjectImage[];
  outputTargetAssignments: Record<OutputTargetType, string>;
  generationLog: string[];
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}
