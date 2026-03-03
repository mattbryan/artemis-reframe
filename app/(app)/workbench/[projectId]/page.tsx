"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { GenerationProgressDialog } from "../wizard/GenerationProgressDialog";
import { Button } from "@/components/ui/button";
import { formatTargetType, OUTPUT_TARGET_BADGE_CLASS } from "@/lib/collateralTypeUtils";
import type { Project, ProjectOutput } from "@/types/project";
import type { GeneratedOutputContent } from "@/types/generation";
import type { OutputTargetType } from "@/types/collateralType";

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

function parseContentJson(rec: Record<string, unknown>): GeneratedOutputContent {
  let parsed: unknown;
  try {
    const raw = rec.contentJson;
    if (raw != null && typeof raw === "string") {
      parsed = JSON.parse(raw);
    } else {
      parsed = raw;
    }
  } catch {
    parsed = null;
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    "sections" in parsed &&
    Array.isArray((parsed as GeneratedOutputContent).sections)
  ) {
    return parsed as GeneratedOutputContent;
  }
  return {
    targetType: ((rec.targetType as string) ?? "print-pdf") as OutputTargetType,
    headline: "",
    subheadline: "",
    sections: [],
    assetRecommendations: [],
    generationNotes: "",
  };
}

function normalizeOutputs(row: Record<string, unknown>): ProjectOutput[] {
  const raw = row.outputs;
  if (raw === undefined || raw === null) return [];
  const list = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : Object.entries(raw as Record<string, unknown>).map(([id, v]) => ({
        ...(typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {}),
        id,
      }));
  const result: ProjectOutput[] = [];
  for (const r of list) {
    const rec = r as Record<string, unknown>;
    const id = (rec.id as string) ?? String(rec.id);
    if (!id) continue;
    const contentJson = parseContentJson(rec);
    let editedContentJson: GeneratedOutputContent | undefined;
    const rawEdited = rec.editedContentJson;
    if (rawEdited != null) {
      try {
        const parsedEdited =
          typeof rawEdited === "string" ? JSON.parse(rawEdited) : rawEdited;
        if (
          parsedEdited &&
          typeof parsedEdited === "object" &&
          "sections" in parsedEdited
        ) {
          editedContentJson = parsedEdited as GeneratedOutputContent;
        }
      } catch {
        // ignore
      }
    }
    result.push({
      id,
      projectId: (rec.projectId as string) ?? "",
      targetType: ((rec.targetType as string) ?? "print-pdf") as ProjectOutput["targetType"],
      briefId: (rec.briefId as string) ?? "",
      status: (rec.status as ProjectOutput["status"]) ?? "pending",
      contentJson,
      editedContentJson,
      rawPrompt: typeof rec.rawPrompt === "string" ? rec.rawPrompt : undefined,
      errorMessage: typeof rec.errorMessage === "string" ? rec.errorMessage : undefined,
      createdAt: typeof rec.createdAt === "number" ? rec.createdAt : 0,
      updatedAt: typeof rec.updatedAt === "number" ? rec.updatedAt : 0,
    });
  }
  return result;
}

function getProjectWithOutputs(
  projectId: string,
  data: unknown
): { project: Project; outputs: ProjectOutput[] } | null {
  const project = normalizeProject(projectId, data);
  if (!project) return null;
  const proj = (data as { project?: unknown })?.project;
  const list = Array.isArray(proj)
    ? (proj as Record<string, unknown>[])
    : Object.values(proj as Record<string, unknown>);
  const row = list.find((r) => {
    const rec = r as Record<string, unknown> | undefined;
    return rec && typeof rec === "object" && rec.id === projectId;
  }) as Record<string, unknown> | undefined;
  const outputs = row ? normalizeOutputs(row) : [];
  return { project, outputs };
}

export default function WorkbenchProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = typeof params.projectId === "string" ? params.projectId : "";
  const [progressDismissed, setProgressDismissed] = useState(false);

  const query = db.useQuery(
    projectId
      ? {
          project: {
            $: { where: { id: projectId } },
            outputs: {},
          },
        }
      : null
  );

  // Fallback: fetch outputs by projectId when link is empty (e.g. outputs created before project.link was added)
  const outputsByProjectQuery = db.useQuery(
    projectId
      ? {
          projectOutput: {
            $: { where: { projectId } },
          },
        }
      : null
  );

  const resolved = getProjectWithOutputs(projectId, query.data);
  let project = resolved?.project ?? null;
  let outputs = resolved?.outputs ?? [];

  if (project?.status === "complete" && outputs.length === 0 && outputsByProjectQuery.data) {
    const raw = (outputsByProjectQuery.data as { projectOutput?: unknown }).projectOutput;
    if (raw !== undefined && raw !== null) {
      const list = Array.isArray(raw)
        ? (raw as Record<string, unknown>[])
        : Object.entries(raw as Record<string, unknown>).map(([id, v]) => ({
            ...(typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {}),
            id,
          }));
      outputs = normalizeOutputs({ outputs: list });
    }
  }

  // Auto-redirect when complete and exactly one output
  useEffect(() => {
    if (!projectId || !project || project.status !== "complete") return;
    if (outputs.length === 1) {
      const targetType = encodeURIComponent(outputs[0].targetType);
      router.replace(`/workbench/${projectId}/${targetType}`);
    }
  }, [projectId, project?.status, outputs.length, router]);

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

      {project.status === "complete" && outputs.length > 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">
            Output targets
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {outputs.map((output) => {
              const targetType = encodeURIComponent(output.targetType);
              const badgeClass =
                OUTPUT_TARGET_BADGE_CLASS[output.targetType] ??
                "bg-muted text-muted-foreground";
              return (
                <div
                  key={output.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {formatTargetType(output.targetType)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                    >
                      {output.status}
                    </span>
                  </div>
                  <Link href={`/workbench/${projectId}/${targetType}`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {project.status === "complete" && outputs.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground">
            No output targets yet. Generate from the wizard to create outputs.
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
          <p className="text-destructive">
            {project.errorMessage ?? "Generation failed."}
          </p>
        </div>
      )}
    </div>
  );
}
