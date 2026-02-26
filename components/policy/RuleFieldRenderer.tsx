"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldDef } from "@/types/policy";

const MAX_TEXTAREA_LENGTH = 10_000;

interface RuleFieldRendererProps {
  field: FieldDef;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  /** Called on blur with current value so parent can persist. */
  onBlur?: (value: string | boolean) => void;
  disabled?: boolean;
  /** When true, show remove control (Edit Fields mode). */
  showRemove?: boolean;
  onRemove?: () => void;
  dragHandleProps?: Record<string, unknown> | null;
  isDragging?: boolean;
}

export function RuleFieldRenderer({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  showRemove,
  onRemove,
  dragHandleProps,
  isDragging,
}: RuleFieldRendererProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      onChange(v);
    },
    [onChange]
  );

  const id = `policy-field-${field.id}`;

  return (
    <div
      className={cn(
        "group flex flex-col gap-1",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2">
        {dragHandleProps && (
          <button
            type="button"
            className="cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Drag to reorder"
            {...dragHandleProps}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M8 6h2V4H8v2zm0 4h2V8H8v2zm0 4h2v-2H8v2zm4-8h2V4h-2v2zm0 4h2V8h-2v2zm0 4h2v-2h-2v2z" />
            </svg>
          </button>
        )}
        <label htmlFor={id} className="flex-1 text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-destructive"> *</span>}
        </label>
        {showRemove && onRemove && (
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Remove ${field.label}`}
            onClick={onRemove}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      {field.fieldType === "text" && (
        <Input
          id={id}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={handleChange}
          onBlur={(e) => onBlur?.(e.target.value)}
          disabled={disabled}
          className="w-full"
        />
      )}
      {field.fieldType === "textarea" && (
        <textarea
          id={id}
          className={cn(
            "min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          )}
          value={typeof value === "string" ? value : ""}
          onChange={handleChange}
          onBlur={(e) => onBlur?.(e.target.value)}
          disabled={disabled}
          maxLength={MAX_TEXTAREA_LENGTH}
          rows={3}
        />
      )}
      {field.fieldType === "toggle" && (
        <button
          type="button"
          role="switch"
          aria-checked={value === true}
          aria-label={field.label}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            value === true ? "bg-primary" : "bg-input"
          )}
          onClick={() => {
            const next = !value;
            onChange(next);
            onBlur?.(next);
          }}
          disabled={disabled}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition",
              value === true ? "translate-x-5" : "translate-x-1"
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
