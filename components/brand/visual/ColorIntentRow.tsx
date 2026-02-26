"use client";

import type { ColorIntent } from "@/types/brand";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ColorIntentRowProps {
  intent: ColorIntent;
  index: number;
  onChange: (index: number, updates: Partial<ColorIntent>) => void;
  onRemove: (index: number) => void;
}

export function ColorIntentRow({ intent, index, onChange, onRemove }: ColorIntentRowProps) {
  const hex = intent.hex.startsWith("#") ? intent.hex : `#${intent.hex}`;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
      <button
        type="button"
        className="h-8 w-8 shrink-0 rounded border border-border"
        style={{ backgroundColor: hex }}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "color";
          input.value = hex;
          input.oninput = () => onChange(index, { hex: input.value });
          input.click();
        }}
        aria-label="Pick color"
      />
      <input
        type="text"
        className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="#000000"
        value={hex}
        onChange={(e) => onChange(index, { hex: e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}` })}
        onBlur={(e) => onChange(index, { hex: e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}` })}
      />
      <input
        type="text"
        className="min-w-[100px] flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="e.g. Primary Navy"
        value={intent.name}
        onChange={(e) => onChange(index, { name: e.target.value })}
        onBlur={(e) => onChange(index, { name: e.target.value })}
      />
      <input
        type="text"
        className="min-w-[180px] flex-[2] rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="e.g. Authority sections, cover pages"
        value={intent.intent}
        onChange={(e) => onChange(index, { intent: e.target.value })}
        onBlur={(e) => onChange(index, { intent: e.target.value })}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onRemove(index)}
        aria-label="Remove color"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
