"use client";

import { useCallback, useState } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandLogo, BrandLogoContext } from "@/types/brand";
import { uploadScreenshot } from "@/lib/uploadScreenshot";
import { createBrandLogo, updateBrandLogo, deleteBrandLogo } from "@/lib/mutations/brand";
import { LogoCard } from "./LogoCard";

const ACCEPT = "image/svg+xml,image/png,.svg,.png";

interface LogoUploadSectionProps {
  brandId: string;
  logos: BrandLogo[];
  setSavingState: (state: "saving" | "saved" | "error") => void;
}

export function LogoUploadSection({
  brandId,
  logos,
  setSavingState,
}: LogoUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      const fileArray = files ? Array.from(files) : [];
      const valid = fileArray.filter(
        (f) =>
          f.type === "image/svg+xml" ||
          f.type === "image/png" ||
          /\.(svg|png)$/i.test(f.name)
      );
      if (valid.length === 0) return;
      setUploading(true);
      setSavingState("saving");
      try {
        const order = logos.length;
        for (let i = 0; i < valid.length; i++) {
          const file = valid[i];
          const { url } = await uploadScreenshot(file);
          await createBrandLogo({
            brandId,
            url,
            context: "light",
            order: order + i,
          });
        }
        setSavingState("saved");
      } catch {
        setSavingState("error");
      } finally {
        setUploading(false);
      }
    },
    [brandId, logos.length, setSavingState]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files ? Array.from(e.dataTransfer.files) : []);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const fileArray = files ? Array.from(files) : [];
    e.target.value = "";
    handleFiles(fileArray);
  };

  const handleContextChange = useCallback(
    async (logoId: string, context: BrandLogoContext) => {
      setSavingState("saving");
      try {
        await updateBrandLogo(logoId, { context });
        setSavingState("saved");
      } catch {
        setSavingState("error");
      }
    },
    [setSavingState]
  );

  const handleDelete = useCallback(
    async (logoId: string) => {
      if (!confirm("Remove this logo?")) return;
      setSavingState("saving");
      try {
        await deleteBrandLogo(logoId);
        setSavingState("saved");
      } catch {
        setSavingState("error");
      }
    },
    [setSavingState]
  );

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
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
          accept={ACCEPT}
          multiple
          className="hidden"
          id="brand-logo-upload"
          onChange={handleInputChange}
          disabled={uploading}
        />
        <label
          htmlFor="brand-logo-upload"
          className="flex cursor-pointer flex-col items-center gap-2"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Drag and drop SVG or PNG logos here, or click to upload
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium">
            <ImagePlus className="h-4 w-4" />
            Upload Logo
          </span>
        </label>
        {uploading && (
          <p className="text-xs text-muted-foreground">Uploading…</p>
        )}
      </div>
      {logos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {logos.map((logo) => (
            <LogoCard
              key={logo.id}
              logo={logo}
              onContextChange={(context) =>
                handleContextChange(logo.id, context)
              }
              onDelete={() => handleDelete(logo.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
