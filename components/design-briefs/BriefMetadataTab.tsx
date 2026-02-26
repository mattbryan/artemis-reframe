"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { useActiveBrief } from "@/lib/hooks/useActiveBrief";
import { useTags } from "@/lib/hooks/useTags";
import { updateBrief } from "@/lib/mutations/briefs";
import { upsertBriefMeta } from "@/lib/mutations/briefMeta";
import { formatTagDisplay } from "@/types/tag";
import type { Tag } from "@/types/tag";
import { Input } from "@/components/ui/input";

function TagInput({
  value,
  onChange,
  placeholder,
  suggestions: suggestionList,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  /** Optional list of tag strings (e.g. from Tag Manager) for autocomplete */
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredSuggestions = useMemo(() => {
    if (!suggestionList?.length || !input.trim()) return [];
    const q = input.trim().toLowerCase();
    const unique = Array.from(
      new Set(suggestionList.filter((s) => !value.includes(s)))
    );
    return unique.filter((s) => s.toLowerCase().includes(q)).slice(0, 10);
  }, [suggestionList, input, value]);

  const addTag = useCallback(
    (tag: string) => {
      const t = tag.trim();
      if (!t || value.includes(t)) return;
      onChange([...value, t]);
      setInput("");
      setOpen(false);
      setHighlightedIndex(0);
    },
    [value, onChange]
  );

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[highlightedIndex] ?? filteredSuggestions[0]);
        return;
      }
      addTag(input);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlightedIndex((i) =>
        Math.min(i + 1, filteredSuggestions.length - 1)
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    setOpen(filteredSuggestions.length > 0);
    setHighlightedIndex(0);
  }, [filteredSuggestions.length]);

  useEffect(() => {
    if (!open || filteredSuggestions.length === 0) return;
    listRef.current?.querySelector(`[data-index="${highlightedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open, filteredSuggestions.length]);

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
          >
            {tag}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
              aria-label={`Remove ${tag}`}
              onClick={() => removeTag(tag)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="min-w-[120px] flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => filteredSuggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-expanded={open && filteredSuggestions.length > 0}
          aria-controls="tag-suggestions-list"
          id="tag-suggestions-input"
        />
      </div>
      {open && filteredSuggestions.length > 0 && (
        <ul
          id="tag-suggestions-list"
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full min-w-[200px] overflow-auto rounded-md border border-border bg-popover py-1 shadow-md"
        >
          {filteredSuggestions.map((s, i) => (
            <li
              key={s}
              role="option"
              data-index={i}
              aria-selected={i === highlightedIndex}
              className={`cursor-pointer px-3 py-1.5 text-sm ${
                i === highlightedIndex ? "bg-accent text-accent-foreground" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function parseTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function joinTags(tags: string[]): string {
  return tags.join(", ");
}

export function BriefMetadataTab() {
  const { brief, meta } = useActiveBrief();
  const { data: tagManagerTags } = useTags();
  const tagSuggestions = useMemo(
    () => (tagManagerTags ?? []).map((t) => formatTagDisplay(t as Tag)),
    [tagManagerTags]
  );
  const [saved, setSaved] = useState(false);
  const [targetAudience, setTargetAudience] = useState(meta?.targetAudience ?? "");
  const [collateralExamples, setCollateralExamples] = useState<string[]>(
    parseTags(meta?.collateralExamples ?? "")
  );
  const [figmaFileUrl, setFigmaFileUrl] = useState(meta?.figmaFileUrl ?? "");
  const [tags, setTags] = useState<string[]>(parseTags(meta?.tags ?? ""));
  const [collateralType, setCollateralType] = useState(brief?.collateralType ?? "");

  useEffect(() => {
    if (meta) {
      setTargetAudience(meta.targetAudience ?? "");
      setCollateralExamples(parseTags(meta.collateralExamples ?? ""));
      setFigmaFileUrl(meta.figmaFileUrl ?? "");
      setTags(parseTags(meta.tags ?? ""));
    }
  }, [meta]);

  useEffect(() => {
    if (brief) setCollateralType(brief.collateralType ?? "");
  }, [brief]);

  const showSaved = useCallback(() => {
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const saveMeta = useCallback(() => {
    if (!brief) return;
    upsertBriefMeta(
      brief.id,
      meta?.id ?? null,
      {
        targetAudience,
        collateralExamples: joinTags(collateralExamples),
        figmaFileUrl,
        tags: joinTags(tags),
      }
    ).then(showSaved);
  }, [brief, meta?.id, targetAudience, collateralExamples, figmaFileUrl, tags, showSaved]);

  const handleCollateralTypeBlur = useCallback(() => {
    if (!brief || collateralType === brief.collateralType) return;
    updateBrief(brief.id, { collateralType }).then(showSaved);
  }, [brief, collateralType, showSaved]);

  if (!brief) return null;

  return (
    <div className="max-w-xl space-y-6">
      {saved && (
        <p
          className="animate-in fade-in text-sm text-green-600 dark:text-green-400"
          role="status"
        >
          Saved
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Target Audience
        </label>
        <Input
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          onBlur={saveMeta}
          placeholder="e.g. Institutional investors"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Collateral Examples
        </label>
        <TagInput
          value={collateralExamples}
          onChange={(v) => {
            setCollateralExamples(v);
            if (brief && meta) {
              upsertBriefMeta(brief.id, meta.id, {
                targetAudience,
                collateralExamples: joinTags(v),
                figmaFileUrl,
                tags: joinTags(tags),
              }).then(showSaved);
            }
          }}
          placeholder="Type and press Enter"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Figma File URL
        </label>
        <div className="flex gap-2">
          <Input
            value={figmaFileUrl}
            onChange={(e) => setFigmaFileUrl(e.target.value)}
            onBlur={saveMeta}
            placeholder="https://figma.com/design/..."
          />
          {figmaFileUrl && (
            <a
              href={figmaFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center text-muted-foreground hover:text-foreground"
              aria-label="Open link"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Tags
        </label>
        <TagInput
          value={tags}
          onChange={(v) => {
            setTags(v);
            if (brief && meta) {
              upsertBriefMeta(brief.id, meta.id, {
                targetAudience,
                collateralExamples: joinTags(collateralExamples),
                figmaFileUrl,
                tags: joinTags(v),
              }).then(showSaved);
            }
          }}
          placeholder="Type to search Tag Manager tags or press Enter"
          suggestions={tagSuggestions}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Collateral Type
        </label>
        <Input
          value={collateralType}
          onChange={(e) => setCollateralType(e.target.value)}
          onBlur={handleCollateralTypeBlur}
          placeholder="e.g. Offering Memorandum, Flyer, BOV"
        />
      </div>
    </div>
  );
}
