"use client";

import * as React from "react";

export type SectionType = "build" | "train" | "feed";

interface SectionContextValue {
  activeSection: SectionType;
  sectionLabel: string;
  /** Scaffold for future permissions — e.g. canEdit, canDelete */
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
}

const SectionContext = React.createContext<SectionContextValue | null>(null);

export function SectionProvider({
  children,
  activeSection,
  sectionLabel,
  permissions = { canEdit: true, canDelete: false },
}: {
  children: React.ReactNode;
  activeSection: SectionType;
  sectionLabel: string;
  permissions?: SectionContextValue["permissions"];
}) {
  const value: SectionContextValue = React.useMemo(
    () => ({
      activeSection,
      sectionLabel,
      permissions,
    }),
    [activeSection, sectionLabel, permissions]
  );
  return (
    <SectionContext.Provider value={value}>{children}</SectionContext.Provider>
  );
}

export function useSectionContext(): SectionContextValue {
  const ctx = React.useContext(SectionContext);
  if (!ctx) {
    throw new Error("useSectionContext must be used within SectionProvider");
  }
  return ctx;
}
