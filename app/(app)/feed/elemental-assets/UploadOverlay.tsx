"use client";

import { useState, useCallback } from "react";
import { X, Upload, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ASSET_TYPE_OPTIONS,
  type AssetTypeFilter,
} from "./ElementalAssetsHeader";

interface UploadOverlayProps {
  open: boolean;
  onClose: () => void;
  onUpload: (
    files: File[],
    assetType: Exclude<AssetTypeFilter, "all">
  ) => void | Promise<void>;
}

const UPLOAD_ASSET_TYPES = ASSET_TYPE_OPTIONS.filter((o) => o.value !== "all");

export function UploadOverlay({ open, onClose, onUpload }: UploadOverlayProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [assetType, setAssetType] =
    useState<Exclude<AssetTypeFilter, "all">>("photography");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const items = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...items]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const items = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...items]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      await onUpload(files, assetType);
      setFiles([]);
      setAssetType("photography");
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setAssetType("photography");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Upload Assets</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Add files
            </label>
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-input hover:border-primary/50"
              }`}
            >
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.svg,.png,.jpg,.jpeg,.gif,.webp,.ico"
              />
              <FilePlus className="h-10 w-10 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Drop files here or click to browse
              </span>
            </label>
            {files.length > 0 && (
              <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-sm text-muted-foreground">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Asset type <span className="text-destructive">*</span>
            </label>
            <select
              value={assetType}
              onChange={(e) =>
                setAssetType(e.target.value as Exclude<AssetTypeFilter, "all">)
              }
              required
              className="flex h-10 w-full rounded-lg border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {UPLOAD_ASSET_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Applied to all files in this upload
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={files.length === 0 || isUploading}
          >
            <Upload
              className={`mr-2 h-4 w-4 ${isUploading ? "animate-pulse" : ""}`}
            />
            {isUploading
              ? "Uploading..."
              : `Upload ${files.length > 0 ? `${files.length} file${files.length !== 1 ? "s" : ""}` : "files"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
