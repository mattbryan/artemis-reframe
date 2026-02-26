"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ColorIntent } from "@/types/brand";
import { parseColorIntents } from "@/lib/brandJson";
import { ColorIntentRow } from "./ColorIntentRow";

interface ColorIntentSectionProps {
  colorIntentsJson: string;
  visualId: string;
  onSave: (visualId: string, updates: { colorIntents: string }) => Promise<void>;
}

export function ColorIntentSection({
  colorIntentsJson,
  visualId,
  onSave,
}: ColorIntentSectionProps) {
  const [intents, setIntents] = useState<ColorIntent[]>(() =>
    parseColorIntents(colorIntentsJson)
  );

  const persist = useCallback(
    (next: ColorIntent[]) => {
      onSave(visualId, { colorIntents: JSON.stringify(next) });
    },
    [visualId, onSave]
  );

  const handleChange = useCallback(
    (index: number, updates: Partial<ColorIntent>) => {
      const next = intents.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      );
      setIntents(next);
      persist(next);
    },
    [intents, persist]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const next = intents.filter((_, i) => i !== index);
      setIntents(next);
      persist(next);
    },
    [intents, persist]
  );

  const handleAdd = useCallback(() => {
    const next = [...intents, { hex: "#000000", name: "", intent: "" }];
    setIntents(next);
    persist(next);
  }, [intents, persist]);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-foreground">
        Color Palette & Intent
      </h2>
      <p className="text-xs text-muted-foreground">
        For each color, define not just the value but its role. These intent
        descriptions — not hex codes — are what guide generation.
      </p>
      <div className="flex flex-col gap-3">
        {intents.map((item, i) => (
          <ColorIntentRow
            key={i}
            intent={item}
            index={i}
            onChange={handleChange}
            onRemove={handleRemove}
          />
        ))}
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Color
        </Button>
      </div>
    </section>
  );
}
