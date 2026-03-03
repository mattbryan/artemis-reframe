"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { createBrief } from "@/lib/mutations/briefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BriefStatus } from "@/types/brief";
import { cn } from "@/lib/utils";

export default function NewBriefPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [usageGuidelines, setUsageGuidelines] = useState("");
  const [collateralTypeIds, setCollateralTypeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<BriefStatus>("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: ctData } = db.useQuery({
    collateralType: { $: { where: { isArchived: false } } },
  });
  const collateralTypes = useMemo(() => {
    const raw = ctData?.collateralType ?? [];
    const list = Array.isArray(raw) ? raw : Object.values(raw as Record<string, unknown>);
    return (list as { id: string; name: string }[])
      .filter((t) => t && t.id)
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }, [ctData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const slug = await createBrief({
        name: name.trim(),
        description: description.trim(),
        usageGuidelines: usageGuidelines.trim(),
        collateralTypeIds: collateralTypeIds.length > 0 ? collateralTypeIds : undefined,
        status,
      });
      router.push(`/design-briefs/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create brief");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-xl font-semibold text-foreground">New Design Brief</h1>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Brief name"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Usage Guidelines
          </label>
          <textarea
            className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={usageGuidelines}
            onChange={(e) => setUsageGuidelines(e.target.value)}
            placeholder="When to use this brief"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Collateral Types
          </label>
          <p className="mb-2 text-xs text-muted-foreground">
            Select which collateral types this brief applies to. It will appear in the Workbench when building those types.
          </p>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3">
            {collateralTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No collateral types defined.</p>
            ) : (
              collateralTypes.map((ct) => {
                const checked = collateralTypeIds.includes(ct.id);
                return (
                  <label
                    key={ct.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent/50",
                      checked && "bg-accent/30"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setCollateralTypeIds((prev) =>
                          checked ? prev.filter((id) => id !== ct.id) : [...prev, ct.id]
                        );
                      }}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span>{ct.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BriefStatus)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create Brief"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/design-briefs")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
