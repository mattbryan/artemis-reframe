/**
 * Schema definition mutations — create, update, delete.
 * Uses InstantDB transact for writes.
 */

import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import type {
  SchemaDefinition,
  SchemaFieldDefinition,
} from "@/types/schema-definition";

export async function createSchemaDefinition(
  name: string,
  fields: SchemaFieldDefinition[],
  licenseInfo?: string,
  usageGuidelines?: string
): Promise<void> {
  const schemaId = id();
  const now = new Date().toISOString();
  await db.transact(
    db.tx.schemaDefinitions[schemaId].update({
      name,
      fields,
      licenseInfo: licenseInfo ?? undefined,
      usageGuidelines: usageGuidelines ?? undefined,
      createdAt: now,
    })
  );
}

export async function updateSchemaDefinition(
  schemaId: string,
  updates: {
    name?: string;
    fields?: SchemaFieldDefinition[];
    licenseInfo?: string;
    usageGuidelines?: string;
  }
): Promise<void> {
  await db.transact(db.tx.schemaDefinitions[schemaId].update(updates));
}

export async function deleteSchemaDefinition(schemaId: string): Promise<void> {
  await db.transact(db.tx.schemaDefinitions[schemaId].delete());
}

export function addSchemaField(
  schema: SchemaDefinition,
  field: Omit<SchemaFieldDefinition, "id">
): SchemaFieldDefinition[] {
  const newField: SchemaFieldDefinition = {
    ...field,
    id: id(),
  };
  return [...(schema.fields ?? []), newField];
}

export function updateSchemaField(
  schema: SchemaDefinition,
  fieldId: string,
  updates: Partial<Omit<SchemaFieldDefinition, "id">>
): SchemaFieldDefinition[] {
  return (schema.fields ?? []).map((f) =>
    f.id === fieldId ? { ...f, ...updates } : f
  );
}

export function removeSchemaField(
  schema: SchemaDefinition,
  fieldId: string
): SchemaFieldDefinition[] {
  return (schema.fields ?? []).filter((f) => f.id !== fieldId);
}
