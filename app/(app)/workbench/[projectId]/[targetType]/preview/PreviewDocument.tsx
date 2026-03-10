"use client";

import React from "react";
import { PreviewCover } from "./PreviewCover";
import { PreviewExclusivelyListedBy } from "./PreviewExclusivelyListedBy";
import { PreviewTableOfContents } from "./PreviewTableOfContents";
import { PreviewInvestmentHighlights } from "./PreviewInvestmentHighlights";
import { PreviewAerialMaps } from "./PreviewAerialMaps";
import { PreviewSitePlan } from "./PreviewSitePlan";
import { PreviewPropertySummary } from "./PreviewPropertySummary";
import { PreviewFinancialSummary } from "./PreviewFinancialSummary";
import { PreviewTenantOverview } from "./PreviewTenantOverview";
import { PreviewMarketOverview } from "./PreviewMarketOverview";
import { PreviewGenericSection } from "./PreviewGenericSection";
import type { GeneratedOutputContent, GeneratedSection } from "@/types/generation";
import { cn } from "@/lib/utils";

const SECTION_MAP: Record<
  string,
  (props: { fields: Record<string, string>; narrative: string }) => React.ReactNode
> = {
  cover: (p) => <PreviewCover {...p} />,
  "exclusively-listed-by": (p) => <PreviewExclusivelyListedBy {...p} />,
  "table-of-contents": (p) => <PreviewTableOfContents {...p} />,
  "investment-highlights": (p) => <PreviewInvestmentHighlights {...p} />,
  "aerial-maps": (p) => <PreviewAerialMaps {...p} />,
  "site-plan": (p) => <PreviewSitePlan {...p} />,
  "property-summary": (p) => <PreviewPropertySummary {...p} />,
  "financial-summary": (p) => <PreviewFinancialSummary {...p} />,
  "tenant-overview": (p) => <PreviewTenantOverview {...p} />,
  "market-overview": (p) => <PreviewMarketOverview {...p} />,
};

interface PreviewDocumentProps {
  content: GeneratedOutputContent;
  activeSectionId: string | null;
}

export const PreviewDocument = React.memo(function PreviewDocument({
  content,
  activeSectionId,
}: PreviewDocumentProps) {
  const sections = content.sections ?? [];

  return (
    <div className="preview-document w-full max-w-[900px] rounded-sm bg-white shadow-lg">
      {sections.map((section: GeneratedSection) => {
        const Comp = SECTION_MAP[section.sectionId];
        const isActive = activeSectionId === section.sectionId;
        const fields = section.fields ?? {};
        const narrative = section.narrative ?? "";

        return (
          <div
            key={section.sectionId}
            data-section-id={section.sectionId}
            className={cn(
              "transition-shadow duration-200",
              isActive && "ring-2 ring-[#2d7dd2] ring-offset-2"
            )}
          >
            {Comp ? (
              <Comp fields={fields} narrative={narrative} />
            ) : (
              <PreviewGenericSection
                sectionName={section.sectionName}
                fields={fields}
                narrative={narrative}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});
