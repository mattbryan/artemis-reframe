"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useBriefs } from "@/lib/hooks/useBriefs";
import { useBriefStore } from "@/store/briefStore";
import { BriefDetailPanel } from "@/components/design-briefs/BriefDetailPanel";

export default function DesignBriefSlugPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : null;
  const { data: briefs } = useBriefs();
  const setActiveBriefId = useBriefStore((s) => s.setActiveBriefId);

  useEffect(() => {
    if (!slug || !briefs?.length) return;
    const brief = briefs.find((b) => b.slug === slug);
    if (brief) setActiveBriefId(brief.id);
  }, [slug, briefs, setActiveBriefId]);

  return (
    <div className="h-full">
      <BriefDetailPanel />
    </div>
  );
}
