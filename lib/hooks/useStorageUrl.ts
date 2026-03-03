"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";

/**
 * Resolves a fresh signed download URL from an InstantDB storage path.
 * Use this for any asset that stores storagePath instead of (or alongside) a stored URL,
 * since InstantDB signed URLs expire.
 *
 * @param storagePath - The storage path (e.g. "elemental-assets/xxx/file.png") or null/undefined
 * @returns The resolved URL, or null while resolving / on error / when storagePath is falsy
 */
export function useStorageUrl(
  storagePath: string | null | undefined
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    db.storage
      .getDownloadUrl(storagePath)
      .then((resolved) => {
        if (!cancelled) setUrl(resolved);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("[useStorageUrl] Failed to resolve:", storagePath, err);
          setUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  return url;
}
