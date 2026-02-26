"use client";

import { useEffect, useRef, useState } from "react";
import { PlusCircle } from "lucide-react";
import { usePolicies } from "@/lib/hooks/usePolicies";
import { usePolicyStore } from "@/store/policyStore";
import { seedPolicyDefaults, type DbLike } from "@/lib/seedPolicyDefaults";
import { db } from "@/lib/db";
import { SaveIndicator } from "@/components/brand/SaveIndicator";
import { RuleTypeSection } from "./RuleTypeSection";
import { AddRuleTypeForm } from "./AddRuleTypeForm";

export function PolicyPage() {
  const { typeSchemas, rules, isLoading } = usePolicies();
  const savingState = usePolicyStore((s) => s.savingState);
  const setSavingState = usePolicyStore((s) => s.setSavingState);
  const [showAddType, setShowAddType] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    if (isLoading || typeSchemas.length > 0 || seeded.current) return;
    seedPolicyDefaults(db as unknown as DbLike, typeSchemas.length)
      .then(() => {
        seeded.current = true;
      })
      .catch(() => {
        seeded.current = false;
      });
  }, [isLoading, typeSchemas.length]);

  const activeCount = rules.filter((r) => r.isActive).length;
  const typeCount = typeSchemas.filter((t) => t.isActive).length;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-card px-6 py-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-foreground">Policy & Rules</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Hard restrictions enforced on every piece of generated content. Everything here is
            globally applied and equally weighted — if it&apos;s in this section, it is always
            enforced.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-right text-sm text-muted-foreground">
            {activeCount} active {activeCount === 1 ? "rule" : "rules"} across {typeCount}{" "}
            {typeCount === 1 ? "category" : "categories"}
          </span>
          <SaveIndicator
            savingState={savingState}
            setSavingState={setSavingState}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {typeSchemas.map((schema) => (
            <RuleTypeSection key={schema.id} typeSchema={schema} />
          ))}

          {showAddType ? (
            <AddRuleTypeForm
              onAdded={() => setShowAddType(false)}
              onCancel={() => setShowAddType(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowAddType(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PlusCircle className="h-4 w-4" />
              Add Rule Type
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
