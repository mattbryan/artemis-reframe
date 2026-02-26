"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addFieldToType,
} from "@/lib/mutations/policy";
import { usePolicyStore } from "@/store/policyStore";
import type { FieldDef } from "@/types/policy";
import { cn } from "@/lib/utils";

interface AddFieldFormProps {
  schemaId: string;
  onAdded: () => void;
  onCancel: () => void;
}

const FIELD_TYPES: { value: FieldDef["fieldType"]; label: string }[] = [
  { value: "text", label: "Text (single line)" },
  { value: "textarea", label: "Textarea (multi-line)" },
  { value: "toggle", label: "Toggle (boolean)" },
];

export function AddFieldForm({ schemaId, onAdded, onCancel }: AddFieldFormProps) {
  const setSavingState = usePolicyStore((s) => s.setSavingState);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<FieldDef["fieldType"]>("text");
  const [helperText, setHelperText] = useState("");
  const [required, setRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSavingState("saving");
    try {
      await addFieldToType(schemaId, {
        label: label.trim(),
        fieldType,
        helperText: helperText.trim(),
        required,
      });
      setSavingState("saved");
      onAdded();
    } catch {
      setSavingState("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-dashed border-border bg-muted/20 p-4">
      <div>
        <label htmlFor="add-field-label" className="text-sm font-medium">
          Field Label
        </label>
        <Input
          id="add-field-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Reference"
          className="mt-1"
          required
        />
      </div>
      <div>
        <label htmlFor="add-field-type" className="text-sm font-medium">
          Field Type
        </label>
        <select
          id="add-field-type"
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value as FieldDef["fieldType"])}
          className={cn(
            "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="add-field-helper" className="text-sm font-medium">
          Helper Text (optional)
        </label>
        <Input
          id="add-field-helper"
          value={helperText}
          onChange={(e) => setHelperText(e.target.value)}
          placeholder="Guidance shown below the field"
          className="mt-1"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={required}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            required ? "bg-primary" : "bg-input"
          )}
          onClick={() => setRequired((r) => !r)}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-background shadow transition",
              required ? "translate-x-5" : "translate-x-1"
            )}
          />
        </button>
        <span className="text-sm font-medium">Required</span>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!label.trim()}>
          Add Field
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
