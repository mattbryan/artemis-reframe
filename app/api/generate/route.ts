// SERVER ONLY

export const maxDuration = 120;

import { id } from "@instantdb/admin";
import { adminDb } from "@/lib/instantAdmin";
import {
  assembleBrandContext,
  assembleCollateralContext,
  assembleProjectInput,
  assembleDesignBriefContext,
} from "@/lib/contextAssembly";
import {
  buildSystemPrompt,
  buildUserPrompt,
  formatTargetType,
} from "@/lib/promptBuilder";
import { generateContent } from "@/lib/ai";
import type { OutputTargetDef } from "@/types/collateralType";
import type { Project } from "@/types/project";

export async function POST(request: Request): Promise<Response> {
  let projectId: string;
  try {
    const body = await request.json();
    projectId = body.projectId;
    if (!projectId) throw new Error("Missing projectId");
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const projectResult = await adminDb.query({
      project: { $: { where: { id: projectId } } },
    });
    const project = projectResult.project?.[0] as unknown as Project | undefined;
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.status !== "generating") {
      return Response.json(
        {
          error: `Project status is '${project.status}', expected 'generating'`,
        },
        { status: 400 }
      );
    }
    const projectCreatedAt =
      typeof (project as { createdAt?: number }).createdAt === "number"
        ? (project as { createdAt: number }).createdAt
        : Date.now();

    const ctResult = await adminDb.query({
      collateralType: {
        $: { where: { id: project.collateralTypeId } },
        globalFields: {},
        sections: {},
        mediaFields: {},
      },
    });
    const collateralType = ctResult.collateralType?.[0];
    if (!collateralType) {
      throw new Error(`Collateral type not found: ${project.collateralTypeId}`);
    }

    let outputTargets: OutputTargetDef[] = [];
    try {
      outputTargets = JSON.parse(String(collateralType.outputTargets ?? "[]"));
    } catch {
      throw new Error("Failed to parse collateral type output targets");
    }

    await appendGenerationLog(projectId, "Reading your brand guidelines...", projectCreatedAt);
    await appendGenerationLog(projectId, "Reviewing policies and rules...", projectCreatedAt);

    let completedCount = 0;
    let failedCount = 0;

    for (const target of outputTargets) {
      const { targetType } = target;
      const briefId = project.outputTargetAssignments?.[targetType];

      if (!briefId) {
        await appendGenerationLog(
          projectId,
          `⚠ No brief assigned for ${formatTargetType(targetType)} — skipping`
        );
        failedCount++;
        continue;
      }

      if (targetType === "cowork-package") {
        const outputId = id();
        const emptyContent = {
          targetType: "cowork-package",
          headline: "",
          subheadline: "",
          sections: [],
          assetRecommendations: [],
          generationNotes: "",
        };
        await adminDb.transact([
          adminDb.tx.projectOutput[outputId].update({
            projectId,
            targetType,
            briefId,
            status: "complete",
            contentJson: emptyContent as unknown as Record<string, unknown>,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }),
          adminDb.tx.projectOutput[outputId].link({ project: projectId }),
          adminDb.tx.project[projectId].link({ outputs: outputId }),
        ]);
        await appendGenerationLog(
          projectId,
          `${formatTargetType(targetType)} complete ✓`
        );
        completedCount++;
        continue;
      }

      let systemPrompt: string | undefined;
      let userPrompt: string | undefined;

      try {
        await appendGenerationLog(
          projectId,
          `Reading context for ${formatTargetType(targetType)}...`
        );

        const [brandCtx, collateralCtx, projectInput, briefCtx] =
          await Promise.all([
            assembleBrandContext(targetType),
            assembleCollateralContext(project.collateralTypeId),
            assembleProjectInput(project as Project, collateralType as unknown as Parameters<typeof assembleProjectInput>[1]),
            assembleDesignBriefContext(briefId),
          ]);

        await appendGenerationLog(
          projectId,
          `Drafting content for ${formatTargetType(targetType)}...`
        );

        systemPrompt = buildSystemPrompt(brandCtx, collateralCtx);
        userPrompt = buildUserPrompt(projectInput, briefCtx, targetType);

        const result = await generateContent({
          projectId,
          targetType,
          systemPrompt,
          userPrompt,
          deliverableType: targetType,
        });

        const outputId = id();
        const contentJson = JSON.parse(result.content) as Record<string, unknown>;
        await adminDb.transact([
          adminDb.tx.projectOutput[outputId].update({
            projectId,
            targetType,
            briefId,
            status: "complete",
            contentJson,
            rawPrompt: systemPrompt,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }),
          adminDb.tx.projectOutput[outputId].link({ project: projectId }),
          adminDb.tx.project[projectId].link({ outputs: outputId }),
        ]);

        await appendGenerationLog(
          projectId,
          `${formatTargetType(targetType)} complete ✓`
        );
        completedCount++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        await appendGenerationLog(
          projectId,
          `✗ ${formatTargetType(targetType)} failed: ${message}`
        );

        const outputId = id();
        await adminDb.transact([
          adminDb.tx.projectOutput[outputId].update({
            projectId,
            targetType,
            briefId,
            status: "failed",
            contentJson: {} as unknown as Record<string, unknown>,
            rawPrompt: systemPrompt,
            errorMessage: message,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }),
          adminDb.tx.projectOutput[outputId].link({ project: projectId }),
          adminDb.tx.project[projectId].link({ outputs: outputId }),
        ]);

        failedCount++;
      }
    }

    await appendGenerationLog(projectId, "Finalizing your collateral...");

    const finalStatus = completedCount === 0 ? "failed" : "complete";
    const errorMessage =
      completedCount === 0
        ? "All output targets failed to generate."
        : undefined;

    await adminDb.transact([
      adminDb.tx.project[projectId].update({
        status: finalStatus,
        ...(errorMessage ? { errorMessage } : {}),
        createdAt: projectCreatedAt,
        updatedAt: Date.now(),
      }),
    ]);

    return Response.json({ projectId, completedCount, failedCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    let createdAt: number = Date.now();
    try {
      const r = await adminDb.query({
        project: { $: { where: { id: projectId } } },
      });
      const p = r.project?.[0] as { createdAt?: number } | undefined;
      if (typeof p?.createdAt === "number") createdAt = p.createdAt;
    } catch {
      // ignore
    }
    try {
      await adminDb.transact([
        adminDb.tx.project[projectId].update({
          status: "failed",
          errorMessage: message,
          createdAt,
          updatedAt: Date.now(),
        }),
      ]);
    } catch {
      // best effort
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

async function appendGenerationLog(
  projectId: string,
  step: string,
  createdAt?: number
): Promise<void> {
  const logResult = await adminDb.query({
    project: { $: { where: { id: projectId } } },
  });
  const row = logResult.project?.[0] as { generationLog?: string[]; createdAt?: number } | undefined;
  const current = Array.isArray(row?.generationLog) ? row.generationLog : [];
  const created = typeof row?.createdAt === "number" ? row.createdAt : Date.now();
  await adminDb.transact([
    adminDb.tx.project[projectId].update({
      generationLog: [...current, step],
      createdAt: createdAt ?? created,
      updatedAt: Date.now(),
    }),
  ]);
}
