"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Copy, Archive, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCollateralTypeStore } from "@/store/collateralTypeStore";
import {
  duplicateCollateralType,
  archiveCollateralType,
  deleteCollateralType,
} from "@/lib/mutations/collateralTypes";
import type { CollateralType } from "@/types/collateralType";
import { parseOutputTargets } from "@/lib/collateralTypeUtils";
import { OUTPUT_TARGET_BADGE_CLASS } from "@/lib/collateralTypeUtils";
import { cn } from "@/lib/utils";
import { useState } from "react";

const TARGET_BADGE_LABELS: Record<string, string> = {
  "print-pdf": "PDF",
  "web-html": "WEB",
  "social-image": "SOCIAL",
  "email-html": "EMAIL",
};

interface TypeListItemProps {
  type: CollateralType;
  isActive: boolean;
}

export function TypeListItem({ type, isActive }: TypeListItemProps) {
  const router = useRouter();
  const setActiveTypeId = useCollateralTypeStore((s) => s.setActiveTypeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const targets = parseOutputTargets(type.outputTargets);

  const handleSelect = () => {
    setActiveTypeId(type.id);
    router.push(`/collateral-types/${type.slug}`);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const newSlug = await duplicateCollateralType(type.id);
      setActiveTypeId(null);
      router.push(`/collateral-types/${newSlug}`);
    } catch {
      // surface error in UI if needed
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await archiveCollateralType(type.id);
    if (isActive) {
      setActiveTypeId(null);
      router.push("/collateral-types");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    await deleteCollateralType(type.id);
    setDeleteDialogOpen(false);
    setActiveTypeId(null);
    router.push("/collateral-types");
  };

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md border border-transparent py-2 pl-3 pr-1 transition-colors",
          isActive && "border-l-4 border-l-accent bg-secondary/50",
          !isActive && "hover:bg-accent/50"
        )}
      >
        <Link
          href={`/collateral-types/${type.slug}`}
          onClick={(e) => {
            e.preventDefault();
            handleSelect();
          }}
          className="min-w-0 flex-1 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {type.isDefault && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                title="Default type"
                aria-hidden
              />
            )}
            <span className="truncate font-medium text-foreground">{type.name}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {targets.map((t) => (
              <span
                key={t.targetType}
                className={cn(
                  "rounded px-1.5 py-0.5 font-medium",
                  OUTPUT_TARGET_BADGE_CLASS[t.targetType] ?? "bg-muted text-muted-foreground"
                )}
              >
                {TARGET_BADGE_LABELS[t.targetType] ?? t.targetType}
              </span>
            ))}
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
              aria-label="Type actions"
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); router.push(`/collateral-types/${type.slug}/edit`); }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
            {!type.isDefault && (
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this collateral type?</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{type.name}&rdquo; and all its
              sections, fields, and media definitions. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
