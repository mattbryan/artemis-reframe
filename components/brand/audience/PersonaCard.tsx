"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BrandPersona } from "@/types/brand";

const MAX_TEXTAREA = 10000;

interface PersonaCardProps {
  persona: BrandPersona;
  onBlurUpdate: (
    updates: Partial<{
      name: string;
      personaType: string;
      priorities: string;
      resonantLanguage: string;
      avoidedLanguage: string;
      dealContexts: string;
    }>
  ) => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function PersonaCard({
  persona,
  onBlurUpdate,
  onDelete,
  dragHandleProps,
}: PersonaCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-border bg-card transition-opacity">
      <div className="flex items-center gap-1 rounded-t-lg border-b border-border bg-muted/30 px-3 py-2">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Drag to reorder"
          {...(dragHandleProps ?? {})}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex flex-1 items-center gap-2 py-1 text-left"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="flex-1 font-medium text-foreground">
            {persona.name || "Unnamed persona"}
          </span>
          {persona.personaType && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {persona.personaType}
            </span>
          )}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
          aria-label="Delete persona"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {expanded && (
        <div className="space-y-4 p-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground">
                Persona Name
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Institutional Buyer"
                defaultValue={persona.name}
                onBlur={(e) => onBlurUpdate({ name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground">
                Persona Type
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Private Equity, 1031 Exchange Investor"
                defaultValue={persona.personaType}
                onBlur={(e) => onBlurUpdate({ personaType: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              What They Prioritize
            </label>
            <p className="text-xs text-muted-foreground">
              What does this persona care about most in a deal? IRR, cash flow,
              tax efficiency, speed of close?
            </p>
            <textarea
              rows={3}
              maxLength={MAX_TEXTAREA}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={persona.priorities}
              onBlur={(e) => onBlurUpdate({ priorities: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground">
                Language That Resonates
              </label>
              <p className="text-xs text-muted-foreground">
                Framing, terminology, and tone that works with this audience
              </p>
              <textarea
                rows={3}
                maxLength={MAX_TEXTAREA}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue={persona.resonantLanguage}
                onBlur={(e) =>
                  onBlurUpdate({ resonantLanguage: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground">
                Language to Avoid
              </label>
              <p className="text-xs text-muted-foreground">
                What falls flat, feels off, or alienates this persona
              </p>
              <textarea
                rows={3}
                maxLength={MAX_TEXTAREA}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue={persona.avoidedLanguage}
                onBlur={(e) =>
                  onBlurUpdate({ avoidedLanguage: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              Relevant Deal Types
            </label>
            <p className="text-xs text-muted-foreground">
              Which deal types or collateral formats is this persona relevant
              for? e.g. Value-add multifamily OMs, NNN single-tenant flyers
            </p>
            <textarea
              rows={2}
              maxLength={MAX_TEXTAREA}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={persona.dealContexts}
              onBlur={(e) => onBlurUpdate({ dealContexts: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
