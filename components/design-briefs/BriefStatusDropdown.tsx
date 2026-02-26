"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { BriefStatus } from "@/types/brief";

const statusStyles: Record<BriefStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-500/20 text-green-600 dark:text-green-400",
  archived: "text-muted-foreground opacity-75",
};

const STATUS_OPTIONS: BriefStatus[] = ["draft", "active", "archived"];

export function BriefStatusDropdown({
  status,
  onStatusChange,
}: {
  status: BriefStatus;
  onStatusChange: (status: BriefStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
          statusStyles[status]
        )}
        aria-label="Change brief status"
      >
        {status}
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {STATUS_OPTIONS.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => onStatusChange(s)}
            className={cn(s === status && "bg-accent")}
          >
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
