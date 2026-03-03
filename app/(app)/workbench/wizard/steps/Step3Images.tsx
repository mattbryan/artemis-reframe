"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWizardStore } from "@/store/wizardStore";
import { uploadWizardImage } from "@/lib/uploadWizardImage";
import { useStorageUrl } from "@/lib/hooks/useStorageUrl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectImage } from "@/types/project";
import type { CollateralMediaField } from "@/types/collateralType";
import { Upload, X, Star } from "lucide-react";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";

interface Step3ImagesProps {
  onStepValidChange: (valid: boolean) => void;
}

export function Step3Images({ onStepValidChange }: Step3ImagesProps) {
  const selectedCollateralType = useWizardStore((s) => s.selectedCollateralType);
  const images = useWizardStore((s) => s.images);
  const addImage = useWizardStore((s) => s.addImage);
  const removeImage = useWizardStore((s) => s.removeImage);
  const setHeroImage = useWizardStore((s) => s.setHeroImage);

  const mediaFields = useMemo(() => {
    if (!selectedCollateralType) return [];
    const raw = (selectedCollateralType as { mediaFields?: CollateralMediaField[] })
      .mediaFields;
    const list = raw ?? [];
    return (list as CollateralMediaField[])
      .slice()
      .sort((a, b) => a.order - b.order);
  }, [selectedCollateralType]);

  const hasAnyHero = useMemo(
    () => images.some((i) => i.isHero),
    [images]
  );

  const isValid = useMemo(() => {
    for (const field of mediaFields) {
      if (field.required) {
        const count = images.filter((i) => i.mediaFieldId === field.id && i.url)
          .length;
        if (count < 1) return false;
      }
    }
    return true;
  }, [mediaFields, images]);

  useEffect(() => {
    onStepValidChange(isValid);
  }, [isValid, onStepValidChange]);

  if (!selectedCollateralType) return null;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-foreground">Images</h2>

      {mediaFields.map((field) => (
        <ImageUploadZone
          key={field.id}
          field={field}
          images={images.filter((i) => i.mediaFieldId === field.id)}
          hasAnyHero={hasAnyHero}
          onAdd={(img) => addImage(img)}
          onRemove={removeImage}
          onSetHero={setHeroImage}
        />
      ))}

      {mediaFields.some((f) => f.mediaType === "image") && (
        <p className="text-xs text-muted-foreground">
          The Hero Image is typically used as the cover or primary visual of
          your collateral piece.
        </p>
      )}
    </div>
  );
}

interface ImageUploadZoneProps {
  field: CollateralMediaField;
  images: ProjectImage[];
  hasAnyHero: boolean;
  onAdd: (img: ProjectImage) => void;
  onRemove: (imageId: string) => void;
  onSetHero: (imageId: string) => void;
}

function WizardImageThumb({
  img,
  field,
  onSetHero,
  onRemove,
}: {
  img: ProjectImage;
  field: CollateralMediaField;
  onSetHero: (imageId: string) => void;
  onRemove: (imageId: string) => void;
}) {
  const resolvedUrl = useStorageUrl(img.storagePath ?? null);
  const imgSrc = resolvedUrl ?? img.url ?? undefined;
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !imgSrc || imgError;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-md border bg-card",
        img.isHero && "ring-2 ring-primary"
      )}
    >
      {!showPlaceholder ? (
        <img
          src={imgSrc}
          alt={img.filename}
          className="aspect-square object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground">
          {img.url ? "No preview" : "Uploading…"}
        </div>
      )}
      {img.isHero && (
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
          <Star className="h-3 w-3" />
          Hero
        </span>
      )}
      <div className="flex items-center justify-between gap-1 p-2">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {img.filename}
        </span>
        <div className="flex shrink-0 gap-1">
          {field.mediaType === "image" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onSetHero(img.id)}
              aria-label="Set as hero"
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  img.isHero && "fill-primary text-primary"
                )}
              />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => onRemove(img.id)}
            aria-label="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImageUploadZone({
  field,
  images,
  hasAnyHero,
  onAdd,
  onRemove,
  onSetHero,
}: ImageUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const atMax = images.length >= field.maxCount;
  const accept =
    field.mediaType === "image"
      ? IMAGE_ACCEPT
      : field.mediaType === "video"
        ? "video/*"
        : "";

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || atMax) return;
      const remaining = Math.max(0, field.maxCount - images.length);
      if (remaining === 0) return;
      const fileArray = Array.from(files).slice(0, remaining);
      setUploading(true);
      let heroAssigned = hasAnyHero;
      try {
        for (const file of fileArray) {
          const { url, storagePath } = await uploadWizardImage(file);
          const isFirstImageNoHero =
            field.mediaType === "image" && !heroAssigned;
          if (isFirstImageNoHero) heroAssigned = true;
          const img: ProjectImage = {
            id: crypto.randomUUID(),
            url,
            storagePath,
            filename: file.name,
            fileSize: file.size,
            isHero: isFirstImageNoHero,
            mediaFieldId: field.id,
          };
          onAdd(img);
        }
      } finally {
        setUploading(false);
      }
    },
    [field.id, field.mediaType, field.maxCount, atMax, images.length, hasAnyHero, onAdd]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">{field.label}</h3>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}

      {!atMax && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={cn(
            "flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
            uploading && "pointer-events-none opacity-60"
          )}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={field.maxCount > 1}
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <span className="text-sm text-muted-foreground">
              Uploading…
            </span>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Drag and drop or click to upload
              </span>
              {field.mediaType === "image" && (
                <span className="text-xs text-muted-foreground">
                  {IMAGE_ACCEPT}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {atMax && (
        <p className="text-xs text-muted-foreground">
          Maximum {field.maxCount} image{field.maxCount !== 1 ? "s" : ""} reached
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img) => (
          <WizardImageThumb
            key={img.id}
            img={img}
            field={field}
            onSetHero={onSetHero}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
