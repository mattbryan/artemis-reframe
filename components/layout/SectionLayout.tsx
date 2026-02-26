"use client";

import { SectionProvider, type SectionType } from "@/lib/contexts/SectionContext";

interface SectionLayoutProps {
  children: React.ReactNode;
  activeSection: SectionType;
  sectionLabel: string;
}

/**
 * Wraps TRAIN and FEED section pages with SectionContext.
 * Provides activeSection, sectionLabel, and permissions scaffold to children.
 */
export function SectionLayout({
  children,
  activeSection,
  sectionLabel,
}: SectionLayoutProps) {
  return (
    <SectionProvider activeSection={activeSection} sectionLabel={sectionLabel}>
      {children}
    </SectionProvider>
  );
}
