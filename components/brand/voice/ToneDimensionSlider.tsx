"use client";

import type { ToneDimension } from "@/types/brand";
import { cn } from "@/lib/utils";

interface ToneDimensionSliderProps {
  dimension: ToneDimension;
  index: number;
  onValueChange: (index: number, value: number) => void;
  onLabelChange: (index: number, which: "label1" | "label2" | "axis", value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function ToneDimensionSlider({
  dimension,
  index,
  onValueChange,
  onLabelChange,
  onRemove,
  canRemove,
}: ToneDimensionSliderProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          aria-label={`Dimension ${index + 1} left label`}
          className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={dimension.label1}
          onChange={(e) => onLabelChange(index, "label1", e.target.value)}
          onBlur={(e) => onLabelChange(index, "label1", e.target.value)}
        />
        <div className="flex flex-1 items-center gap-2">
          <input
            type="range"
            min={1}
            max={10}
            value={dimension.value}
            onChange={(e) => onValueChange(index, Number(e.target.value))}
            className="h-2 flex-1 accent-primary"
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={dimension.value}
          />
          <span className="w-6 text-right text-sm font-medium tabular-nums" aria-live="polite">
            {dimension.value}
          </span>
        </div>
        <input
          type="text"
          aria-label={`Dimension ${index + 1} right label`}
          className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={dimension.label2}
          onChange={(e) => onLabelChange(index, "label2", e.target.value)}
          onBlur={(e) => onLabelChange(index, "label2", e.target.value)}
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Remove
        </button>
      )}
    </div>
  );
}
