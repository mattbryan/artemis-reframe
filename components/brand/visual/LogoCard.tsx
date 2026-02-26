"use client";

import type { BrandLogo, BrandLogoContext } from "@/types/brand";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const CONTEXT_OPTIONS: { value: BrandLogoContext; label: string }[] = [
  { value: "light", label: "Light backgrounds" },
  { value: "dark", label: "Dark backgrounds" },
];

interface LogoCardProps {
  logo: BrandLogo;
  onContextChange: (context: BrandLogoContext) => void;
  onDelete: () => void;
}

export function LogoCard({ logo, onContextChange, onDelete }: LogoCardProps) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative flex flex h-24 min-h-0 items-center justify-center bg-muted/50 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.url}
          alt="Logo"
          className="max-h-full max-w-full object-contain"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Delete logo"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="border-t border-border px-3 py-2">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Context
        </label>
        <select
          value={logo.context}
          onChange={(e) => onContextChange(e.target.value as BrandLogoContext)}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {CONTEXT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
