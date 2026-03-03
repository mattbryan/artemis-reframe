"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCollateralTypes } from "@/lib/hooks/useCollateralTypes";
import { useCollateralTypeStore } from "@/store/collateralTypeStore";
import { TypeDetailPanel } from "@/components/collateral-types/TypeDetailPanel";

export default function CollateralTypeEditPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : null;
  const { data: types } = useCollateralTypes({ showArchived: true });
  const setActiveTypeId = useCollateralTypeStore((s) => s.setActiveTypeId);
  const setIsEditMode = useCollateralTypeStore((s) => s.setIsEditMode);

  useEffect(() => {
    if (!slug || !types?.length) return;
    const type = types.find((t) => t.slug === slug);
    if (type) {
      setActiveTypeId(type.id);
      setIsEditMode(true);
    }
  }, [slug, types, setActiveTypeId, setIsEditMode]);

  return (
    <div className="h-full">
      <TypeDetailPanel slug={slug} />
    </div>
  );
}
