"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  updateBriefScreenshot,
  deleteBriefScreenshot,
} from "@/lib/mutations/briefScreenshots";
import type { BriefScreenshot, BriefSection } from "@/types/brief";

interface ScreenshotCardProps {
  screenshot: BriefScreenshot;
  sections: BriefSection[];
  onDelete: () => void;
}

export function ScreenshotCard({
  screenshot,
  sections,
  onDelete,
}: ScreenshotCardProps) {
  const [caption, setCaption] = useState(screenshot.caption);
  const [editingCaption, setEditingCaption] = useState(false);

  const handleCaptionBlur = () => {
    setEditingCaption(false);
    if (caption !== screenshot.caption) {
      updateBriefScreenshot(screenshot.id, { caption });
    }
  };

  const toggleSection = (sectionId: string) => {
    const next = screenshot.sectionIds.includes(sectionId)
      ? screenshot.sectionIds.filter((id) => id !== sectionId)
      : [...screenshot.sectionIds, sectionId];
    updateBriefScreenshot(screenshot.id, { sectionIds: next });
  };

  const handleDelete = () => {
    if (confirm("Remove this screenshot?")) {
      deleteBriefScreenshot(screenshot.id);
      onDelete();
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative aspect-video w-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshot.url}
          alt={screenshot.caption || "Screenshot"}
          className="h-full w-full object-cover"
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Delete screenshot"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-2">
        {editingCaption ? (
          <input
            type="text"
            className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={handleCaptionBlur}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="w-full text-left text-sm text-foreground hover:text-muted-foreground"
            onClick={() => setEditingCaption(true)}
          >
            {caption || "Add caption…"}
          </button>
        )}
        {sections.length > 0 && (
          <div className="mt-1.5 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Relevant to sections
            </span>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {sections.map((sec) => (
                <label
                  key={sec.id}
                  className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={screenshot.sectionIds.includes(sec.id)}
                    onChange={() => toggleSection(sec.id)}
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  {sec.type} #{sec.order + 1}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
