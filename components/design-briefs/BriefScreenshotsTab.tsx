"use client";

import { useCallback, useState } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { useActiveBrief } from "@/lib/hooks/useActiveBrief";
import { createBriefScreenshot } from "@/lib/mutations/briefScreenshots";
import { uploadImage } from "@/lib/uploadImage";
import { ScreenshotCard } from "./ScreenshotCard";
import { cn } from "@/lib/utils";

export function BriefScreenshotsTab() {
  const { brief, sections, screenshots } = useActiveBrief();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      const fileArray = files ? Array.from(files) : [];
      if (!brief || fileArray.length === 0) return;
      setUploading(true);
      try {
        const order = screenshots.length;
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          if (!file.type.startsWith("image/")) continue;
          const url = await uploadImage(file);
          await createBriefScreenshot({
            briefId: brief.id,
            sectionIds: [],
            url,
            caption: "",
            order: order + i,
          });
        }
      } catch (err) {
        console.error(err);
        alert("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [brief, screenshots.length]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files ? Array.from(e.dataTransfer.files) : null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const fileArray = files ? Array.from(files) : [];
    e.target.value = "";
    handleFiles(fileArray);
  };

  if (!brief) return null;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          id="brief-screenshot-upload"
          onChange={handleInputChange}
          disabled={uploading}
        />
        <label
          htmlFor="brief-screenshot-upload"
          className="flex cursor-pointer flex-col items-center gap-2"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Drag and drop images here, or click to upload (multiple at once)
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium">
            <ImagePlus className="h-4 w-4" />
            Upload Screenshots
          </span>
        </label>
        {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2">
        {screenshots.map((screenshot) => (
          <ScreenshotCard
            key={screenshot.id}
            screenshot={screenshot}
            sections={sections}
            onDelete={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
