"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExamplePair } from "@/types/brand";
import { parseExamplePairs } from "@/lib/brandJson";
import { ExamplePairCard } from "./ExamplePairCard";

interface ExamplePairsSectionProps {
  examplePairsJson: string;
  voiceId: string;
  onSave: (voiceId: string, updates: { examplePairs: string }) => Promise<void>;
}

export function ExamplePairsSection({
  examplePairsJson,
  voiceId,
  onSave,
}: ExamplePairsSectionProps) {
  const [pairs, setPairs] = useState<ExamplePair[]>(() =>
    parseExamplePairs(examplePairsJson)
  );

  const persist = useCallback(
    (next: ExamplePair[]) => {
      onSave(voiceId, { examplePairs: JSON.stringify(next) });
    },
    [voiceId, onSave]
  );

  const handleBlurUpdate = useCallback(
    (index: number, updates: Partial<ExamplePair>) => {
      const next = pairs.map((p, i) => (i === index ? { ...p, ...updates } : p));
      setPairs(next);
      persist(next);
    },
    [pairs, persist]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const next = pairs.filter((_, i) => i !== index);
      setPairs(next);
      persist(next);
    },
    [pairs, persist]
  );

  const handleAdd = useCallback(() => {
    const next = [...pairs, { label: "", onBrand: "", offBrand: "" }];
    setPairs(next);
    persist(next);
  }, [pairs, persist]);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-foreground">
        On-Brand / Off-Brand Examples
      </h2>
      <p className="text-xs text-muted-foreground">
        These paired examples are the most effective way to align AI output to a
        real voice. Add at least two pairs.
      </p>
      <div className="flex flex-col gap-4">
        {pairs.map((pair, i) => (
          <div key={i} className="group">
            <ExamplePairCard
              pair={pair}
              index={i}
              onBlurUpdate={handleBlurUpdate}
              onRemove={handleRemove}
            />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Example Pair
        </Button>
      </div>
    </section>
  );
}
