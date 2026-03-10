"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { usePolicyStore } from "@/store/policyStore";
import { usePolicies, getFieldsForSchema } from "@/lib/hooks/usePolicies";
import { createPolicyRule, updatePolicyTypeSchema, ensureCustomTypeHasDefaultFields } from "@/lib/mutations/policy";
import { RuleTypeSectionHeader } from "./RuleTypeSectionHeader";
import { RuleCard } from "./RuleCard";
import { EditFieldsPanel } from "./EditFieldsPanel";
import type { PolicyTypeSchema, PolicyRule } from "@/types/policy";
import { Button } from "@/components/ui/button";

interface RuleTypeSectionProps {
  typeSchema: PolicyTypeSchema;
}

export function RuleTypeSection({ typeSchema }: RuleTypeSectionProps) {
  const editingFieldsTypeKey = usePolicyStore((s) => s.editingFieldsTypeKey);
  const setEditingFieldsTypeKey = usePolicyStore((s) => s.setEditingFieldsTypeKey);
  const setSavingState = usePolicyStore((s) => s.setSavingState);
  const { rules } = usePolicies();
  const [newRuleId, setNewRuleId] = useState<string | null>(null);
  const addRuleButtonRef = useRef<HTMLButtonElement>(null);

  const isEditingFields = editingFieldsTypeKey === typeSchema.typeKey;
  const toggleEditFields = useCallback(() => {
    setEditingFieldsTypeKey(isEditingFields ? null : typeSchema.typeKey);
  }, [isEditingFields, typeSchema.typeKey, setEditingFieldsTypeKey]);

  const typeRules = rules.filter((r) => r.typeKey === typeSchema.typeKey);

  const handleAddRule = useCallback(async () => {
    const id = await createPolicyRule(typeSchema.typeKey);
    setNewRuleId(id);
  }, [typeSchema.typeKey]);

  const handleCancelNew = useCallback(() => {
    setNewRuleId(null);
  }, []);

  const handleSavedNew = useCallback(() => {
    setNewRuleId(null);
    addRuleButtonRef.current?.focus();
  }, []);

  // Must be computed and called before any early returns to satisfy Rules of Hooks.
  const fields = getFieldsForSchema(typeSchema);

  useEffect(() => {
    if (typeSchema.isDefault) return;
    if (fields.length > 0) return;
    ensureCustomTypeHasDefaultFields(typeSchema.id).catch(() => {});
  }, [fields.length, typeSchema.id, typeSchema.isDefault]);

  if (!typeSchema.isActive) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <span className="font-medium text-muted-foreground">{typeSchema.label}</span>
        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">Hidden</span>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setSavingState("saving");
            try {
              await updatePolicyTypeSchema(typeSchema.id, { isActive: true });
              setSavingState("saved");
            } catch {
              setSavingState("error");
            }
          }}
        >
          Restore
        </Button>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <RuleTypeSectionHeader
        typeSchema={typeSchema}
        ruleCount={typeRules.length}
        onAddRule={handleAddRule}
        onEditFieldsClick={toggleEditFields}
        onAddCustomField={() => setEditingFieldsTypeKey(typeSchema.typeKey)}
        isEditingFields={isEditingFields}
        addRuleButtonRef={addRuleButtonRef}
      />
      <div className="p-4">
        {isEditingFields ? (
          <EditFieldsPanel
            typeSchema={typeSchema}
            fields={fields}
            onFieldsChange={() => {}}
          />
        ) : (
          <div className="space-y-3">
            {newRuleId && (
              <RuleCard
                rule={
                  typeRules.find((r) => r.id === newRuleId) ?? {
                    id: newRuleId,
                    typeKey: typeSchema.typeKey,
                    name: "",
                    fieldValues: "{}",
                    isActive: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  }
                }
                typeSchema={typeSchema}
                isNew
                onCancelNew={handleCancelNew}
                onSavedNew={handleSavedNew}
                addRuleButtonRef={addRuleButtonRef}
              />
            )}
            {typeRules
              .filter((r) => r.id !== newRuleId)
              .map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  typeSchema={typeSchema}
                  addRuleButtonRef={addRuleButtonRef}
                />
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
