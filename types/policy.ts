/**
 * Policy & Rules types — match InstantDB schema.
 * Used for Policy Block compilation (future generation phase).
 */

export type PolicyFieldType = "text" | "textarea" | "toggle";

export interface FieldDef {
  id: string;
  label: string;
  fieldType: PolicyFieldType;
  helperText: string;
  required: boolean;
  order: number;
}

export interface PolicyTypeSchema {
  id: string;
  typeKey: string;
  label: string;
  description: string;
  fields: string; // JSON array of FieldDef
  isDefault: boolean;
  order: number;
  isActive: boolean;
}

export interface PolicyRule {
  id: string;
  typeKey: string;
  name: string;
  fieldValues: string; // JSON object { [fieldDefId]: string | boolean }
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export type PolicySavingState = "idle" | "saving" | "saved" | "error";
