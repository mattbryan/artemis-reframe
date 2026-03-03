"use client";

import { useEffect } from "react";
import { TypeListPanel } from "@/components/collateral-types/TypeListPanel";
import { seedCollateralDefaults } from "@/lib/seedCollateralDefaults";
import { useCollateralTypes } from "@/lib/hooks/useCollateralTypes";

export default function CollateralTypesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: types, isLoading } = useCollateralTypes({ showArchived: true });

  useEffect(() => {
    if (isLoading || (types?.length ?? 0) > 0) return;
    seedCollateralDefaults();
  }, [isLoading, types?.length]);

  return (
    <div className="flex h-full min-h-0 flex-1">
      <TypeListPanel />
      <div className="min-w-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
