"use client";

import { BriefListPanel } from "@/components/design-briefs/BriefListPanel";

export default function DesignBriefsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1">
      <BriefListPanel />
      <div className="min-w-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
