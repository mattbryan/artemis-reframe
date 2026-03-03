"use client";

const IMAGE_KEYS = [
  "image",
  "photo",
  "aerial",
  "headshot",
  "logo",
  "matthewsWordmark",
];

export function isImageField(key: string): boolean {
  const lower = key.toLowerCase();
  return IMAGE_KEYS.some((k) => lower.includes(k));
}

interface ImagePlaceholderProps {
  label: string;
  className?: string;
}

export function ImagePlaceholder({ label, className = "" }: ImagePlaceholderProps) {
  return (
    <div
      className={`flex min-h-[120px] items-center justify-center rounded border-2 border-dashed border-[#a3a3a3] bg-[#f4f4f0] text-sm text-[#a3a3a3] ${className}`}
    >
      {label || "Image placeholder"}
    </div>
  );
}
