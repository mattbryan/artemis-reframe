"use client";

import { useRef, useEffect } from "react";
import { PreviewDocument } from "./preview/PreviewDocument";
import { useEditorStore } from "@/store/editorStore";
import type { GeneratedOutputContent } from "@/types/generation";

interface RightPanelProps {
  outputId: string;
  content: GeneratedOutputContent | undefined;
  activeSectionId: string | null;
}

export function RightPanel({
  outputId,
  content,
  activeSectionId,
}: RightPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeSectionId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(
      `[data-section-id="${activeSectionId}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeSectionId]);

  return (
    <div
      ref={scrollRef}
      className="flex w-[55%] flex-col overflow-y-auto bg-[#f4f4f0]"
    >
      <div className="flex min-h-full justify-center p-6">
        {content ? (
          <PreviewDocument
            content={content}
            activeSectionId={activeSectionId}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-sm">No content to preview.</p>
          </div>
        )}
      </div>
    </div>
  );
}
