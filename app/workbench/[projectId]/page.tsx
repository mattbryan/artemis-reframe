"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/db";
import { GenerationProgressDialog } from "../wizard/GenerationProgressDialog";
import type { Project } from "@/types/project";

function normalizeProject(
  projectId: string,
  data: unknown
): Project | null {
  const proj = (data as { project?: unknown })?.project;
  if (proj === undefined || proj === null) return null;
  const list = Array.isArray(proj)
    ? (proj as Record<string, unknown>[])
    : Object.values(proj as Record<string, unknown>);
  const row = list.find((r) => {
    const rec = r as Record<string, unknown> | undefined;
    return rec && typeof rec === "object" && rec.id === projectId;
  }) as Record<string, unknown> | undefined;
  if (!row || typeof row !== "object") return null;
  return {
    id: projectId,
    name: (row.name as string) ?? "",
    status: (row.status as Project["status"]) ?? "draft",
    collateralTypeId: (row.collateralTypeId as string) ?? "",
    collateralTypeSlug: (row.collateralTypeSlug as string) ?? "",
    formData: (row.formData as Project["formData"]) ?? {},
    sectionData: (row.sectionData as Project["sectionData"]) ?? {},
    images: Array.isArray(row.images) ? (row.images as Project["images"]) : [],
    outputTargetAssignments:
      (row.outputTargetAssignments as Project["outputTargetAssignments"]) ?? {},
    generationLog: Array.isArray(row.generationLog)
      ? (row.generationLog as string[])
      : [],
    errorMessage:
      row.errorMessage != null && row.errorMessage !== ""
        ? (row.errorMessage as string)
        : undefined,
    createdAt: typeof row.createdAt === "number" ? row.createdAt : 0,
    updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : 0,
  };
}

export default function WorkbenchProjectPage() {
  const params = useParams();
  const projectId = typeof params.projectId === "string" ? params.projectId : "";
  const [progressDismissed, setProgressDismissed] = useState(false);

  const query = db.useQuery(
    projectId
      ? {
          project: {
            $: { where: { id: projectId } },
          },
        }
      : null
  );

  const project = normalizeProject(projectId, query.data);

  if (!projectId) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Invalid project.</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <p className="text-muted-foreground">Loading project…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          {project.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {project.collateralTypeSlug} · {project.status}
        </p>
      </header>

      {(project.status === "generating" ||
        (project.status === "complete" && !progressDismissed) ||
        project.status === "failed") && (
        <GenerationProgressDialog
          project={project}
          onComplete={() => setProgressDismissed(true)}
        />
      )}

      {project.status === "complete" && (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground">
            Editor coming in Stage 3.
          </p>
        </div>
      )}

      {project.status === "draft" && (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground">
            This project is still a draft. Complete the wizard from the
            Workbench to generate.
          </p>
        </div>
      )}

      {project.status === "failed" && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <p className="text-destructive">{project.errorMessage ?? "Generation failed."}</p>
        </div>
      )}
    </div>
  );
}
