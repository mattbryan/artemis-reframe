"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BrandScreenshot, BrandScreenshotMemoryType } from "@/types/brand";
import { ScreenshotCard } from "./ScreenshotCard";
import { uploadScreenshot } from "@/lib/uploadScreenshot";
import {
  createBrandScreenshot,
  updateBrandScreenshot,
  deleteBrandScreenshot,
  reorderBrandScreenshots,
} from "@/lib/mutations/brand";
import { cn } from "@/lib/utils";

interface ScreenshotGridProps {
  brandId: string;
  screenshots: BrandScreenshot[];
  setSavingState: (state: "saving" | "saved" | "error") => void;
}

function SortableScreenshotCard({
  screenshot,
  onCaptionBlur,
  onMemoryTypeChange,
  onDelete,
}: {
  screenshot: BrandScreenshot;
  onCaptionBlur: (caption: string) => void;
  onMemoryTypeChange: (memoryType: BrandScreenshotMemoryType) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screenshot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <ScreenshotCard
        screenshot={screenshot}
        onCaptionBlur={onCaptionBlur}
        onMemoryTypeChange={onMemoryTypeChange}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function ScreenshotGrid({
  brandId,
  screenshots,
  setSavingState,
}: ScreenshotGridProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      const fileArray = files ? Array.from(files) : [];
      if (fileArray.length === 0) return;
      setUploading(true);
      setSavingState("saving");
      try {
        const order = screenshots.length;
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          if (!file.type.startsWith("image/")) continue;
          const { url } = await uploadScreenshot(file);
          await createBrandScreenshot({
            brandId,
            url,
            caption: "",
            memoryType: "visual",
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
    [brandId, screenshots.length, setSavingState]
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

  const handleCaptionBlur = useCallback(
    async (screenshotId: string, caption: string) => {
      setSavingState("saving");
      try {
        await updateBrandScreenshot(screenshotId, { caption });
        setSavingState("saved");
      } catch {
        setSavingState("error");
      }
    },
    [setSavingState]
  );

  const handleMemoryTypeChange = useCallback(
    async (screenshotId: string, memoryType: BrandScreenshotMemoryType) => {
      setSavingState("saving");
      try {
        await updateBrandScreenshot(screenshotId, { memoryType });
        setSavingState("saved");
      } catch {
        setSavingState("error");
      }
    },
    [setSavingState]
  );

  const handleDelete = useCallback(
    async (screenshotId: string) => {
      setSavingState("saving");
      try {
        await deleteBrandScreenshot(screenshotId);
        setSavingState("saved");
      } catch {
        setSavingState("error");
      }
    },
    [setSavingState]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const ids = screenshots.map((s) => s.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      const newOrder = arrayMove(ids, oldIndex, newIndex);
      setSavingState("saving");
      reorderBrandScreenshots(brandId, newOrder)
        .then(() => setSavingState("saved"))
        .catch(() => setSavingState("error"));
    },
    [brandId, screenshots, setSavingState]
  );

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
          id="brand-screenshot-upload"
          onChange={handleInputChange}
          disabled={uploading}
        />
        <label
          htmlFor="brand-screenshot-upload"
          className="flex cursor-pointer flex-col items-center gap-2"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Drag and drop images here, or click to upload (multiple at once)
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium">
            Upload Screenshots
          </span>
        </label>
        {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={screenshots.map((s) => s.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {screenshots.map((screenshot) => (
              <SortableScreenshotCard
                key={screenshot.id}
                screenshot={screenshot}
                onCaptionBlur={(caption) =>
                  handleCaptionBlur(screenshot.id, caption)
                }
                onMemoryTypeChange={(memoryType) =>
                  handleMemoryTypeChange(screenshot.id, memoryType)
                }
                onDelete={() => handleDelete(screenshot.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
