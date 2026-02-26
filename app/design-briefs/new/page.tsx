"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrief } from "@/lib/mutations/briefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BriefStatus } from "@/types/brief";

export default function NewBriefPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [usageGuidelines, setUsageGuidelines] = useState("");
  const [collateralType, setCollateralType] = useState("");
  const [status, setStatus] = useState<BriefStatus>("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        collateralType: collateralType.trim(),
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
            Collateral Type
          </label>
          <Input
            value={collateralType}
            onChange={(e) => setCollateralType(e.target.value)}
            placeholder="e.g. Offering Memorandum, Flyer"
          />
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
