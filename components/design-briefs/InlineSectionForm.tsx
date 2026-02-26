"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createBriefSection } from "@/lib/mutations/briefSections";
import type { BriefSectionType } from "@/types/brief";
import { BRIEF_SECTION_TYPES } from "@/lib/briefUtils";
import { cn } from "@/lib/utils";

interface InlineSectionFormProps {
  briefId: string;
  nextOrder: number;
  onSaved: () => void;
  onCancel: () => void;
}

export function InlineSectionForm({
  briefId,
  nextOrder,
  onSaved,
  onCancel,
}: InlineSectionFormProps) {
  const [type, setType] = useState<BriefSectionType>("custom");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createBriefSection(briefId, { type, body, order: nextOrder });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-card p-4 space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as BriefSectionType)}
          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {BRIEF_SECTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/-/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Body
        </label>
        <textarea
          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Section content (markdown supported)"
          maxLength={10000}
          rows={6}
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
