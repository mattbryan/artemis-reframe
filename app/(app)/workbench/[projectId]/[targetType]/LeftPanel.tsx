"use client";

import { useCallback } from "react";
import { SectionCard } from "./SectionCard";
import { useEditorStore } from "@/store/editorStore";
import type { GeneratedSection } from "@/types/generation";

interface LeftPanelProps {
  outputId: string;
  sections: GeneratedSection[];
  activeSectionId: string | null;
  onSectionInView: (sectionId: string) => void;
  regeneratingSectionId: string | null;
}

export function LeftPanel({
  outputId,
  sections,
  activeSectionId,
  onSectionInView,
  regeneratingSectionId,
}: LeftPanelProps) {
  const handleIntersect = useCallback(
    (sectionId: string) => {
      onSectionInView(sectionId);
    },
    [onSectionInView]
  );

  return (
    <div className="flex w-[45%] flex-col overflow-y-auto bg-white">
      <div className="space-y-4 p-4">
        {sections.map((section) => (
          <SectionCard
            key={section.sectionId}
            outputId={outputId}
            section={section}
            isActive={activeSectionId === section.sectionId}
            onIntersect={handleIntersect}
            loading={regeneratingSectionId === section.sectionId}
          />
        ))}
      </div>
    </div>
  );
}
