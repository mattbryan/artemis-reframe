"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  RefreshCw,
  FileDown,
  Loader2,
  ChevronDown,
} from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { useEditorStore } from "@/store/editorStore";
import { formatTargetType } from "@/lib/collateralTypeUtils";
import type { ProjectOutput } from "@/types/project";

const MATTHEWS_NAVY = "#0a0d1a";

interface EditorToolbarProps {
  projectId: string;
  projectName: string;
  targetType: string;
  output: ProjectOutput;
  sectionNames: { sectionId: string; sectionName: string }[];
  onRegenerateSection: (sectionId: string) => void;
  onRegenerateAll: () => void;
  onExportPdf: () => void;
  regeneratingSectionId: string | null;
}

export function EditorToolbar({
  projectId,
  projectName,
  targetType,
  output,
  sectionNames,
  onRegenerateSection,
  onRegenerateAll,
  onExportPdf,
  regeneratingSectionId,
}: EditorToolbarProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);

  const { liveContent, hasUnsavedChanges, markSaved } = useEditorStore();

  const outputId = output.id;
  const unsaved = hasUnsavedChanges(outputId);
  const isApproved = output.status === "approved";
  const content = liveContent[outputId];

  const handleSave = useCallback(async () => {
    if (!content || !unsaved) return;
    setSaving(true);
    try {
      const payload = { ...content };
      await db.transact([
        db.tx.projectOutput[outputId].update({
          editedContentJson: payload as unknown as Record<string, unknown>,
          updatedAt: Date.now(),
        }),
      ]);
      markSaved(outputId);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [content, outputId, unsaved, markSaved]);

  const runApprove = useCallback(
    async (useEditedContent: boolean) => {
      setApproving(true);
      try {
        if (useEditedContent && content) {
          await db.transact([
            db.tx.projectOutput[outputId].update({
              editedContentJson: content as unknown as Record<string, unknown>,
              status: isApproved ? "complete" : "approved",
              updatedAt: Date.now(),
            }),
            db.tx.project[projectId].update({
              status: isApproved ? "complete" : "approved",
              updatedAt: Date.now(),
            }),
          ]);
        } else {
          await db.transact([
            db.tx.projectOutput[outputId].update({
              status: isApproved ? "complete" : "approved",
              updatedAt: Date.now(),
            }),
            db.tx.project[projectId].update({
              status: isApproved ? "complete" : "approved",
              updatedAt: Date.now(),
            }),
          ]);
        }
        router.refresh();
      } finally {
        setApproving(false);
        setApproveDialogOpen(false);
      }
    },
    [content, outputId, projectId, isApproved, router]
  );

  const handleApprove = useCallback(() => {
    if (unsaved) {
      setApproveDialogOpen(true);
      return;
    }
    runApprove(false);
  }, [unsaved, runApprove]);

  const handleSaveAndApprove = useCallback(() => {
    if (content) {
      markSaved(outputId);
      runApprove(true);
    } else {
      runApprove(false);
    }
    setApproveDialogOpen(false);
  }, [content, outputId, markSaved, runApprove]);

  const handleApproveWithoutSaving = useCallback(() => {
    runApprove(false);
    setApproveDialogOpen(false);
  }, [runApprove]);

  const handleRegenerateAll = useCallback(async () => {
    try {
      await db.transact([
        db.tx.projectOutput[outputId].update({
          status: "generating",
          updatedAt: Date.now(),
        }),
      ]);
      await fetch("/api/regenerate-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, targetType }),
      });
      router.push(`/workbench/${projectId}`);
    } catch {
      // revert status on error
      await db.transact([
        db.tx.projectOutput[outputId].update({
          status: "complete",
          updatedAt: Date.now(),
        }),
      ]);
    }
  }, [outputId, projectId, targetType, router]);

  const label = formatTargetType(targetType);

  return (
    <>
      <header
        className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4"
        style={{ borderBottomColor: MATTHEWS_NAVY }}
      >
        <Link href={`/workbench/${projectId}`}>
        <Button variant="ghost" size="icon" aria-label="Back to project">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {projectName} — {label}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!unsaved || saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {unsaved && (
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-amber-500" />
                )}
                <Save className="mr-1.5 h-4 w-4" />
                Save
              </>
            )}
          </Button>

          {savedToast && (
            <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
              Saved
            </span>
          )}

          <Button
            variant={isApproved ? "default" : "outline"}
            size="sm"
            onClick={handleApprove}
            disabled={approving}
            className={isApproved ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {approving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isApproved ? (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Approved ✓
              </>
            ) : (
              "Approve"
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!!regeneratingSectionId}>
                {regeneratingSectionId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Regenerate section
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sectionNames.map(({ sectionId, sectionName }) => (
                <DropdownMenuItem
                  key={sectionId}
                  onSelect={() => onRegenerateSection(sectionId)}
                >
                  {sectionName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={onRegenerateAll}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Regenerate all
          </Button>

          <Button variant="outline" size="sm" onClick={onExportPdf}>
            <FileDown className="mr-1.5 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </header>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save before approving?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleApproveWithoutSaving}
              disabled={approving}
            >
              Approve without saving
            </Button>
            <Button onClick={handleSaveAndApprove} disabled={approving}>
              Save + Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
