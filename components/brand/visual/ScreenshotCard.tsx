"use client";

import type { BrandScreenshot, BrandScreenshotMemoryType } from "@/types/brand";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MEMORY_TYPES: { value: BrandScreenshotMemoryType; label: string }[] = [
  { value: "identity", label: "Identity" },
  { value: "voice", label: "Voice" },
  { value: "visual", label: "Visual" },
  { value: "audience", label: "Audience" },
];

interface ScreenshotCardProps {
  screenshot: BrandScreenshot;
  onCaptionBlur: (caption: string) => void;
  onMemoryTypeChange: (memoryType: BrandScreenshotMemoryType) => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function ScreenshotCard({
  screenshot,
  onCaptionBlur,
  onMemoryTypeChange,
  onDelete,
  dragHandleProps,
}: ScreenshotCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative aspect-video w-full bg-muted" {...dragHandleProps}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshot.url}
          alt=""
          className="h-full w-full object-cover"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Delete screenshot"
          onClick={onDelete}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-2">
        <select
          className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={screenshot.memoryType}
          onChange={(e) =>
            onMemoryTypeChange(e.target.value as BrandScreenshotMemoryType)
          }
        >
          {MEMORY_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <textarea
          rows={2}
          className="w-full resize-none rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Why does this work? What should the AI learn from it?"
          defaultValue={screenshot.caption}
          onBlur={(e) => onCaptionBlur(e.target.value)}
        />
      </div>
    </div>
  );
}
