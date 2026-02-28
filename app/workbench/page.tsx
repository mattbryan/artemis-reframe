"use client";

/**
 * BUILD: AI content creation workspace.
 *
 * Multi-step wizard for configuring and generating AI content.
 * Landing: draft list + New Project. Wizard: WizardShell with save draft, generate.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WizardShell } from "./wizard/WizardShell";
import { useWizardStore } from "@/store/wizardStore";
import { useCollateralType } from "@/lib/hooks/useCollateralType";
import { formatTargetType } from "@/lib/collateralTypeUtils";
import type { Project } from "@/types/project";

function inferDraftStep(project: {
  name: string;
  images: unknown[];
  outputTargetAssignments: Record<string, string>;
}): number {
  let step = 2;
  if (project.name?.trim()) step = 2;
  const hasImages = Array.isArray(project.images) && project.images.length > 0;
  const hasTargets =
    project.outputTargetAssignments &&
    Object.keys(project.outputTargetAssignments).length > 0;
  if (hasImages) step = 3;
  if (hasTargets) step = 4;
  return Math.min(step, 5);
}

export default function WorkbenchPage() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const [stepValid, setStepValid] = useState(false);
  const [resumingProject, setResumingProject] = useState<Project | null>(null);

  const { data: draftData } = db.useQuery({
    project: {
      $: { where: { status: "draft" } },
    },
  });

  const drafts = (() => {
    const rows = draftData?.project ?? [];
    const list = Array.isArray(rows) ? rows : Object.values(rows);
    return (list as Record<string, unknown>[]).map((p) => ({
      id: p.id as string,
      name: (p.name as string) ?? "",
      collateralTypeId: (p.collateralTypeId as string) ?? "",
      collateralTypeSlug: (p.collateralTypeSlug as string) ?? "",
      updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : 0,
      createdAt: typeof p.createdAt === "number" ? p.createdAt : 0,
      formData: (p.formData as Record<string, string | boolean | number>) ?? {},
      sectionData:
        (p.sectionData as Record<string, Record<string, string | boolean | number>>) ?? {},
      images: (p.images as Project["images"]) ?? [],
      outputTargetAssignments:
        (p.outputTargetAssignments as Record<string, string>) ?? {},
    }));
  })();

  const slugToResume = resumingProject?.collateralTypeSlug ?? null;
  const { type: collateralTypeToResume } = useCollateralType(slugToResume);

  const hydrateFromDraft = useWizardStore((s) => s.hydrateFromDraft);
  const reset = useWizardStore((s) => s.reset);

  useEffect(() => {
    if (!resumingProject || !collateralTypeToResume) return;
    const step = inferDraftStep(resumingProject);
    const projectForHydrate: Project = {
      id: resumingProject.id,
      name: resumingProject.name,
      status: resumingProject.status,
      collateralTypeId: resumingProject.collateralTypeId,
      collateralTypeSlug: resumingProject.collateralTypeSlug,
      formData: resumingProject.formData ?? {},
      sectionData: resumingProject.sectionData ?? {},
      images: Array.isArray(resumingProject.images) ? resumingProject.images : [],
      outputTargetAssignments: resumingProject.outputTargetAssignments ?? {},
      generationLog: [],
      createdAt: resumingProject.createdAt,
      updatedAt: resumingProject.updatedAt,
    };
    hydrateFromDraft(projectForHydrate, collateralTypeToResume, step);
    setResumingProject(null);
    setShowWizard(true);
  }, [resumingProject, collateralTypeToResume, hydrateFromDraft]);

  const onSaveDraft = async () => {
    const store = useWizardStore.getState();
    const ct = store.selectedCollateralType;
    if (!ct) return;
    const projectId = store.draftProjectId ?? id();
    await db.transact([
      db.tx.project[projectId].update({
        name: store.projectName,
        status: "draft",
        collateralTypeId: ct.id,
        collateralTypeSlug: ct.slug,
        formData: store.formData,
        sectionData: store.sectionData,
        images: store.images,
        outputTargetAssignments: store.outputTargetAssignments,
        generationLog: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    ]);
    store.setDraftProjectId(projectId);
  };

  const onGenerate = async () => {
    const store = useWizardStore.getState();
    const ct = store.selectedCollateralType;
    if (!ct) return;
    const projectId = store.draftProjectId ?? id();

    await db.transact([
      db.tx.project[projectId].update({
        name: store.projectName,
        status: "generating",
        collateralTypeId: ct.id,
        collateralTypeSlug: ct.slug,
        formData: store.formData,
        sectionData: store.sectionData,
        images: store.images,
        outputTargetAssignments: store.outputTargetAssignments,
        generationLog: [],
        createdAt: store.draftProjectId ? undefined : Date.now(),
        updatedAt: Date.now(),
      }),
    ]);

    router.push(`/workbench/${projectId}`);

    const steps = [
      "Reading your brand guidelines...",
      "Reviewing policies and rules...",
      ...Object.keys(store.outputTargetAssignments).flatMap((t) => [
        `Reviewing design brief for ${formatTargetType(t)}...`,
        `Drafting content for ${formatTargetType(t)}...`,
        `Assembling ${formatTargetType(t)}...`,
      ]),
      "Finalizing your collateral...",
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      await db.transact([
        db.tx.project[projectId].update({
          generationLog: steps.slice(0, i + 1),
          updatedAt: Date.now(),
        }),
      ]);
    }

    await db.transact([
      db.tx.project[projectId].update({
        status: "complete",
        updatedAt: Date.now(),
      }),
    ]);
  };

  const onCancel = () => {
    reset();
    setShowWizard(false);
    setStepValid(false);
  };

  const handleResumeDraft = (project: Project) => {
    setResumingProject(project);
    // Wizard will show after hydrateFromDraft in useEffect when type is loaded
  };

  if (resumingProject) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Workbench</h1>
        </header>
        <p className="text-muted-foreground">Loading draft…</p>
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Workbench</h1>
          <p className="text-muted-foreground">
            Create a new project or continue from a draft.
          </p>
        </header>
        <WizardShell
          isStepValid={stepValid}
          onStepValidChange={setStepValid}
          onSaveDraft={onSaveDraft}
          onGenerate={onGenerate}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Workbench</h1>
        <p className="text-muted-foreground">
          AI content creation workspace. Configure deliverables, generate
          content, and proof before finalizing.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={() => setShowWizard(true)}>New Project</Button>
      </div>

      {drafts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-foreground">Draft projects</h2>
          <p className="text-sm text-muted-foreground">
            Completed projects are in the Archive.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((d) => {
              const step = inferDraftStep(d);
              const projectForResume: Project = {
                id: d.id,
                name: d.name,
                status: "draft",
                collateralTypeId: d.collateralTypeId,
                collateralTypeSlug: d.collateralTypeSlug,
                formData: d.formData,
                sectionData: d.sectionData,
                images: d.images,
                outputTargetAssignments: d.outputTargetAssignments,
                generationLog: [],
                errorMessage: undefined,
                createdAt: d.createdAt,
                updatedAt: d.updatedAt,
              };
              return (
                <li key={d.id}>
                  <Card
                    className="cursor-pointer transition-colors hover:bg-accent/50"
                    onClick={() => handleResumeDraft(projectForResume)}
                  >
                    <CardContent className="pt-6">
                      <div className="font-medium text-foreground">{d.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {d.collateralTypeSlug}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Saved{" "}
                        {d.updatedAt
                          ? new Date(d.updatedAt).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "—"}
                      </div>
                      <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Step {step}
                      </span>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {drafts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No draft projects yet. Click New Project to start. Completed
              projects are in the Archive.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
