"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBrand, UseBrandResult } from "@/lib/hooks/useBrand";
import { useBrandStore } from "@/store/brandStore";
import { createBrand } from "@/lib/mutations/brand";
import { BrandTabBar } from "@/components/brand/BrandTabBar";
import { SaveIndicator } from "@/components/brand/SaveIndicator";

function BrandLayoutInner({
  children,
  result,
}: {
  children: React.ReactNode;
  result: UseBrandResult;
}) {
  const router = useRouter();
  const setActiveBrandId = useBrandStore((s) => s.setActiveBrandId);

  const createAttempted = useRef(false);
  useEffect(() => {
    if (result.isLoading) return;
    if (result.brand) {
      setActiveBrandId(result.brand.id);
      return;
    }
    if (createAttempted.current) return;
    createAttempted.current = true;
    createBrand()
      .then((brandId) => {
        setActiveBrandId(brandId);
        router.replace("/brand/identity");
      })
      .catch(() => {
        createAttempted.current = false;
      });
  }, [result.isLoading, result.brand, setActiveBrandId, router]);

  const lastSaved =
    result.brand?.updatedAt != null
      ? new Date(result.brand.updatedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;

  if (result.isLoading && !result.brand) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2 bg-card px-6 py-5 align-middle h-[66px]">
        <h1 className="shrink-0 text-xl font-semibold text-foreground">
          Brand & Philosophy
        </h1>
        <span className="text-muted-foreground">·</span>
        <p className="truncate text-sm text-muted-foreground">
          Define how this brand thinks, sounds, and presents.
        </p>
        <div className="ml-auto flex items-center gap-2">
          <SaveIndicator />
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Updated {lastSaved}
            </span>
          )}
        </div>
      </header>
      <BrandTabBar />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {children}
      </div>
    </div>
  );
}

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = useBrand();

  return (
    <BrandLayoutInner result={result}>
      {children}
    </BrandLayoutInner>
  );
}
