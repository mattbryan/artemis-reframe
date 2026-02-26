"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ToneDimension } from "@/types/brand";
import { parseToneDimensions } from "@/lib/brandJson";
import { ToneDimensionSlider } from "./ToneDimensionSlider";

const DEFAULT_DIMENSIONS: ToneDimension[] = [
  { axis: "formal-conversational", label1: "Formal", label2: "Conversational", value: 5 },
  { axis: "reserved-warm", label1: "Reserved", label2: "Warm", value: 5 },
  { axis: "data-led-story-led", label1: "Data-led", label2: "Story-led", value: 5 },
  { axis: "concise-expansive", label1: "Concise", label2: "Expansive", value: 5 },
  { axis: "traditional-contemporary", label1: "Traditional", label2: "Contemporary", value: 5 },
];

interface ToneDimensionsSectionProps {
  toneDimensionsJson: string;
  voiceId: string;
  onSave: (voiceId: string, updates: { toneDimensions: string }) => Promise<void>;
}

export function ToneDimensionsSection({
  toneDimensionsJson,
  voiceId,
  onSave,
}: ToneDimensionsSectionProps) {
  const [dimensions, setDimensions] = useState<ToneDimension[]>(() => {
    const parsed = parseToneDimensions(toneDimensionsJson);
    return parsed.length > 0 ? parsed : DEFAULT_DIMENSIONS;
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (next: ToneDimension[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        debounceRef.current = null;
        await onSave(voiceId, { toneDimensions: JSON.stringify(next) });
      }, 800);
    },
    [voiceId, onSave]
  );

  useEffect(() => {
    const parsed = parseToneDimensions(toneDimensionsJson);
    if (parsed.length > 0) setDimensions(parsed);
  }, [toneDimensionsJson]);

  const handleValueChange = useCallback(
    (index: number, value: number) => {
      const next = dimensions.map((d, i) =>
        i === index ? { ...d, value: Math.max(1, Math.min(10, value)) } : d
      );
      setDimensions(next);
      persist(next);
    },
    [dimensions, persist]
  );

  const handleLabelChange = useCallback(
    (index: number, which: "label1" | "label2" | "axis", value: string) => {
      const next = dimensions.map((d, i) =>
        i === index ? { ...d, [which]: value } : d
      );
      setDimensions(next);
      persist(next);
    },
    [dimensions, persist]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const next = dimensions.filter((_, i) => i !== index);
      setDimensions(next);
      persist(next);
    },
    [dimensions, persist]
  );

  const handleAdd = useCallback(() => {
    const next = [
      ...dimensions,
      { axis: "custom", label1: "Low", label2: "High", value: 5 },
    ];
    setDimensions(next);
    persist(next);
  }, [dimensions, persist]);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-foreground">
        Tone Dimensions
      </h2>
      <p className="text-xs text-muted-foreground">
        Define where this brand sits on each axis. These calibrated values are
        more useful to AI generation than descriptive labels alone.
      </p>
      <div className="flex flex-col gap-3">
        {dimensions.map((dim, i) => (
          <ToneDimensionSlider
            key={i}
            dimension={dim}
            index={i}
            onValueChange={handleValueChange}
            onLabelChange={handleLabelChange}
            onRemove={handleRemove}
            canRemove={dimensions.length > 1}
          />
        ))}
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dimension
        </Button>
      </div>
    </section>
  );
}
