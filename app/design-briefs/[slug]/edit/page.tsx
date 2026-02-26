"use client";

import { useParams, useRouter } from "next/navigation";
import { useBriefStore } from "@/store/briefStore";
import { useEffect } from "react";
import { useBriefs } from "@/lib/hooks/useBriefs";
import { BriefMetadataTab } from "@/components/design-briefs/BriefMetadataTab";

export default function EditBriefPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : null;
  const { data: briefs } = useBriefs();
  const setActiveBriefId = useBriefStore((s) => s.setActiveBriefId);
  const setActiveTab = useBriefStore((s) => s.setActiveTab);

  useEffect(() => {
    if (!slug || !briefs?.length) return;
    const brief = briefs.find((b) => b.slug === slug);
    if (brief) {
      setActiveBriefId(brief.id);
      setActiveTab("metadata");
    }
  }, [slug, briefs, setActiveBriefId, setActiveTab]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => router.push(slug ? `/design-briefs/${slug}` : "/design-briefs")}
        >
          ← Back to brief
        </button>
      </div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">
        Edit metadata
      </h1>
      <BriefMetadataTab />
    </div>
  );
}
