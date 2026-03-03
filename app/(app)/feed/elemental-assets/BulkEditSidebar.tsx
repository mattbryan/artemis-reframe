"use client";

import { Button } from "@/components/ui/button";
import { Tag, Trash2 } from "lucide-react";

interface BulkEditSidebarProps {
  selectedCount: number;
  onAddTags: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function BulkEditSidebar({
  selectedCount,
  onAddTags,
  onDelete,
  onClose,
}: BulkEditSidebarProps) {
  if (selectedCount === 0) return null;

  return (
    <aside className="fixed right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-border bg-card shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-medium text-foreground">
          {selectedCount} selected
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <span className="text-lg">&times;</span>
        </button>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <Button variant="outline" className="justify-start" onClick={onAddTags}>
          <Tag className="mr-2 h-4 w-4" />
          Add tags
        </Button>
        <Button
          variant="destructive"
          className="justify-start"
          onClick={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete selected
        </Button>
      </div>
    </aside>
  );
}
