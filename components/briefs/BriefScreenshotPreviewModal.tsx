"use client";

import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { useStorageUrl } from "@/lib/hooks/useStorageUrl";
import type { BriefScreenshot } from "@/types/brief";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BriefScreenshotPreviewModalProps {
  briefId: string | null;
  briefName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BriefScreenshotPreviewModal({
  briefId,
  briefName,
  open,
  onOpenChange,
}: BriefScreenshotPreviewModalProps) {
  const { data } = db.useQuery(
    briefId
      ? {
          briefScreenshot: {
            $: { where: { briefId } },
          },
        }
      : null
  );

  const screenshots: BriefScreenshot[] = useMemo(() => {
    const rows = (data as { briefScreenshot?: unknown } | undefined)
      ?.briefScreenshot;
    if (!rows) return [];
    const list = Array.isArray(rows)
      ? rows
      : Object.values(rows as Record<string, unknown>);
    return (list as BriefScreenshot[]).slice().sort((a, b) => a.order - b.order);
  }, [data]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setActiveIndex(null);
    }
  }, [open]);

  const hasScreenshots = screenshots.length > 0;

  const closeModal = () => onOpenChange(false);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      if (activeIndex !== null) {
        event.stopPropagation();
        setActiveIndex(null);
        return;
      }
      closeModal();
    }
    if (activeIndex == null || !hasScreenshots) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev == null ? 0 : (prev + 1) % screenshots.length
      );
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev == null
          ? screenshots.length - 1
          : (prev - 1 + screenshots.length) % screenshots.length
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] max-h-[90vh] w-full max-w-5xl flex-col gap-4 p-4 sm:p-6"
        aria-label={briefName ? `Preview for ${briefName}` : "Design brief preview"}
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="truncate text-base sm:text-lg">
            {briefName ?? "Design brief"}
          </DialogTitle>
          <DialogClose
            className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 sm:p-4">
          {!hasScreenshots ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <p>No screenshots added to this brief yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {screenshots.map((s, index) => (
                <ScreenshotTile
                  key={s.id}
                  screenshot={s}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          )}
        </div>

        {activeIndex != null && hasScreenshots && (
          <LightboxOverlay
            screenshot={screenshots[activeIndex]}
            onClose={() => setActiveIndex(null)}
            onPrev={() =>
              setActiveIndex((prev) =>
                prev == null
                  ? 0
                  : (prev - 1 + screenshots.length) % screenshots.length
              )
            }
            onNext={() =>
              setActiveIndex((prev) =>
                prev == null ? 0 : (prev + 1) % screenshots.length
              )
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ScreenshotTileProps {
  screenshot: BriefScreenshot;
  onClick: () => void;
}

function ScreenshotTile({ screenshot, onClick }: ScreenshotTileProps) {
  const resolvedUrl = useStorageUrl(screenshot.storagePath ?? null);
  const imgSrc = resolvedUrl ?? screenshot.url ?? undefined;
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !imgSrc || imgError;

  return (
    <button
      type="button"
      className="group flex w-full flex-col overflow-hidden rounded-md border border-border bg-card text-left shadow-sm transition hover:border-primary/70 hover:shadow-md"
      onClick={onClick}
    >
      <div className="relative aspect-video w-full bg-muted">
        {!showPlaceholder ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={screenshot.caption || "Design brief screenshot"}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
            No preview
          </div>
        )}
      </div>
      {screenshot.caption && (
        <div className="border-t border-border bg-background px-2.5 py-2 text-xs text-muted-foreground">
          <p className="line-clamp-2">{screenshot.caption}</p>
        </div>
      )}
    </button>
  );
}

interface LightboxOverlayProps {
  screenshot: BriefScreenshot;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function LightboxOverlay({
  screenshot,
  onClose,
  onPrev,
  onNext,
}: LightboxOverlayProps) {
  const resolvedUrl = useStorageUrl(screenshot.storagePath ?? null);
  const imgSrc = resolvedUrl ?? screenshot.url ?? undefined;
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !imgSrc || imgError;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="flex max-h-full max-w-full flex-col items-center gap-3">
        <button
          type="button"
          className="relative max-h-[70vh] max-w-[90vw] overflow-hidden rounded-md bg-black/40"
          onClick={onClose}
          aria-label="Exit image preview and return to gallery"
        >
          {!showPlaceholder ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={screenshot.caption || "Design brief screenshot"}
              className="h-full w-full max-h-[70vh] max-w-[90vw] object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-[40vh] w-[60vw] items-center justify-center bg-muted text-sm text-muted-foreground">
              No preview
            </div>
          )}
        </button>
        <p className="min-h-[1.5rem] max-w-xl text-center text-sm text-muted-foreground">
          {screenshot.caption || "\u00A0"}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white hover:bg-black/70"
            aria-label="Previous screenshot"
            onClick={onPrev}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Prev
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white hover:bg-black/70"
            aria-label="Next screenshot"
            onClick={onNext}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

