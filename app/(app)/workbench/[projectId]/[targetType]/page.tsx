"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/db";
import { useEditorStore } from "@/store/editorStore";
import { EditorToolbar } from "./EditorToolbar";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { CoworkPackageView } from "./CoworkPackageView";
import type { Project, ProjectOutput, ProjectOutputApprovalStatus } from "@/types/project";
import type { GeneratedOutputContent } from "@/types/generation";
import type { OutputTargetType } from "@/types/collateralType";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

function parseContentJson(
  rec: Record<string, unknown>
): GeneratedOutputContent {
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
        ...(typeof v === "object" && v !== null
          ? (v as Record<string, unknown>)
          : {}),
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
    const rawApproval = rec.approvalStatus;
    const approvalStatus: ProjectOutputApprovalStatus | undefined =
      rawApproval === "approved" || rawApproval === "not_approved"
        ? rawApproval
        : undefined;
    result.push({
      id,
      projectId: (rec.projectId as string) ?? "",
      targetType: ((rec.targetType as string) ?? "print-pdf") as ProjectOutput["targetType"],
      briefId: (rec.briefId as string) ?? "",
      status: (rec.status as ProjectOutput["status"]) ?? "pending",
      approvalStatus,
      contentJson,
      editedContentJson,
      rawPrompt:
        typeof rec.rawPrompt === "string" ? rec.rawPrompt : undefined,
      errorMessage:
        typeof rec.errorMessage === "string" ? rec.errorMessage : undefined,
      createdAt: typeof rec.createdAt === "number" ? rec.createdAt : 0,
      updatedAt: typeof rec.updatedAt === "number" ? rec.updatedAt : 0,
    });
  }
  return result;
}

function getOutputForTarget(
  projectId: string,
  targetType: string,
  data: unknown
): { project: Project; output: ProjectOutput } | null {
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
  const output = outputs.find(
    (o) => decodeURIComponent(o.targetType) === decodeURIComponent(targetType)
  );
  if (!output) return null;
  return { project, output };
}

