"use client";

/**
 * usePolicies — loads all policy type schemas and rules from InstantDB.
 *
 * FUTURE: compile active rules into Policy Block for generation layer.
 * All active rules in this section will be compiled into a Policy Block — a structured
 * payload injected into every AI generation call, alongside the Brand Context Block and
 * the active Design Brief. Do not build that compilation here; this hook is the
 * designated integration point.
 */

import { useMemo } from "react";
import { db } from "@/lib/db";
import { parsePolicyFields } from "@/lib/policyJson";
import type { PolicyTypeSchema, PolicyRule, FieldDef } from "@/types/policy";

function mapTypeSchema(row: {
  id: string;
  typeKey?: string;
  label?: string;
  description?: string;
  fields?: string;
  isDefault?: boolean;
  order?: number;
  isActive?: boolean;
}): PolicyTypeSchema {
  return {
    id: row.id,
    typeKey: row.typeKey ?? "",
    label: row.label ?? "",
    description: row.description ?? "",
    fields: row.fields ?? "[]",
    isDefault: Boolean(row.isDefault),
    order: typeof row.order === "number" ? row.order : 0,
    isActive: row.isActive !== false,
  };
}

function mapRule(row: {
  id: string;
  typeKey?: string;
  name?: string;
  fieldValues?: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}): PolicyRule {
  return {
    id: row.id,
    typeKey: row.typeKey ?? "",
    name: row.name ?? "",
    fieldValues: row.fieldValues ?? "{}",
    isActive: row.isActive !== false,
    createdAt: typeof row.createdAt === "number" ? row.createdAt : 0,
    updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : 0,
  };
}

export interface UsePoliciesResult {
  typeSchemas: PolicyTypeSchema[];
  rules: PolicyRule[];
  isLoading: boolean;
}

/** Return FieldDef[] for a type schema. Safe parse. */
export function getFieldsForSchema(schema: PolicyTypeSchema): FieldDef[] {
  try {
    return parsePolicyFields(schema.fields);
  } catch {
    return [];
  }
}

export function usePolicies(): UsePoliciesResult {
  const query = useMemo(
    () => ({
      policyTypeSchema: {},
      policyRule: {},
    }),
    []
  );

  const { isLoading, data } = db.useQuery(query);

  const result = useMemo(() => {
    const rawTypes = data?.policyTypeSchema ?? [];
    const isArray = Array.isArray(rawTypes);
    const typeRows = (isArray ? rawTypes : Object.values(rawTypes)) as Parameters<typeof mapTypeSchema>[0][];
    const rawRules = data?.policyRule ?? [];
    const rulesIsArray = Array.isArray(rawRules);
    const ruleRows = (rulesIsArray ? rawRules : Object.values(rawRules)) as Parameters<typeof mapRule>[0][];
    const allSchemas = typeRows.map(mapTypeSchema).sort((a, b) => a.order - b.order);
    // Dedupe by typeKey: keep first schema per typeKey (DB may have duplicate rows from double seed).
    const seenKeys = new Set<string>();
    const typeSchemas = allSchemas.filter((s) => {
      if (seenKeys.has(s.typeKey)) return false;
      seenKeys.add(s.typeKey);
      return true;
    });
    const rules = ruleRows.map(mapRule);
    return {
      typeSchemas,
      rules,
      isLoading,
    };
  }, [data, isLoading]);

  return result;
}
