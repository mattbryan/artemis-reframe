/**
 * Seed the five default policy type schemas when none exist.
 * Called from PolicyPage on first load.
 */

import { id } from "@instantdb/react";
import type { FieldDef } from "@/types/policy";

// Stable IDs for default field defs so rules can reference them
const DEFAULT_FIELD_IDS = {
  exclusion: {
    ruleName: "exclusion-f-rule-name",
    neverDoThis: "exclusion-f-never-do",
    why: "exclusion-f-why",
    examplesViolation: "exclusion-f-examples",
  },
  disclosure: {
    ruleName: "disclosure-f-rule-name",
    verbatimText: "disclosure-f-verbatim",
    triggerCondition: "disclosure-f-trigger",
    placementInstruction: "disclosure-f-placement",
  },
  conditional: {
    ruleName: "conditional-f-rule-name",
    condition: "conditional-f-condition",
    requiredAction: "conditional-f-action",
    reference: "conditional-f-reference",
  },
  factual: {
    ruleName: "factual-f-rule-name",
    theStandard: "factual-f-standard",
    appliesTo: "factual-f-applies",
    compliantExample: "factual-f-example",
  },
  audience: {
    ruleName: "audience-f-rule-name",
    restriction: "audience-f-restriction",
    triggerCondition: "audience-f-trigger",
    requiredLanguage: "audience-f-language",
  },
} as const;

function exclusionFields(): FieldDef[] {
  const k = DEFAULT_FIELD_IDS.exclusion;
  return [
    { id: k.ruleName, label: "Rule Name", fieldType: "text", helperText: "", required: true, order: 0 },
    { id: k.neverDoThis, label: "Never Do This", fieldType: "textarea", helperText: "Plain language description of what is prohibited.", required: true, order: 1 },
    { id: k.why, label: "Why", fieldType: "textarea", helperText: "The liability or risk this prevents; used as AI context.", required: true, order: 2 },
    { id: k.examplesViolation, label: "Examples of Violation", fieldType: "textarea", helperText: "Optional; what off-policy output looks like.", required: false, order: 3 },
  ];
}

function disclosureFields(): FieldDef[] {
  const k = DEFAULT_FIELD_IDS.disclosure;
  return [
    { id: k.ruleName, label: "Rule Name", fieldType: "text", helperText: "", required: true, order: 0 },
    { id: k.verbatimText, label: "Verbatim Disclosure Text", fieldType: "textarea", helperText: "The exact language that must appear.", required: true, order: 1 },
    { id: k.triggerCondition, label: "Trigger Condition", fieldType: "textarea", helperText: "Plain language: when must this appear? e.g. \"Any document that includes projected returns\"", required: true, order: 2 },
    { id: k.placementInstruction, label: "Placement Instruction", fieldType: "text", helperText: "Where in the document, e.g. \"Footer of every page\" or \"Immediately following any financial projection\"", required: true, order: 3 },
  ];
}

function conditionalFields(): FieldDef[] {
  const k = DEFAULT_FIELD_IDS.conditional;
  return [
    { id: k.ruleName, label: "Rule Name", fieldType: "text", helperText: "", required: true, order: 0 },
    { id: k.condition, label: "Condition", fieldType: "textarea", helperText: "Plain language trigger: \"If the property is in California…\" or \"If the deal involves assumable financing…\"", required: true, order: 1 },
    { id: k.requiredAction, label: "Required Action", fieldType: "textarea", helperText: "What must happen when the condition is true.", required: true, order: 2 },
    { id: k.reference, label: "Reference", fieldType: "text", helperText: "Optional; law, regulation, or internal policy being cited, e.g. \"California Prop 65\", \"SEC Rule 506(b)\"", required: false, order: 3 },
  ];
}

function factualFields(): FieldDef[] {
  const k = DEFAULT_FIELD_IDS.factual;
  return [
    { id: k.ruleName, label: "Rule Name", fieldType: "text", helperText: "", required: true, order: 0 },
    { id: k.theStandard, label: "The Standard", fieldType: "textarea", helperText: "Plain language rule: \"All cap rates must cite their source.\" \"Square footage must specify whether rentable or gross.\"", required: true, order: 1 },
    { id: k.appliesTo, label: "Applies To", fieldType: "textarea", helperText: "Which data types or claims this governs.", required: true, order: 2 },
    { id: k.compliantExample, label: "Compliant Example", fieldType: "textarea", helperText: "Optional; what correct output looks like.", required: false, order: 3 },
  ];
}

function audienceFields(): FieldDef[] {
  const k = DEFAULT_FIELD_IDS.audience;
  return [
    { id: k.ruleName, label: "Rule Name", fieldType: "text", helperText: "", required: true, order: 0 },
    { id: k.restriction, label: "Restriction", fieldType: "textarea", helperText: "What the restriction is.", required: true, order: 1 },
    { id: k.triggerCondition, label: "Trigger Condition", fieldType: "textarea", helperText: "When this restriction applies.", required: true, order: 2 },
    { id: k.requiredLanguage, label: "Required Language", fieldType: "textarea", helperText: "Optional; verbatim language that must accompany restricted content.", required: false, order: 3 },
  ];
}

const DEFAULT_TYPES: Array<{
  typeKey: string;
  label: string;
  description: string;
  fields: FieldDef[];
  order: number;
}> = [
  {
    typeKey: "exclusion",
    label: "Exclusions",
    description:
      "Things that must never appear in generated content, regardless of context. Use this for language, claims, or representations that create legal or reputational risk.",
    fields: exclusionFields(),
    order: 0,
  },
  {
    typeKey: "disclosure",
    label: "Required Disclosures",
    description:
      "Verbatim language that must appear whenever a specific condition is met. Use this for fair housing statements, license numbers, past-performance disclaimers, and legally required notices.",
    fields: disclosureFields(),
    order: 1,
  },
  {
    typeKey: "conditional",
    label: "Conditional Compliance",
    description:
      "Rules that apply when a specific condition is true. Use this for geographic regulations, deal-type requirements, financing disclosures, and jurisdiction-specific compliance obligations.",
    fields: conditionalFields(),
    order: 2,
  },
  {
    typeKey: "factual",
    label: "Factual Standards",
    description:
      "Rules about how data and claims must be presented to avoid misrepresentation. Use this for sourcing requirements, labeling projections, defining terms, and specifying units.",
    fields: factualFields(),
    order: 3,
  },
  {
    typeKey: "audience",
    label: "Audience Restrictions",
    description:
      "Rules about who certain content may be shown to or how it may be distributed. Use this for accredited investor requirements, offering type restrictions, and distribution channel limitations.",
    fields: audienceFields(),
    order: 4,
  },
];

/** Minimal type for seeding; actual db from @/lib/db satisfies this at runtime. */
export type DbLike = {
  transact: (chunks: unknown) => Promise<unknown>;
  tx: { policyTypeSchema: Record<string, { update: (data: unknown) => unknown }> };
};

export async function seedPolicyDefaults(
  db: DbLike,
  existingCount: number
): Promise<void> {
  if (existingCount > 0) return;

  const ops = DEFAULT_TYPES.map((t) => {
    const schemaId = id();
    return db.tx.policyTypeSchema[schemaId].update({
      typeKey: t.typeKey,
      label: t.label,
      description: t.description,
      fields: JSON.stringify(t.fields),
      isDefault: true,
      order: t.order,
      isActive: true,
    });
  });

  await db.transact(ops);
}