export default function EditorPage() {
  const params = useParams();
  const projectId =
    typeof params.projectId === "string" ? params.projectId : "";
  const targetTypeParam =
    typeof params.targetType === "string" ? params.targetType : "";
  const targetType = decodeURIComponent(targetTypeParam);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<
    string | null
  >(null);
  const [regenerateSectionDialog, setRegenerateSectionDialog] = useState<{
    sectionId: string;
    sectionName: string;
  } | null>(null);
  const [regenerateAllDialog, setRegenerateAllDialog] = useState(false);
  const [exportPdfDialog, setExportPdfDialog] = useState(false);

  const query = db.useQuery(
    projectId && targetTypeParam
      ? {
          project: {
            $: { where: { id: projectId } },
            outputs: {},
          },
        }
      : null
  );

  // Fallback: fetch outputs by projectId when link is empty (e.g. pre-link projects)
  const outputsByProjectQuery = db.useQuery(
    projectId && targetTypeParam
      ? {
          projectOutput: {
            $: { where: { projectId } },
          },
        }
      : null
  );

  const resolvedFromLink = getOutputForTarget(projectId, targetType, query.data);
  const projectFromQuery = normalizeProject(projectId, query.data);

  let project: Project | null = resolvedFromLink?.project ?? projectFromQuery ?? null;
  let output: ProjectOutput | null = resolvedFromLink?.output ?? null;

  if (!output && project && outputsByProjectQuery.data) {
    const raw = (outputsByProjectQuery.data as { projectOutput?: unknown })
      .projectOutput;
    if (raw !== undefined && raw !== null) {
      const list = Array.isArray(raw)
        ? (raw as Record<string, unknown>[])
        : Object.entries(raw as Record<string, unknown>).map(([id, v]) => ({
            ...(typeof v === "object" && v !== null
              ? (v as Record<string, unknown>)
              : {}),
            id,
          }));
      const outputs = normalizeOutputs({ outputs: list });
      const found = outputs.find(
        (o) => decodeURIComponent(o.targetType) === decodeURIComponent(targetType)
      );
      if (found) output = found;
    }
  }

  const initOutput = useEditorStore((s) => s.initOutput);
  const updateSection = useEditorStore((s) => s.updateSection);
  const hasUnsavedChanges = useEditorStore((s) => s.hasUnsavedChanges);
  const liveContent = useEditorStore((s) => s.liveContent);
  const markSaved = useEditorStore((s) => s.markSaved);

  const outputId = output?.id ?? "";
  const content =
    liveContent[outputId] ?? output?.editedContentJson ?? output?.contentJson;
  const sections = useMemo(
    () => content?.sections ?? [],
    [content]
  );

  useEffect(() => {
    if (!outputId || !output) return;
    const initial =
      output.editedContentJson ?? output.contentJson;
    initOutput(outputId, initial);
  }, [outputId, output?.id]);

  const handleRegenerateSection = useCallback(
    async (sectionId: string) => {
      const section = sections.find((s) => s.sectionId === sectionId);
      if (!section) return;
      setRegenerateSectionDialog({
        sectionId,
        sectionName: section.sectionName,
      });
    },
    [sections]
  );

  const confirmRegenerateSection = useCallback(async () => {
    if (!regenerateSectionDialog) return;
    const { sectionId, sectionName } = regenerateSectionDialog;
    setRegenerateSectionDialog(null);
    setRegeneratingSectionId(sectionId);
    try {
      const res = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectOutputId: outputId, sectionId }),
      });
      if (!res.ok) throw new Error("Regenerate failed");
      const data = await res.json();
      const section = data.section as {
        sectionId: string;
        sectionName: string;
        fields: Record<string, string>;
        narrative: string;
      };
      if (section && outputId) {
        updateSection(outputId, sectionId, {
          fields: section.fields ?? {},
          narrative: section.narrative ?? "",
        });
      }
    } finally {
      setRegeneratingSectionId(null);
    }
  }, [regenerateSectionDialog, outputId, updateSection]);

  const handleRegenerateAll = useCallback(() => {
    setRegenerateAllDialog(true);
  }, []);

  const confirmRegenerateAll = useCallback(async () => {
    setRegenerateAllDialog(false);
    if (!outputId) return;
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
      window.location.href = `/workbench/${projectId}`;
    } catch {
      await db.transact([
        db.tx.projectOutput[outputId].update({
          status: "complete",
          updatedAt: Date.now(),
        }),
      ]);
    }
  }, [outputId, projectId, targetType]);

  const handleExportPdf = useCallback(() => {
    if (hasUnsavedChanges(outputId)) {
      setExportPdfDialog(true);
      return;
    }
    doExportPdf();
  }, [outputId, hasUnsavedChanges]);

  const doExportPdf = useCallback(async () => {
    setExportPdfDialog(false);
    if (!outputId || !project) return;
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectOutputId: outputId }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const filename = `${project.name.replace(/\s+/g, "-")}-${targetType}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // TODO toast error
    }
  }, [outputId, project, targetType]);

  const saveAndExportPdf = useCallback(async () => {
    const c = liveContent[outputId];
    if (c) {
      await db.transact([
        db.tx.projectOutput[outputId].update({
          editedContentJson: c as unknown as Record<string, unknown>,
          updatedAt: Date.now(),
        }),
      ]);
      markSaved(outputId);
    }
    setExportPdfDialog(false);
    doExportPdf();
  }, [liveContent, outputId, markSaved, doExportPdf]);

  if (!projectId || !targetTypeParam) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">Invalid route.</p>
      </div>
    );
  }

  if (!project || !output) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">Loading editor…</p>
      </div>
    );
  }

  const sectionNames = sections.map((s) => ({
    sectionId: s.sectionId,
    sectionName: s.sectionName,
  }));

  const isCoworkPackage = targetType === "cowork-package";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <EditorToolbar
        projectId={projectId}
        projectName={project.name}
        targetType={targetType}
        output={output}
        sectionNames={sectionNames}
        onRegenerateSection={handleRegenerateSection}
        onRegenerateAll={handleRegenerateAll}
        onExportPdf={handleExportPdf}
        regeneratingSectionId={regeneratingSectionId}
        isCoworkPackage={isCoworkPackage}
      />
      {isCoworkPackage ? (
        <CoworkPackageView project={project} output={output} />
      ) : (
        <div className="flex flex-1 min-h-0">
          <LeftPanel
            outputId={outputId}
            sections={sections}
            activeSectionId={activeSectionId}
            onSectionInView={setActiveSectionId}
            regeneratingSectionId={regeneratingSectionId}
          />
          <RightPanel
            outputId={outputId}
            content={content}
            activeSectionId={activeSectionId}
          />
        </div>
      )}
      <Dialog
        open={!!regenerateSectionDialog}
        onOpenChange={(open) => !open && setRegenerateSectionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Regenerate {regenerateSectionDialog?.sectionName}?
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              This will replace the current AI-generated content for this
              section.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenerateSectionDialog(null)}
            >
              Cancel
            </Button>
            <Button onClick={confirmRegenerateSection}>Regenerate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={regenerateAllDialog} onOpenChange={setRegenerateAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate entire {targetType}?</DialogTitle>
            <p className="text-sm text-muted-foreground">
              This will replace all AI-generated content.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateAllDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRegenerateAll}>Regenerate all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={exportPdfDialog} onOpenChange={setExportPdfDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save before exporting?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportPdfDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={doExportPdf}>
              Export without saving
            </Button>
            <Button onClick={saveAndExportPdf}>Save and export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
