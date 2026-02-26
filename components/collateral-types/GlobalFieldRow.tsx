"use client";

import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CollateralGlobalField } from "@/types/collateralType";
import { cn } from "@/lib/utils";

interface GlobalFieldRowProps {
  field: CollateralGlobalField & { optionsParsed?: string[] };
  isEditMode: boolean;
  dragHandleProps?: Record<string, unknown> | null;
  isDragging?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function GlobalFieldRow({
  field,
  isEditMode,
  dragHandleProps,
  isDragging,
  onEdit,
  onDelete,
}: GlobalFieldRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded border border-border bg-card px-3 py-2",
        isDragging && "opacity-50"
      )}
    >
      {isEditMode && dragHandleProps && (
        <button
          type="button"
          className="cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <span className="flex-1 text-sm font-medium">{field.label}</span>
      <span className="text-xs text-muted-foreground">{field.fieldType}</span>
      {field.placeholder && (
        <span className="max-w-[120px] truncate text-xs text-muted-foreground">
          {field.placeholder}
        </span>
      )}
      {field.required && (
        <span className="text-xs text-muted-foreground">Required</span>
      )}
      {isEditMode && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            aria-label="Edit field"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Delete field"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}
