"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPolicyTypeSchema } from "@/lib/mutations/policy";
import { usePolicyStore } from "@/store/policyStore";
import { cn } from "@/lib/utils";

interface AddRuleTypeFormProps {
  onAdded: () => void;
  onCancel: () => void;
}

export function AddRuleTypeForm({ onAdded, onCancel }: AddRuleTypeFormProps) {
  const setSavingState = usePolicyStore((s) => s.setSavingState);
  const setEditingFieldsTypeKey = usePolicyStore((s) => s.setEditingFieldsTypeKey);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    const typeKey = trimmedLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setSavingState("saving");
    try {
      await createPolicyTypeSchema({
        typeKey: typeKey || `custom-${Date.now()}`,
        label: trimmedLabel,
        description: description.trim(),
      });
      setSavingState("saved");
      setEditingFieldsTypeKey(typeKey);
      onAdded();
    } catch {
      setSavingState("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-dashed border-border bg-muted/20 p-4"
    >
      <div>
        <label htmlFor="add-type-label" className="text-sm font-medium">
          Type Label
        </label>
        <Input
          id="add-type-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Custom Compliance"
          className="mt-1"
          required
        />
      </div>
      <div>
        <label htmlFor="add-type-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="add-type-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="When this rule applies and what it governs."
          className={cn(
            "mt-1 min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!label.trim()}>
          Add Rule Type
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
