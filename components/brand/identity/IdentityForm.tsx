"use client";

import { useBrand } from "@/lib/hooks/useBrand";
import { useBrandStore } from "@/store/brandStore";
import { updateBrand } from "@/lib/mutations/brand";
import { useCallback } from "react";

const MAX_TEXTAREA = 10000;

function safeValue(s: string | undefined): string {
  return s ?? "";
}

export function IdentityForm() {
  const { brand, isLoading } = useBrand();
  const setSavingState = useBrandStore((s) => s.setSavingState);

  const handleSave = useCallback(
    async (updates: Parameters<typeof updateBrand>[1]) => {
      if (!brand) return;
      setSavingState("saving");
      try {
        await updateBrand(brand.id, updates);
        setSavingState("saved");
      } catch {
        setSavingState("error");
      }
    },
    [brand, setSavingState]
  );

  if (isLoading || !brand) {
    return (
      <div className="text-muted-foreground">Loading brand…</div>
    );
  }

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const labelClass = "block text-sm font-medium text-foreground";
  const helperClass = "text-xs text-muted-foreground";

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-1">
        <label htmlFor="brand-name" className={labelClass}>
          Brand Name
        </label>
        <input
          id="brand-name"
          type="text"
          className={inputClass}
          placeholder="e.g. Matthews Real Estate"
          defaultValue={safeValue(brand.name)}
          onBlur={(e) => handleSave({ name: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="legal-name" className={labelClass}>
          Legal Entity Name
        </label>
        <p className={helperClass}>Only if different from brand name</p>
        <input
          id="legal-name"
          type="text"
          className={inputClass}
          defaultValue={safeValue(brand.legalName)}
          onBlur={(e) => handleSave({ legalName: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="tagline" className={labelClass}>
          Tagline
        </label>
        <input
          id="tagline"
          type="text"
          className={inputClass}
          defaultValue={safeValue(brand.tagline)}
          onBlur={(e) => handleSave({ tagline: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="market-position" className={labelClass}>
          Market Position Statement
        </label>
        <p className={helperClass}>
          How does this brand describe its position in the market? 1–3 sentences.
        </p>
        <textarea
          id="market-position"
          rows={3}
          maxLength={MAX_TEXTAREA}
          className={inputClass}
          defaultValue={safeValue(brand.marketPositionStatement)}
          onBlur={(e) => handleSave({ marketPositionStatement: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="geographic-markets" className={labelClass}>
          Primary Markets
        </label>
        <p className={helperClass}>
          Cities, metros, or regions this brand primarily operates in
        </p>
        <textarea
          id="geographic-markets"
          rows={2}
          maxLength={MAX_TEXTAREA}
          className={inputClass}
          defaultValue={safeValue(brand.geographicMarkets)}
          onBlur={(e) => handleSave({ geographicMarkets: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="asset-class" className={labelClass}>
          Asset Class Focus
        </label>
        <p className={helperClass}>
          e.g. Multifamily, Industrial, NNN Retail, Office
        </p>
        <textarea
          id="asset-class"
          rows={2}
          maxLength={MAX_TEXTAREA}
          className={inputClass}
          defaultValue={safeValue(brand.assetClassFocus)}
          onBlur={(e) => handleSave({ assetClassFocus: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="essence" className={labelClass}>
          Brand Essence Statement
        </label>
        <p className={helperClass}>
          Write this as a direct instruction. Start with: &quot;When generating content
          for this brand, always...&quot; — this field is the most important in the system.
        </p>
        <textarea
          id="essence"
          rows={5}
          maxLength={MAX_TEXTAREA}
          className="w-full rounded-md border border-primary/50 bg-muted/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={safeValue(brand.essenceStatement)}
          onBlur={(e) => handleSave({ essenceStatement: e.target.value })}
        />
      </div>
    </form>
  );
}
