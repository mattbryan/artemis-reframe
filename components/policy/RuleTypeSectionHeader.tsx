"use client";

import { useState } from "react";
import { Settings, PlusCircle, MoreHorizontal, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { usePolicyStore } from "@/store/policyStore";
import { setPolicyTypeSchemaActive, deletePolicyTypeSchema } from "@/lib/mutations/policy";
import type { PolicyTypeSchema } from "@/types/policy";

interface RuleTypeSectionHeaderProps {
  typeSchema: PolicyTypeSchema;
  ruleCount: number;
  onAddRule: () => void;
  onEditFieldsClick: () => void;
  onAddCustomField: () => void;
  isEditingFields: boolean;
  addRuleButtonRef?: React.RefObject<HTMLButtonElement>;
}

export function RuleTypeSectionHeader({
  typeSchema,
  ruleCount,
  onAddRule,
  onEditFieldsClick,
  onAddCustomField,
  isEditingFields,
  addRuleButtonRef,
}: RuleTypeSectionHeaderProps) {
  const setSavingState = usePolicyStore((s) => s.setSavingState);
  const [hideConfirmOpen, setHideConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleHide = async () => {
    setHideConfirmOpen(false);
    setSavingState("saving");
    try {
      await setPolicyTypeSchemaActive(typeSchema.id, false);
      setSavingState("saved");
    } catch {
      setSavingState("error");
    }
  };

  const handleDelete = async () => {
    setDeleteConfirmOpen(false);
    setSavingState("saving");
    try {
      await deletePolicyTypeSchema(typeSchema.id);
      setSavingState("saved");
    } catch {
      setSavingState("error");
    }
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-2 border-b border-border bg-card px-4 py-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground">{typeSchema.label}</h2>
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {ruleCount} {ruleCount === 1 ? "rule" : "rules"}
          </span>
        </div>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{typeSchema.description}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onEditFieldsClick}
          aria-pressed={isEditingFields}
          aria-label={isEditingFields ? "Exit edit fields" : "Edit fields"}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          ref={addRuleButtonRef}
          variant="ghost"
          size="sm"
          onClick={onAddRule}
          aria-label="Add rule"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="ml-1.5">Add Rule</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More options">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAddCustomField}>
              Add Custom Field
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setHideConfirmOpen(true)}>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide Section
            </DropdownMenuItem>
            {!typeSchema.isDefault && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Type
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={hideConfirmOpen} onOpenChange={setHideConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hide section?</DialogTitle>
            <DialogDescription>
              This section will be collapsed. You can restore it later. Rules in this section will
              not be included in enforcement until restored.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHideConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleHide}>Hide</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this rule type?</DialogTitle>
            <DialogDescription>
              All {ruleCount} {ruleCount === 1 ? "rule" : "rules"} in this category will also be
              permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
