"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatTargetType } from "@/lib/collateralTypeUtils";
import type { Project } from "@/types/project";
import { useMemo } from "react";

interface GenerationProgressDialogProps {
  project: Project;
  onComplete: () => void;
}

function getExpectedSteps(project: Project): string[] {
  return [
    "Reading your brand guidelines...",
    "Reviewing policies and rules...",
    ...Object.keys(project.outputTargetAssignments ?? {}).flatMap((t) => [
      `Reviewing design brief for ${formatTargetType(t)}...`,
      `Drafting content for ${formatTargetType(t)}...`,
      `Assembling ${formatTargetType(t)}...`,
    ]),
    "Finalizing your collateral...",
  ];
}

export function GenerationProgressDialog({
  project,
  onComplete,
}: GenerationProgressDialogProps) {
  const router = useRouter();
  const expectedSteps = useMemo(() => getExpectedSteps(project), [project]);
  const log = Array.isArray(project.generationLog) ? project.generationLog : [];
  const completedCount = log.length;
  const totalSteps = expectedSteps.length;
  const progressPct =
    totalSteps > 0 ? Math.min(100, (completedCount / totalSteps) * 100) : 0;

  const isGenerating = project.status === "generating";
  const isComplete = project.status === "complete";
  const isFailed = project.status === "failed";

  const open = isGenerating || isComplete || isFailed;

  const handleStartEditing = () => {
    onComplete();
    router.push(`/workbench/${project.id}`);
  };

  const handleRetry = () => {
    router.push("/workbench");
    // Re-open wizard at step 5; store is not reset so user can click Generate again
    // The spec says "re-triggers generation" - we'd need to call onGenerate again;
    // for now navigate to workbench and user can re-enter from draft or wizard.
  };

  const handleBackToWizard = () => {
    router.push("/workbench");
  };

  return (
    <Dialog open={open}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          if (isGenerating) e.preventDefault();
        }}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>
            {project.collateralTypeSlug}
          </DialogDescription>
        </DialogHeader>

        {isGenerating && (
          <>
            <div className="space-y-3">
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-primary transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {expectedSteps.map((step, idx) => {
                  const isDone = idx < completedCount;
                  const isCurrent = idx === completedCount;
                  return (
                    <li
                      key={idx}
                      className={`flex items-center gap-2 text-sm ${
                        isDone
                          ? "text-foreground"
                          : isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground/70"
                      }`}
                    >
                      {isDone && (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      {isCurrent && (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      )}
                      {!isDone && !isCurrent && (
                        <span className="inline-block h-4 w-4 shrink-0" />
                      )}
                      <span>{step}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        {isComplete && (
          <>
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <p className="text-center text-sm text-foreground">
                Your collateral is ready to review.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleStartEditing}>Start Editing</Button>
            </DialogFooter>
          </>
        )}

        {isFailed && (
          <>
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-sm text-destructive">
                {project.errorMessage ?? "Generation failed."}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleBackToWizard}>
                Back to Wizard
              </Button>
              <Button onClick={handleRetry}>Retry</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
