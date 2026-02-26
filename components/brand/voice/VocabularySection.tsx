"use client";

import { useCallback, useState, useRef, KeyboardEvent } from "react";

const MAX_JARGON = 10000;

interface VocabularySectionProps {
  vocabularyPreferred: string;
  vocabularyAvoided: string;
  jargonStandards: string;
  voiceId: string;
  onSave: (
    voiceId: string,
    updates: Partial<{
      vocabularyPreferred: string;
      vocabularyAvoided: string;
      jargonStandards: string;
    }>
  ) => Promise<void>;
}

function parseTags(s: string): string[] {
  if (!s.trim()) return [];
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function joinTags(tags: string[]): string {
  return tags.join(", ");
}

export function VocabularySection({
  vocabularyPreferred,
  vocabularyAvoided,
  jargonStandards,
  voiceId,
  onSave,
}: VocabularySectionProps) {
  const [preferred, setPreferred] = useState(() => parseTags(vocabularyPreferred));
  const [avoided, setAvoided] = useState(() => parseTags(vocabularyAvoided));
  const [preferredInput, setPreferredInput] = useState("");
  const [avoidedInput, setAvoidedInput] = useState("");
  const preferredInputRef = useRef<HTMLInputElement>(null);
  const avoidedInputRef = useRef<HTMLInputElement>(null);

  const savePreferred = useCallback(
    (tags: string[]) => {
      onSave(voiceId, { vocabularyPreferred: joinTags(tags) });
    },
    [voiceId, onSave]
  );

  const saveAvoided = useCallback(
    (tags: string[]) => {
      onSave(voiceId, { vocabularyAvoided: joinTags(tags) });
    },
    [voiceId, onSave]
  );

  const addPreferred = useCallback(() => {
    const t = preferredInput.trim();
    if (!t) return;
    const next = [...preferred, t];
    setPreferred(next);
    setPreferredInput("");
    savePreferred(next);
    preferredInputRef.current?.focus();
  }, [preferred, preferredInput, savePreferred]);

  const addAvoided = useCallback(() => {
    const t = avoidedInput.trim();
    if (!t) return;
    const next = [...avoided, t];
    setAvoided(next);
    setAvoidedInput("");
    saveAvoided(next);
    avoidedInputRef.current?.focus();
  }, [avoided, avoidedInput, saveAvoided]);

  const removePreferred = useCallback(
    (index: number) => {
      const next = preferred.filter((_, i) => i !== index);
      setPreferred(next);
      savePreferred(next);
    },
    [preferred, savePreferred]
  );

  const removeAvoided = useCallback(
    (index: number) => {
      const next = avoided.filter((_, i) => i !== index);
      setAvoided(next);
      saveAvoided(next);
    },
    [avoided, saveAvoided]
  );

  const onKeyDownPreferred = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPreferred();
    }
  };

  const onKeyDownAvoided = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAvoided();
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-medium text-foreground">
        Vocabulary
      </h2>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Preferred Terms & Phrases
          </label>
          <p className="text-xs text-muted-foreground">
            Language this brand actively uses
          </p>
          <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background p-2">
            {preferred.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removePreferred(i)}
                  className="rounded p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              ref={preferredInputRef}
              type="text"
              className="min-w-[120px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Type and press Enter"
              value={preferredInput}
              onChange={(e) => setPreferredInput(e.target.value)}
              onKeyDown={onKeyDownPreferred}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Avoided Terms & Phrases
          </label>
          <p className="text-xs text-muted-foreground">
            Language that is off-brand or never used
          </p>
          <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background p-2">
            {avoided.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeAvoided(i)}
                  className="rounded p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              ref={avoidedInputRef}
              type="text"
              className="min-w-[120px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Type and press Enter"
              value={avoidedInput}
              onChange={(e) => setAvoidedInput(e.target.value)}
              onKeyDown={onKeyDownAvoided}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="jargon-standards" className="block text-sm font-medium text-foreground">
          CRE Terminology Standards
        </label>
        <p className="text-xs text-muted-foreground">
          Specify how this brand handles industry-specific terms. e.g. &quot;Always write
          Net Operating Income in full on first use, NOI thereafter. Never use the word
          listing — use offering or assignment.&quot;
        </p>
        <textarea
          id="jargon-standards"
          rows={5}
          maxLength={MAX_JARGON}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={jargonStandards}
          onBlur={(e) => onSave(voiceId, { jargonStandards: e.target.value })}
        />
      </div>
    </section>
  );
}
