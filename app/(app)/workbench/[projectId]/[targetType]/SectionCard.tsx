"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useEditorStore } from "@/store/editorStore";
import type { GeneratedSection } from "@/types/generation";
import { cn } from "@/lib/utils";

const TEXTAREA_KEYS = new Set([
  "narrative",
  "description",
  "summary",
  "notes",
  "overview",
  "highlight",
  "bullet",
]);
const CHAR_THRESHOLD = 80;

function isTextarea(fieldKey: string, value: string): boolean {
  if (value.length >= CHAR_THRESHOLD) return true;
  const lower = fieldKey.toLowerCase();
  return Array.from(TEXTAREA_KEYS).some((k) => lower.includes(k));
}

function camelToTitle(key: string): string {
  const withSpaces = key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase());
  return withSpaces.trim() || key;
}

interface SectionCardProps {
  outputId: string;
  section: GeneratedSection;
  isActive?: boolean;
  onIntersect?: (sectionId: string) => void;
  loading?: boolean;
}

export function SectionCard({
  outputId,
  section,
  isActive,
  onIntersect,
  loading,
}: SectionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const updateField = useEditorStore((s) => s.updateField);
  const updateNarrative = useEditorStore((s) => s.updateNarrative);

  useEffect(() => {
    if (!onIntersect || !cardRef.current) return;
    const el = cardRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            onIntersect(section.sectionId);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect, section.sectionId]);

  const fieldEntries = Object.entries(section.fields ?? {}).filter(
    ([k]) => k.toLowerCase() !== "narrative"
  );
  const narrative = section.narrative ?? "";

  return (
    <Card
      ref={cardRef}
      className={cn(
        "transition-shadow",
        isActive && "ring-2 ring-[#2d7dd2] ring-offset-2"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-semibold text-foreground">
          {section.sectionName}
        </h3>
        {loading && (
          <span className="text-xs text-muted-foreground">Regenerating…</span>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {fieldEntries.map(([fieldKey, value]) => {
          const label = camelToTitle(fieldKey);
          const useTextarea = isTextarea(fieldKey, value ?? "");

          if (useTextarea) {
            return (
              <div key={fieldKey} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {label}
                </label>
                <textarea
                  className="min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={value ?? ""}
                  onChange={(e) =>
                    updateField(outputId, section.sectionId, fieldKey, e.target.value)
                  }
                  disabled={loading}
                />
              </div>
            );
          }

          return (
            <div key={fieldKey} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {label}
              </label>
              <Input
                value={value ?? ""}
                onChange={(e) =>
                  updateField(outputId, section.sectionId, fieldKey, e.target.value)
                }
                disabled={loading}
              />
            </div>
          );
        })}

        <Separator className="my-3" />

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Narrative
          </span>
          <textarea
            className="min-h-[100px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={narrative}
            onChange={(e) =>
              updateNarrative(outputId, section.sectionId, e.target.value)
            }
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
