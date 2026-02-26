"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePolicyStore } from "@/store/policyStore";
import { parseFieldValues } from "@/lib/policyJson";
import { getFieldsForSchema } from "@/lib/hooks/usePolicies";
import { updatePolicyRule, deletePolicyRule } from "@/lib/mutations/policy";
import { RuleFieldRenderer } from "./RuleFieldRenderer";
import type { PolicyRule, PolicyTypeSchema } from "@/types/policy";
import { cn } from "@/lib/utils";

interface RuleCardProps {
  rule: PolicyRule;
  typeSchema: PolicyTypeSchema;
  isNew?: boolean;
  onCancelNew?: () => void;
  onSavedNew?: () => void;
  addRuleButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function RuleCard({
  rule,
  typeSchema,
  isNew,
  onCancelNew,
  onSavedNew,
  addRuleButtonRef,
}: RuleCardProps) {
  const toggleExpanded = usePolicyStore((s) => s.toggleRuleExpanded);
  const setSavingState = usePolicyStore((s) => s.setSavingState);
  const expandedRuleIds = usePolicyStore((s) => s.expandedRuleIds);
  const isExpanded = expandedRuleIds.has(rule.id) || isNew;

  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>(() =>
    parseFieldValues(rule.fieldValues)
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const hasPersisted = useRef(false);

  const fields = getFieldsForSchema(typeSchema);
  const ruleNameFieldId = fields.find((f) => f.label === "Rule Name")?.id ?? fields[0]?.id;
  const displayNameFromValues =
    (ruleNameFieldId && typeof fieldValues[ruleNameFieldId] === "string"
      ? (fieldValues[ruleNameFieldId] as string).trim()
      : "") || rule.name.trim();

  useEffect(() => {
    setFieldValues(parseFieldValues(rule.fieldValues));
  }, [rule.id, rule.fieldValues]);

  useEffect(() => {
    if (isNew && isExpanded && fields.length > 0) {
      const firstInput = document.getElementById(`policy-field-${fields[0].id}`);
      (firstInput as HTMLInputElement | HTMLTextAreaElement)?.focus();
    }
  }, [isNew, isExpanded, fields]);

  const tryCollapse = useCallback(() => {
    const nameVal = ruleNameFieldId ? (fieldValues[ruleNameFieldId] as string)?.trim() : "";
    if (!nameVal) {
      setNameError("A rule name is required");
      return;
    }
    setNameError(null);
    toggleExpanded(rule.id);
  }, [fieldValues, ruleNameFieldId, rule.id, toggleExpanded]);

  const persistRule = useCallback(
    async (updates: { name?: string; fieldValues?: string }) => {
      setSavingState("saving");
      try {
        await updatePolicyRule(rule.id, updates);
        hasPersisted.current = true;
        setSavingState("saved");
        onSavedNew?.();
      } catch {
        setSavingState("error");
      }
    },
    [rule.id, setSavingState, onSavedNew]
  );

  const handleFieldBlur = useCallback(
    (fieldId: string, value: string | boolean) => {
      const next = { ...fieldValues, [fieldId]: value };
      setFieldValues(next);
      const nameVal = ruleNameFieldId ? (next[ruleNameFieldId] as string | undefined)?.trim() : rule.name;
      persistRule({ name: nameVal ?? rule.name, fieldValues: JSON.stringify(next) });
    },
    [fieldValues, ruleNameFieldId, rule.name, persistRule]
  );

  const handleActiveChange = useCallback(
    async (checked: boolean) => {
      setSavingState("saving");
      try {
        await updatePolicyRule(rule.id, { isActive: checked });
        setSavingState("saved");
      } catch {
        setSavingState("error");
      }
    },
    [rule.id, setSavingState]
  );

  const handleDelete = useCallback(async () => {
    setSavingState("saving");
    try {
      await deletePolicyRule(rule.id);
      setSavingState("saved");
      addRuleButtonRef?.current?.focus();
    } catch {
      setSavingState("error");
    }
  }, [rule.id, setSavingState, addRuleButtonRef]);

  const handleCancelNew = useCallback(() => {
    if (hasPersisted.current) {
      deletePolicyRule(rule.id).then(() => addRuleButtonRef?.current?.focus());
    } else {
      onCancelNew?.();
      addRuleButtonRef?.current?.focus();
    }
  }, [rule.id, onCancelNew, addRuleButtonRef]);

  const displayName = displayNameFromValues || "Untitled rule";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card transition-opacity",
        !rule.isActive && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2 rounded-t-lg border-b border-border bg-muted/30 px-3 py-2">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 py-1 text-left"
          onClick={() => (isNew ? tryCollapse() : toggleExpanded(rule.id))}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            {isNew && !displayNameFromValues ? "Rule name" : displayName}
          </span>
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {typeSchema.label}
          </span>
          {!rule.isActive && (
            <span className="text-xs text-muted-foreground">Inactive — excluded from enforcement</span>
          )}
        </button>
        {!isNew && (
          <>
            <button
              type="button"
              role="switch"
              aria-checked={rule.isActive}
              aria-label="Toggle rule active"
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                rule.isActive ? "bg-primary" : "bg-input"
              )}
              onClick={() => handleActiveChange(!rule.isActive)}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-background shadow transition",
                  rule.isActive ? "translate-x-5" : "translate-x-1"
                )}
              />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Delete rule"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
        {isNew && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Cancel"
            onClick={handleCancelNew}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isExpanded && (
        <div className="space-y-4 p-4">
          {nameError && (
            <p className="text-sm text-destructive">{nameError}</p>
          )}
          {fields.map((field) => {
            const currentValue = fieldValues[field.id] ?? (field.fieldType === "toggle" ? false : "");
            return (
              <RuleFieldRenderer
                key={field.id}
                field={field}
                value={currentValue}
                onChange={(v) => setFieldValues((prev) => ({ ...prev, [field.id]: v }))}
                onBlur={(v) => handleFieldBlur(field.id, v)}
              />
            );
          })}
          {fields.length === 0 && <p className="text-sm text-muted-foreground">No fields defined for this type.</p>}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete rule?</DialogTitle>
            <DialogDescription>
              &ldquo;{displayName}&rdquo; will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteDialogOpen(false);
                handleDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
