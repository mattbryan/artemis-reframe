/**
 * Policy & Rules mutations — all writes via InstantDB transact.
 */

import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { parsePolicyFields } from "@/lib/policyJson";
import type { FieldDef } from "@/types/policy";

const now = () => Date.now();

// ——— Type schema ———

export async function createPolicyTypeSchema(params: {
  typeKey: string;
  label: string;
  description: string;
}): Promise<string> {
  const schemaId = id();
  await db.transact(
    db.tx.policyTypeSchema[schemaId].update({
      typeKey: params.typeKey,
      label: params.label,
      description: params.description,
      fields: "[]",
      isDefault: false,
      order: 999,
      isActive: true,
    })
  );
  return schemaId;
}

export async function updatePolicyTypeSchema(
  schemaId: string,
  updates: Partial<{
    typeKey: string;
    label: string;
    description: string;
    fields: string;
    order: number;
    isActive: boolean;
  }>
): Promise<void> {
  const payload: Record<string, unknown> = { ...updates };
  await db.transact(db.tx.policyTypeSchema[schemaId].update(payload));
}

export async function setPolicyTypeSchemaActive(schemaId: string, isActive: boolean): Promise<void> {
  await db.transact(db.tx.policyTypeSchema[schemaId].update({ isActive }));
}

export async function deletePolicyTypeSchema(schemaId: string): Promise<void> {
  const { data: schemaData } = await db.queryOnce({
    policyTypeSchema: { $: { where: { id: schemaId } } },
  } as Parameters<typeof db.queryOnce>[0]);
  const raw = schemaData?.policyTypeSchema;
  const schemaRow = Array.isArray(raw) ? raw[0] : (raw as Record<string, { typeKey: string }> | undefined)?.[schemaId];
  const typeKey = (schemaRow as { typeKey?: string } | undefined)?.typeKey;
  const { data: ruleData } = await db.queryOnce({ policyRule: {} });
  const allRules = (ruleData?.policyRule ?? []) as { id: string; typeKey: string }[];
  const toDelete = typeKey ? allRules.filter((r) => r.typeKey === typeKey) : [];
  const ops = [...toDelete.map((r) => db.tx.policyRule[r.id].delete()), db.tx.policyTypeSchema[schemaId].delete()];
  await db.transact(ops);
}

export async function getRuleCountForType(typeKey: string): Promise<number> {
  const { data } = await db.queryOnce({ policyRule: {} });
  const rules = (data?.policyRule ?? []) as { typeKey: string }[];
  return rules.filter((r) => r.typeKey === typeKey).length;
}

// ——— Rules ———

export async function createPolicyRule(typeKey: string): Promise<string> {
  const ruleId = id();
  const ts = now();
  await db.transact(
    db.tx.policyRule[ruleId].update({
      typeKey,
      name: "",
      fieldValues: "{}",
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    })
  );
  return ruleId;
}

export async function updatePolicyRule(
  ruleId: string,
  updates: Partial<{
    name: string;
    fieldValues: string;
    isActive: boolean;
  }>
): Promise<void> {
  const payload: Record<string, unknown> = { ...updates, updatedAt: now() };
  await db.transact(db.tx.policyRule[ruleId].update(payload));
}

export async function deletePolicyRule(ruleId: string): Promise<void> {
  await db.transact(db.tx.policyRule[ruleId].delete());
}

// ——— Field schema (add / remove / reorder) ———

export async function addFieldToType(
  schemaId: string,
  field: { label: string; fieldType: FieldDef["fieldType"]; helperText: string; required: boolean }
): Promise<void> {
  const { data } = await db.queryOnce({
    policyTypeSchema: { $: { where: { id: schemaId } } },
  } as Parameters<typeof db.queryOnce>[0]);
  const raw = data?.policyTypeSchema;
  const row = Array.isArray(raw) ? raw[0] : (raw as Record<string, unknown> | undefined)?.[schemaId];
  const fieldsJson = (row as { fields?: string } | undefined)?.fields ?? "[]";
  const fields = parsePolicyFields(fieldsJson);
  const maxOrder = fields.length ? Math.max(...fields.map((f) => f.order)) : -1;
  const newField: FieldDef = {
    id: id(),
    label: field.label,
    fieldType: field.fieldType,
    helperText: field.helperText,
    required: field.required,
    order: maxOrder + 1,
  };
  fields.push(newField);
  await db.transact(db.tx.policyTypeSchema[schemaId].update({ fields: JSON.stringify(fields) }));
}

/**
 * Remove a field from the type schema.
 * FUTURE: Orphaned keys in existing policyRule.fieldValues are not removed; consider cleaning them in a later pass.
 */
export async function removeFieldFromType(schemaId: string, fieldDefId: string): Promise<void> {
  const { data } = await db.queryOnce({
    policyTypeSchema: { $: { where: { id: schemaId } } },
  } as Parameters<typeof db.queryOnce>[0]);
  const raw = data?.policyTypeSchema;
  const row = Array.isArray(raw) ? raw[0] : (raw as Record<string, unknown> | undefined)?.[schemaId];
  const fieldsJson = (row as { fields?: string } | undefined)?.fields ?? "[]";
  let fields = parsePolicyFields(fieldsJson);
  fields = fields.filter((f) => f.id !== fieldDefId);
  await db.transact(db.tx.policyTypeSchema[schemaId].update({ fields: JSON.stringify(fields) }));
}

export async function reorderPolicyTypeFields(schemaId: string, fieldIds: string[]): Promise<void> {
  const { data } = await db.queryOnce({
    policyTypeSchema: { $: { where: { id: schemaId } } },
  } as Parameters<typeof db.queryOnce>[0]);
  const raw = data?.policyTypeSchema;
  const row = Array.isArray(raw) ? raw[0] : (raw as Record<string, unknown> | undefined)?.[schemaId];
  const fieldsJson = (row as { fields?: string } | undefined)?.fields ?? "[]";
  const fields = parsePolicyFields(fieldsJson);
  const byId = new Map(fields.map((f) => [f.id, f]));
  const reordered: FieldDef[] = [];
  for (let i = 0; i < fieldIds.length; i++) {
    const f = byId.get(fieldIds[i]);
    if (f) {
      reordered.push({ ...f, order: i });
      byId.delete(fieldIds[i]);
    }
  }
  byId.forEach((f) => reordered.push({ ...f, order: reordered.length }));
  await db.transact(db.tx.policyTypeSchema[schemaId].update({ fields: JSON.stringify(reordered) }));
}
