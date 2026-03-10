"use client";

/**
 * BUILD: AI content creation workspace.
 *
 * Multi-step wizard for configuring and generating AI content.
 * Landing: sortable table of all projects (with collateral type). Wizard: WizardShell with save draft, generate.
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { WizardShell } from "./wizard/WizardShell";
import { useWizardStore } from "@/store/wizardStore";
import { useCollateralType } from "@/lib/hooks/useCollateralType";
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import type { Project, ProjectStatus } from "@/types/project";

const STALE_DRAFT_AGE_MS = 86_400_000; // 24 hours

const STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  generating: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  complete: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  failed: "bg-red-500/20 text-red-700 dark:text-red-400",
  approved: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Draft",
  generating: "Generating",
  complete: "Complete",
  failed: "Failed",
  approved: "Approved",
};

type SortKey = "name" | "collateralTypeSlug" | "createdAt" | "updatedAt";

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
  const { user } = db.useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [stepValid, setStepValid] = useState(false);
  const [resumingProject, setResumingProject] = useState<Project | null>(null);

  const { data: projectData } = db.useQuery({ project: {} });

  /** Projects with a non-empty collateralTypeId (excludes bare records from onNewProject before step 1). */
  const projects = useMemo(() => {
    const rows = projectData?.project ?? [];
    const list = Array.isArray(rows) ? rows : Object.values(rows);
    const normalized = (list as Record<string, unknown>[]).map((p) => ({
      id: p.id as string,
      name: (p.name as string) ?? "",
      status: (p.status as ProjectStatus) ?? "draft",
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
      createdByEmail: (p.createdByEmail as string) ?? "",
      createdByName: (p.createdByName as string) ?? "",
    }));
    return normalized.filter((p) => typeof p.collateralTypeId === "string" && p.collateralTypeId.length > 0);
  }, [projectData]);

  /** Stale draft cleanup: delete drafts with no collateral type older than 24h. */
  useEffect(() => {
    const rows = projectData?.project ?? [];
    const list = Array.isArray(rows) ? rows : Object.values(rows);
    const now = Date.now();
    const staleIds: string[] = [];
    for (const p of list as Record<string, unknown>[]) {
      const ctId = p.collateralTypeId as string | undefined | null;
      const hasNoType = ctId === undefined || ctId === null || ctId === "";
      const createdAt = typeof p.createdAt === "number" ? p.createdAt : 0;
      const olderThan24h = now - createdAt > STALE_DRAFT_AGE_MS;
      const isDraft = (p.status as string) === "draft";
      if (hasNoType && olderThan24h && isDraft) {
        const idVal = p.id as string;
        if (idVal) staleIds.push(idVal);
      }
    }
    if (staleIds.length === 0) return;
    db.transact(staleIds.map((projectId) => db.tx.project[projectId].delete())).catch(() => {});
  }, [projectData]);

  const slugToResume = resumingProject?.collateralTypeSlug ?? null;
  const {
    type: collateralTypeToResume,
    isLoading: collateralTypeLoading,
  } = useCollateralType(slugToResume);

  const hydrateFromDraft = useWizardStore((s) => s.hydrateFromDraft);
  const reset = useWizardStore((s) => s.reset);
  const setDraftProjectId = useWizardStore((s) => s.setDraftProjectId);
  const setDraftCreatedAt = useWizardStore((s) => s.setDraftCreatedAt);

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

  useEffect(() => {
    // If we tried to resume a draft but its collateral type cannot be found,
    // avoid getting stuck on the "Loading draft…" screen forever.
    // Instead, fall back to the read-only project view.
    if (!resumingProject) return;
    if (!slugToResume) return;
    if (collateralTypeLoading) return;
    if (!collateralTypeToResume) {
      console.warn(
        "[Workbench] Failed to load collateral type for draft project",
        resumingProject.id,
        "slug:",
        slugToResume
      );
      router.push(`/workbench/${resumingProject.id}`);
      setResumingProject(null);
    }
  }, [
    resumingProject,
    slugToResume,
    collateralTypeLoading,
    collateralTypeToResume,
  ]);

  const onSaveDraft = async () => {
    const store = useWizardStore.getState();
    const projectId = store.draftProjectId ?? id();
    const ct = store.selectedCollateralType;
    const now = Date.now();
    const createdAt = store.draftCreatedAt ?? now;
    try {
      await db.transact([
        db.tx.project[projectId].update({
          name: store.projectName,
          status: "draft",
          collateralTypeId: ct?.id ?? "",
          collateralTypeSlug: ct?.slug ?? "",
          formData: store.formData,
          sectionData: store.sectionData,
          images: store.images,
          outputTargetAssignments: store.outputTargetAssignments,
          generationLog: [],
          createdAt,
          updatedAt: now,
          // Do not overwrite createdByEmail/createdByName — set at project creation only
        }),
      ]);
      store.setDraftProjectId(projectId);
      if (!store.draftCreatedAt) store.setDraftCreatedAt(createdAt);
    } catch (e) {
      console.error("Save draft failed:", e);
    }
  };

  const onGenerate = async () => {
    const store = useWizardStore.getState();
    const ct = store.selectedCollateralType;
    if (!ct) return;
    const projectId = store.draftProjectId ?? id();
    const now = Date.now();
    const email = user?.email ?? "";
    try {
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
          createdAt: now,
          updatedAt: now,
          createdByEmail: email,
          createdByName: email, // InstantDB does not expose Google display name; use email until profile system exists
        }),
      ]);
    } catch (e) {
      console.error("Generate: InstantDB update failed", e);
      return;
    }

    router.push(`/workbench/${projectId}`);

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    }).catch((err) => {
      console.error("Generation request failed to send:", err);
    });
  };

  const onCancel = () => {
    reset();
    setShowWizard(false);
    setStepValid(false);
  };

  /** Create a new draft project in the DB and open the wizard. Ensures we always have a real project row before Generate. */
  const onNewProject = async () => {
    reset();
    const projectId = id();
    const now = Date.now();
    const email = user?.email ?? "";
    await db.transact([
      db.tx.project[projectId].update({
        name: "",
        status: "draft",
        collateralTypeId: "",
        collateralTypeSlug: "",
        formData: {},
        sectionData: {},
        images: [],
        outputTargetAssignments: {},
        generationLog: [],
        createdAt: now,
        updatedAt: now,
        createdByEmail: email,
        createdByName: email, // InstantDB does not expose Google display name; use email until profile system exists
      }),
    ]);
    setDraftProjectId(projectId);
    setDraftCreatedAt(now);
    setShowWizard(true);
    setStepValid(false);
  };

  const handleResumeDraft = (project: Project) => {
    setResumingProject(project);
    // Wizard will show after hydrateFromDraft in useEffect when type is loaded
  };

  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = (a.name || "").localeCompare(b.name || "");
          break;
        case "collateralTypeSlug":
          cmp = (a.collateralTypeSlug || "").localeCompare(b.collateralTypeSlug || "");
          break;
        case "createdAt":
          cmp = a.createdAt - b.createdAt;
          break;
        case "updatedAt":
          cmp = a.updatedAt - b.updatedAt;
          break;
        default:
          cmp = a.createdAt - b.createdAt;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [projects, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const projectToProject = (p: (typeof projects)[0]): Project => ({
    id: p.id,
    name: p.name,
    status: p.status,
    collateralTypeId: p.collateralTypeId,
    collateralTypeSlug: p.collateralTypeSlug,
    formData: p.formData,
    sectionData: p.sectionData,
    images: p.images,
    outputTargetAssignments: p.outputTargetAssignments,
    generationLog: [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    createdByEmail: p.createdByEmail,
    createdByName: p.createdByName,
  });

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
        <Button onClick={onNewProject}>New Project</Button>
      </div>

      {sortedProjects.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No projects yet. Click New Project to start.
        </p>
      )}

      {sortedProjects.length > 0 && (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Name
                    {sortKey === "name" ? (
                      sortDir === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    ) : (
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  <button
                    type="button"
                    onClick={() => handleSort("collateralTypeSlug")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Collateral Type
                    {sortKey === "collateralTypeSlug" ? (
                      sortDir === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    ) : (
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  <button
                    type="button"
                    onClick={() => handleSort("createdAt")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Creation Date
                    {sortKey === "createdAt" ? (
                      sortDir === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    ) : (
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  <button
                    type="button"
                    onClick={() => handleSort("updatedAt")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Generation Date
                    {sortKey === "updatedAt" ? (
                      sortDir === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    ) : (
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((p) => {
                const projectForResume = projectToProject(p);
                const generationDate =
                  p.status === "generating"
                    ? "In progress…"
                    : p.status === "complete" || p.status === "failed"
                      ? p.updatedAt
                        ? new Date(p.updatedAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"
                      : "—";

                return (
                  <tr
                    key={p.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResumeDraft(projectForResume)}
                          className="font-medium text-foreground hover:underline underline-offset-2 cursor-pointer text-left"
                        >
                          {p.name?.trim() ? (
                            p.name
                          ) : (
                            <span className="text-muted-foreground">Untitled</span>
                          )}
                        </button>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[p.status] ?? STATUS_BADGE_CLASS.draft}`}
                        >
                          {STATUS_LABEL[p.status] ?? "Draft"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {p.createdByName ?? p.createdByEmail ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {p.collateralTypeSlug}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {generationDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
