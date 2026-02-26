"use client";

import { cn } from "@/lib/utils";
import type { BriefStatus } from "@/types/brief";

const statusStyles: Record<BriefStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-500/20 text-green-600 dark:text-green-400",
  archived: "text-muted-foreground opacity-75",
};

export function BriefStatusBadge({ status }: { status: BriefStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}
