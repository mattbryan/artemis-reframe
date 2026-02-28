"use client";

import { useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useWizardStore } from "@/store/wizardStore";
import {
  parseSectionFields,
  parseOptions,
} from "@/lib/collateralTypeUtils";
import { cn } from "@/lib/utils";
import type { FieldDef } from "@/types/collateralType";

interface Step2ProjectInfoProps {
  onStepValidChange: (valid: boolean) => void;
}

export function Step2ProjectInfo({ onStepValidChange }: Step2ProjectInfoProps) {
  const selectedCollateralType = useWizardStore((s) => s.selectedCollateralType);
  const projectName = useWizardStore((s) => s.projectName);
  const formData = useWizardStore((s) => s.formData);
  const sectionData = useWizardStore((s) => s.sectionData);
  const setProjectName = useWizardStore((s) => s.setProjectName);
  const setFormField = useWizardStore((s) => s.setFormField);
  const setSectionField = useWizardStore((s) => s.setSectionField);

  const globalFields = useMemo(() => {
    if (!selectedCollateralType) return [];
    const raw = (selectedCollateralType as { globalFields?: unknown[] }).globalFields;
    const list = raw ?? [];
    return (list as Array<Record<string, unknown>>)
      .slice()
      .sort((a, b) => (Number(a.order) ?? 0) - (Number(b.order) ?? 0))
      .map((f) => ({
        id: f.id as string,
        label: (f.label as string) ?? "",
        fieldType: (f.fieldType as string) ?? "text",
        helperText: (f.helperText as string) ?? "",
        placeholder: (f.placeholder as string) ?? "",
        options: parseOptions((f.options as string) ?? "[]"),
        required: Boolean(f.required),
        order: Number(f.order) ?? 0,
      }));
  }, [selectedCollateralType]);

  const sectionsWithFields = useMemo(() => {
    if (!selectedCollateralType) return [];
    const raw = (selectedCollateralType as { sections?: unknown[] }).sections;
    const list = raw ?? [];
    return (list as Array<Record<string, unknown>>)
      .slice()
      .sort((a, b) => (Number(a.order) ?? 0) - (Number(b.order) ?? 0))
      .map((s) => ({
        id: s.id as string,
        name: (s.name as string) ?? "",
        description: (s.description as string) ?? "",
        fields: parseSectionFields((s.fields as string) ?? "[]") as FieldDef[],
        order: Number(s.order) ?? 0,
      }));
  }, [selectedCollateralType]);

  const isValid = useMemo(() => {
    if (!projectName.trim()) return false;
    for (const f of globalFields) {
      if (f.required) {
        const v = formData[f.id];
        if (v === undefined || v === null || v === "") return false;
        if (typeof v === "string" && !v.trim()) return false;
      }
    }
    for (const sec of sectionsWithFields) {
      for (const field of sec.fields) {
        if (field.required) {
          const v = sectionData[sec.id]?.[field.id];
          if (v === undefined || v === null || v === "") return false;
          if (typeof v === "string" && !v.trim()) return false;
        }
      }
    }
    return true;
  }, [projectName, globalFields, sectionsWithFields, formData, sectionData]);

  useEffect(() => {
    onStepValidChange(isValid);
  }, [isValid, onStepValidChange]);

  if (!selectedCollateralType) return null;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-foreground">Project information</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Project name <span className="text-destructive">*</span>
        </label>
        <Input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter project name"
          className="max-w-md"
        />
      </div>

      {globalFields.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Global fields</h3>
          <div className="space-y-4">
            {globalFields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={formData[field.id]}
                onChange={(v) => setFormField(field.id, v)}
                options={field.options}
              />
            ))}
          </div>
        </div>
      )}

      {sectionsWithFields.map((section) => (
        <div key={section.id} className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-foreground">{section.name}</h3>
            {section.description && (
              <p className="text-xs text-muted-foreground">{section.description}</p>
            )}
          </div>
          <div className="space-y-4 pl-2">
            {section.fields
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={sectionData[section.id]?.[field.id]}
                  onChange={(v) => setSectionField(section.id, field.id, v)}
                  options={field.options}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface FieldRendererProps {
  field: {
    id: string;
    label: string;
    fieldType: string;
    helperText?: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
  };
  value: string | boolean | number | undefined;
  onChange: (v: string | boolean | number) => void;
  options?: string[];
}

function FieldRenderer({
  field,
  value,
  onChange,
  options = [],
}: FieldRendererProps) {
  const id = `field-${field.id}`;
  const valStr = value === undefined || value === null ? "" : String(value);
  const valBool = value === true;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </label>
      {field.fieldType === "text" && (
        <Input
          id={id}
          type="text"
          value={valStr}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="max-w-md"
        />
      )}
      {field.fieldType === "textarea" && (
        <textarea
          id={id}
          className={cn(
            "min-h-[80px] w-full max-w-md resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          value={valStr}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
        />
      )}
      {field.fieldType === "number" && (
        <Input
          id={id}
          type="number"
          value={valStr}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder={field.placeholder}
          className="max-w-md"
        />
      )}
      {field.fieldType === "date" && (
        <Input
          id={id}
          type="date"
          value={valStr}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-md"
        />
      )}
      {field.fieldType === "select" && (
        <select
          id={id}
          value={valStr}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "flex h-10 max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
      {field.fieldType === "toggle" && (
        <button
          type="button"
          role="switch"
          aria-checked={valBool}
          aria-label={field.label}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            valBool ? "bg-primary" : "bg-input"
          )}
          onClick={() => onChange(!valBool)}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow transition",
              valBool ? "translate-x-5" : "translate-x-1"
            )}
          />
        </button>
      )}
      {field.helperText && (
        <p className="text-xs text-muted-foreground">{field.helperText}</p>
      )}
    </div>
  );
}
