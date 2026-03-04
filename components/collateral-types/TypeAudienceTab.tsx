"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useBrand } from "@/lib/hooks/useBrand";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export interface TypeAudienceTabProps {
  collateralTypeId: string;
  linkedPersonaIds: string[];
}

export function TypeAudienceTab({
  collateralTypeId,
  linkedPersonaIds,
}: TypeAudienceTabProps) {
  const { personas } = useBrand();
  const linkedSet = new Set(linkedPersonaIds);

  // Optimistic state: show toggle immediately, clear when server state catches up (must be declared before use)
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const effectiveSelectedCount = personas.filter((p) =>
    p.id in optimistic ? optimistic[p.id] : linkedSet.has(p.id)
  ).length;

  useEffect(() => {
    setOptimistic((prev) => {
      const serverSet = new Set(linkedPersonaIds);
      let changed = false;
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (serverSet.has(id) === next[id]) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [linkedPersonaIds]);

  const handleToggle = useCallback(
    async (personaId: string, checked: boolean) => {
      setOptimistic((prev) => ({ ...prev, [personaId]: checked }));
      try {
        if (checked) {
          await db.transact([
            db.tx.collateralType[collateralTypeId].link({ personas: personaId }),
          ]);
        } else {
          await db.transact([
            db.tx.collateralType[collateralTypeId].unlink({ personas: personaId }),
          ]);
        }
      } catch {
        setOptimistic((prev) => ({ ...prev, [personaId]: !checked }));
      }
    },
    [collateralTypeId]
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">
          Relevant Audiences
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the brand personas this collateral type is intended to reach.
          Only selected audiences will be included in AI generation and Cowork
          Packages.
        </p>
      </div>

      {personas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No audiences defined. Add personas in Brand & Philosophy → Audience.
        </p>
      ) : (
        <ul className="space-y-3">
          {personas.map((persona) => {
            const isChecked =
              persona.id in optimistic
                ? optimistic[persona.id]
                : linkedSet.has(persona.id);
            return (
              <li key={persona.id}>
                <Card
                  className={cn(
                    "transition-colors",
                    isChecked && "ring-2 ring-primary/50"
                  )}
                >
                  <CardContent className="relative p-4 pr-10">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        handleToggle(persona.id, e.target.checked)
                      }
                      className="absolute right-3 top-3 h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={`Select ${persona.name} for this collateral type`}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">
                          {persona.name || "Unnamed persona"}
                        </span>
                        {persona.personaType && (
                          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {persona.personaType}
                          </span>
                        )}
                      </div>
                      {persona.priorities && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {persona.priorities}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {personas.length > 0 && effectiveSelectedCount === 0 && (
        <p className="text-sm text-muted-foreground">
          When no audiences are selected, all brand personas are included.
        </p>
      )}
    </div>
  );
}
