"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FieldDef, CollateralFieldType } from "@/types/collateralType";
import { cn } from "@/lib/utils";

const FIELD_TYPES: { value: CollateralFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "toggle", label: "Toggle" },
];

interface InlineFieldFormProps {
  onSubmit: (field: Omit<FieldDef, "id" | "order">) => void;
  onCancel: () => void;
  initial?: Partial<FieldDef>;
}

export function InlineFieldForm({
  onSubmit,
  onCancel,
  initial,
}: InlineFieldFormProps) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [fieldType, setFieldType] = useState<CollateralFieldType>(
    initial?.fieldType ?? "text"
  );
  const [placeholder, setPlaceholder] = useState(initial?.placeholder ?? "");
  const [helperText, setHelperText] = useState(initial?.helperText ?? "");
  const [required, setRequired] = useState(initial?.required ?? false);
  const [optionsStr, setOptionsStr] = useState(
    Array.isArray(initial?.options) ? initial.options.join(", ") : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    const options = fieldType === "select"
      ? optionsStr.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    onSubmit({
      label: label.trim(),
      fieldType,
      placeholder: placeholder.trim(),
      helperText: helperText.trim(),
      options,
      required,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-dashed border-border bg-muted/20 p-4"
    >
      <div>
        <label htmlFor="field-label" className="text-sm font-medium">
          Field Label
        </label>
        <Input
          id="field-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Property Name"
          className="mt-1"
          required
        />
      </div>
      <div>
        <label htmlFor="field-type" className="text-sm font-medium">
          Field Type
        </label>
        <select
          id="field-type"
          value={fieldType}
          onChange={(e) =>
            setFieldType(e.target.value as CollateralFieldType)
          }
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
        <label htmlFor="field-placeholder" className="text-sm font-medium">
          Placeholder
        </label>
        <Input
          id="field-placeholder"
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          placeholder="Optional"
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="field-helper" className="text-sm font-medium">
          Helper Text
        </label>
        <Input
          id="field-helper"
          value={helperText}
          onChange={(e) => setHelperText(e.target.value)}
          placeholder="Guidance shown below the field"
          className="mt-1"
        />
      </div>
      {fieldType === "select" && (
        <div>
          <label htmlFor="field-options" className="text-sm font-medium">
            Options (comma-separated)
          </label>
          <Input
            id="field-options"
            value={optionsStr}
            onChange={(e) => setOptionsStr(e.target.value)}
            placeholder="Option 1, Option 2, Option 3"
            className="mt-1"
          />
        </div>
      )}
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
          {initial ? "Update Field" : "Add Field"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
