"use client";

import type { ExamplePair } from "@/types/brand";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_LENGTH = 10000;

interface ExamplePairCardProps {
  pair: ExamplePair;
  index: number;
  onBlurUpdate: (index: number, updates: Partial<ExamplePair>) => void;
  onRemove: (index: number) => void;
}

export function ExamplePairCard({ pair, index, onBlurUpdate, onRemove }: ExamplePairCardProps) {
  return (
    <div className="relative rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <input
          type="text"
          className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="e.g. Executive Summary Opening"
          defaultValue={pair.label}
          onBlur={(e) => onBlurUpdate(index, { label: e.target.value })}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onRemove(index)}
          aria-label="Delete example pair"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">On-Brand</label>
          <textarea
            rows={3}
            maxLength={MAX_LENGTH}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ borderLeftWidth: 3, borderLeftColor: "#22c55e" }}
            defaultValue={pair.onBrand}
            onBlur={(e) => onBlurUpdate(index, { onBrand: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Off-Brand</label>
          <textarea
            rows={3}
            maxLength={MAX_LENGTH}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ borderLeftWidth: 3, borderLeftColor: "#ef4444" }}
            defaultValue={pair.offBrand}
            onBlur={(e) => onBlurUpdate(index, { offBrand: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
