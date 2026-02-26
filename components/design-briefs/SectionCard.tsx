"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronRight, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  updateBriefSection,
  deleteBriefSection,
} from "@/lib/mutations/briefSections";
import type { BriefSection, BriefSectionType } from "@/types/brief";
import { cn } from "@/lib/utils";
import { BRIEF_SECTION_TYPES } from "@/lib/briefUtils";

const SECTION_BADGE_CLASS: Record<BriefSectionType, string> = {
  tokens: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  "component-spec": "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  "layout-ref": "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  principles: "bg-green-500/20 text-green-600 dark:text-green-400",
  prompt: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  custom: "bg-muted text-muted-foreground",
};

interface SectionCardProps {
  section: BriefSection;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown> | null;
  isDragging?: boolean;
}

export function SectionCard({
  section,
  onDelete,
  dragHandleProps,
  isDragging,
}: SectionCardProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(section.body);

  const badgeClass = SECTION_BADGE_CLASS[section.type] ?? SECTION_BADGE_CLASS.custom;
  const typeLabel = section.type.replace(/-/g, " ");

  const handleSaveBody = () => {
    if (body !== section.body) {
      updateBriefSection(section.id, { body });
    }
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card transition-opacity",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-1 rounded-t-lg border-b border-border bg-muted/30 px-3 py-2">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Drag to reorder"
          {...(dragHandleProps ?? {})}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex flex-1 items-center gap-2 py-1 text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span
            className={cn(
              "rounded px-2 py-0.5 text-xs font-medium",
              badgeClass
            )}
          >
            {typeLabel}
          </span>
          <span className="text-xs text-muted-foreground">#{section.order + 1}</span>
        </button>
        {!editing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Edit body"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
          aria-label="Delete section"
          onClick={() => {
            if (confirm("Delete this section?")) {
              deleteBriefSection(section.id);
              onDelete();
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {open && (
        <div className="p-3">
          {editing ? (
            <div className="space-y-2">
              <textarea
                className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={10000}
                rows={10}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveBody}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBody(section.body);
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground">
              {section.body ? (
                <ReactMarkdown>{section.body}</ReactMarkdown>
              ) : (
                <span className="text-muted-foreground">No content</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
