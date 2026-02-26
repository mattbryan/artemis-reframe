"use client";

import { useState } from "react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateCollateralMediaField,
  deleteCollateralMediaField,
} from "@/lib/mutations/collateralTypes";
import type { CollateralMediaField, CollateralMediaType } from "@/types/collateralType";
import { cn } from "@/lib/utils";

const MEDIA_TYPES: { value: CollateralMediaType; label: string }[] = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
];

interface MediaFieldCardProps {
  field: CollateralMediaField;
  isEditMode: boolean;
  dragHandleProps?: Record<string, unknown> | null;
  isDragging?: boolean;
  onDelete: () => void;
}

export function MediaFieldCard({
  field,
  isEditMode,
  dragHandleProps,
  isDragging,
  onDelete,
}: MediaFieldCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(field.label);
  const [description, setDescription] = useState(field.description);
  const [mediaType, setMediaType] = useState(field.mediaType);
  const [required, setRequired] = useState(field.required);
  const [maxCount, setMaxCount] = useState(field.maxCount);

  const handleSave = () => {
    updateCollateralMediaField(field.id, {
      label,
      description,
      mediaType,
      required,
      maxCount: Math.max(1, maxCount),
    });
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card transition-opacity",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2 rounded-t-lg border-b border-border bg-muted/30 px-3 py-2">
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
        <button
          type="button"
          className="flex flex-1 items-center gap-2 py-1 text-left"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          <span className="font-medium text-foreground">{field.label}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {field.mediaType}
          </span>
          {field.required && (
            <span className="text-xs text-muted-foreground">Required</span>
          )}
          <span className="text-xs text-muted-foreground">
            max {field.maxCount}
          </span>
        </button>
        {isEditMode && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Edit media field"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              aria-label="Delete media field"
              onClick={() => {
                if (confirm("Remove this media field?")) {
                  deleteCollateralMediaField(field.id);
                  onDelete();
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
      {(expanded || editing) && (
        <div className="space-y-3 p-4">
          {editing ? (
            <>
              <div>
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Media Type</label>
                <select
                  value={mediaType}
                  onChange={(e) =>
                    setMediaType(e.target.value as CollateralMediaType)
                  }
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {MEDIA_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-xs text-muted-foreground">
                  How is this asset used? This is passed to the AI.
                </p>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={10000}
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
              <div>
                <label className="text-sm font-medium">Max Count</label>
                <p className="text-xs text-muted-foreground">
                  How many files can be uploaded for this slot?
                </p>
                <input
                  type="number"
                  min={1}
                  value={maxCount}
                  onChange={(e) =>
                    setMaxCount(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="mt-1 h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLabel(field.label);
                    setDescription(field.description);
                    setMediaType(field.mediaType);
                    setRequired(field.required);
                    setMaxCount(field.maxCount);
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {field.description || "—"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
