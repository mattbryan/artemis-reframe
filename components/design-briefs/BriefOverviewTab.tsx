"use client";

import { useActiveBrief } from "@/lib/hooks/useActiveBrief";
import { updateBrief, setDefaultBrief } from "@/lib/mutations/briefs";
import { useState, useCallback, useEffect } from "react";
import { ExternalLink } from "lucide-react";

export function BriefOverviewTab() {
  const { brief, sections, screenshots, meta } = useActiveBrief();
  const [saved, setSaved] = useState(false);
  const [description, setDescription] = useState(brief?.description ?? "");
  const [usageGuidelines, setUsageGuidelines] = useState(
    brief?.usageGuidelines ?? ""
  );

  useEffect(() => {
    if (brief) {
      setDescription(brief.description ?? "");
      setUsageGuidelines(brief.usageGuidelines ?? "");
    }
  }, [brief]);

  const showSaved = useCallback(() => {
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleDescriptionBlur = useCallback(() => {
    if (!brief || description === brief.description) return;
    updateBrief(brief.id, { description }).then(showSaved);
  }, [brief, description, showSaved]);

  const handleUsageGuidelinesBlur = useCallback(() => {
    if (!brief || usageGuidelines === brief.usageGuidelines) return;
    updateBrief(brief.id, { usageGuidelines }).then(showSaved);
  }, [brief, usageGuidelines, showSaved]);

  if (!brief) return null;

  const tagsList = (meta?.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const figmaUrl = meta?.figmaFileUrl?.trim();

  return (
    <div className="space-y-6">
      {saved && (
        <p
          className="animate-in fade-in text-sm text-green-600 dark:text-green-400"
          role="status"
        >
          Saved
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          className="min-h-[120px] w-full max-w-2xl rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder="Short summary of this brief"
          maxLength={10000}
          rows={4}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Usage Guidelines
        </label>
        <textarea
          className="min-h-[120px] w-full max-w-2xl rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={usageGuidelines}
          onChange={(e) => setUsageGuidelines(e.target.value)}
          onBlur={handleUsageGuidelinesBlur}
          placeholder="When to use this brief vs others"
          maxLength={10000}
          rows={4}
        />
      </div>
      {tagsList.length > 0 && (
        <div>
          <span className="text-sm font-medium text-foreground">Tags</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {tagsList.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-secondary px-3 py-0.5 text-xs text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Edit tags in the Metadata tab.
          </p>
        </div>
      )}
      {figmaUrl && (
        <div>
          <span className="text-sm font-medium text-foreground">
            Figma source
          </span>
          <a
            href={figmaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {figmaUrl}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={brief.isDefault}
            onChange={() => setDefaultBrief(brief.id)}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm font-medium text-foreground">
            Active Brief (default for collateral)
          </span>
        </label>
      </div>
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span>{sections.length} sections</span>
        <span>{screenshots.length} screenshots</span>
        <span>Last updated {new Date(brief.updatedAt).toLocaleString()}</span>
      </div>
    </div>
  );
}
