"use client";

import { useCallback } from "react";
import { useBrand } from "@/lib/hooks/useBrand";
import { useBrandStore } from "@/store/brandStore";
import { updateBrandVoice } from "@/lib/mutations/brand";
import { ToneDimensionsSection } from "@/components/brand/voice/ToneDimensionsSection";
import { VocabularySection } from "@/components/brand/voice/VocabularySection";
import { ExamplePairsSection } from "@/components/brand/voice/ExamplePairsSection";

const MAX_TEXTAREA = 10000;

export default function BrandVoicePage() {
  const { voice, isLoading } = useBrand();
  const setSavingState = useBrandStore((s) => s.setSavingState);

  const handleSaveVoice = useCallback(
    async (
      voiceId: string,
      updates: Parameters<typeof updateBrandVoice>[1]
    ) => {
      setSavingState("saving");
      try {
        await updateBrandVoice(voiceId, updates);
        setSavingState("saved");
      } catch {
        setSavingState("error");
      }
    },
    [setSavingState]
  );

  if (isLoading || !voice) {
    return (
      <div className="text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-10">
        <ToneDimensionsSection
          toneDimensionsJson={voice.toneDimensions}
          voiceId={voice.id}
          onSave={handleSaveVoice}
        />

        <VocabularySection
          vocabularyPreferred={voice.vocabularyPreferred}
          vocabularyAvoided={voice.vocabularyAvoided}
          jargonStandards={voice.jargonStandards}
          voiceId={voice.id}
          onSave={handleSaveVoice}
        />

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-foreground">
            Sentence Rhythm
          </h2>
          <p className="text-xs text-muted-foreground">
            Describe how this brand writes. Sentence length, whether it leads
            with data or narrative, use of fragments, rhythm patterns.
          </p>
          <textarea
            rows={4}
            maxLength={MAX_TEXTAREA}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="e.g. Short, declarative sentences. Lead with the number, then one sentence of context."
            defaultValue={voice.sentenceRhythm}
            onBlur={(e) => handleSaveVoice(voice.id, { sentenceRhythm: e.target.value })}
          />
        </section>

        <ExamplePairsSection
          examplePairsJson={voice.examplePairs}
          voiceId={voice.id}
          onSave={handleSaveVoice}
        />
      </div>
    </div>
  );
}
