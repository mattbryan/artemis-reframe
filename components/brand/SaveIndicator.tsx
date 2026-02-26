"use client";

import { useEffect } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { useBrandStore } from "@/store/brandStore";
import { cn } from "@/lib/utils";
import type { SavingState } from "@/types/brand";
import type { PolicySavingState } from "@/types/policy";

type SaveIndicatorState = SavingState | PolicySavingState;

interface SaveIndicatorProps {
  /** When provided, use these instead of brand store (e.g. Policy page). */
  savingState?: SaveIndicatorState;
  setSavingState?: (state: SaveIndicatorState) => void;
}

export function SaveIndicator({ savingState: propState, setSavingState: propSetState }: SaveIndicatorProps = {}) {
  const brandState = useBrandStore((s) => s.savingState);
  const brandSetState = useBrandStore((s) => s.setSavingState);
  const savingState = propState ?? brandState;
  const setSavingState = propSetState ?? brandSetState;

  useEffect(() => {
    if (savingState !== "saved") return;
    const t = setTimeout(() => setSavingState("idle"), 2000);
    return () => clearTimeout(t);
  }, [savingState, setSavingState]);

  if (savingState === "idle") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm font-medium",
        savingState === "saving" && "text-muted-foreground",
        savingState === "saved" && "text-foreground animate-in fade-in duration-200",
        savingState === "error" && "text-destructive"
      )}
      role="status"
      aria-live="polite"
    >
      {savingState === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>Saving…</span>
        </>
      )}
      {savingState === "saved" && (
        <>
          <Check className="h-4 w-4" aria-hidden />
          <span>Saved</span>
        </>
      )}
      {savingState === "error" && (
        <>
          <AlertCircle className="h-4 w-4" aria-hidden />
          <span>Error saving</span>
          <button
            type="button"
            onClick={() => setSavingState("idle")}
            className="ml-1 underline focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Dismiss
          </button>
        </>
      )}
    </div>
  );
}
