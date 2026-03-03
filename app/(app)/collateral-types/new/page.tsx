"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCollateralType } from "@/lib/mutations/collateralTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewCollateralTypePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const slug = await createCollateralType({
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
      });
      router.push(`/collateral-types/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create type");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-xl font-semibold text-foreground">
        New Collateral Type
      </h1>
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
            placeholder="e.g. Multifamily Offering Memorandum"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Category
          </label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Multifamily, Industrial"
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
            placeholder="What this collateral type produces and when to use it"
            maxLength={10000}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create Type"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/collateral-types")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
