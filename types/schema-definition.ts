/**
 * SchemaDefinition — attribute schema definitions for elemental assets.
 * Drives dynamic forms during asset upload.
 */

export interface SchemaFieldDefinition {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "date" | "json" | "url";
  required?: boolean;
  licenseInfo?: string;
  usageGuidelines?: string;
  options?: Record<string, unknown>;
}

export interface SchemaDefinition {
  id: string;
  name: string;
  fields: SchemaFieldDefinition[];
  licenseInfo?: string;
  usageGuidelines?: string;
  createdAt: string; // ISO 8601
}
