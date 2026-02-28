"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Star, Copy, Archive, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { BriefStatusBadge } from "./BriefStatusBadge";
import { useBriefStore } from "@/store/briefStore";
import {
  setDefaultBrief,
  duplicateBrief,
  archiveBrief,
  deleteBrief,
} from "@/lib/mutations/briefs";
import { useCollateralTypes } from "@/lib/hooks/useCollateralTypes";
import { formatBriefCollateralTypes } from "@/lib/briefUtils";
import type { Brief } from "@/types/brief";
import { cn } from "@/lib/utils";

interface BriefListItemProps {
  brief: Brief;
  isActive: boolean;
}

export function BriefListItem({ brief, isActive }: BriefListItemProps) {
  const router = useRouter();
  const setActiveBriefId = useBriefStore((s) => s.setActiveBriefId);
  const { data: collateralTypes } = useCollateralTypes();
  const typeLabel = formatBriefCollateralTypes(brief, collateralTypes);

  const handleSelect = () => {
    setActiveBriefId(brief.id);
    router.push(`/design-briefs/${brief.slug}`);
  };

  const handleSetDefault = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await setDefaultBrief(brief.id);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newSlug = await duplicateBrief(brief.id);
    router.push(`/design-briefs/${newSlug}`);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await archiveBrief(brief.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this brief? This cannot be undone.")) return;
    await deleteBrief(brief.id);
    setActiveBriefId(null);
    router.push("/design-briefs");
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md border border-transparent py-2 pl-3 pr-1 transition-colors",
        isActive && "border-l-4 border-l-primary bg-secondary/50",
        !isActive && "hover:bg-accent/50"
      )}
    >
      <Link
        href={`/design-briefs/${brief.slug}`}
        onClick={(e) => {
          e.preventDefault();
          handleSelect();
        }}
        className="min-w-0 flex-1 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {brief.isDefault && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              title="Default brief"
              aria-hidden
            />
          )}
          <span className="truncate font-medium text-foreground">{brief.name}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{typeLabel}</span>
          <BriefStatusBadge status={brief.status} />
        </div>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
            aria-label="Brief actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSetDefault}>
            <Star className="mr-2 h-4 w-4" />
            Set as Default
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
