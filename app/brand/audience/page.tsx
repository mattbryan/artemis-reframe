"use client";

import { useBrand } from "@/lib/hooks/useBrand";
import { useBrandStore } from "@/store/brandStore";
import { PersonaList } from "@/components/brand/audience/PersonaList";

export default function BrandAudiencePage() {
  const { brand, personas, isLoading } = useBrand();
  const setSavingState = useBrandStore((s) => s.setSavingState);

  if (isLoading || !brand) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">
          Client & Buyer Personas
        </h2>
        <p className="text-xs text-muted-foreground">
          Define the distinct audiences this brand speaks to. Each persona
          becomes a selectable context at generation time — so the AI knows how
          to adjust tone, emphasis, and language for each reader type.
        </p>
        <PersonaList
          brandId={brand.id}
          personas={personas}
          setSavingState={setSavingState}
        />
      </section>
    </div>
  );
}
