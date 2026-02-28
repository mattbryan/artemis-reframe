// SERVER ONLY

export const maxDuration = 120;

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
import type { Project } from "@/types/project";
import type { GeneratedOutputContent } from "@/types/generation";

async function appendGenerationLog(
  projectId: string,
  step: string,
  createdAt?: number
): Promise<void> {
  const logResult = await adminDb.query({
    project: { $: { where: { id: projectId } } },
  });
  const row = logResult.project?.[0] as {
    generationLog?: string[];
    createdAt?: number;
  } | undefined;
  const current = Array.isArray(row?.generationLog) ? row.generationLog : [];
  const created =
    typeof row?.createdAt === "number" ? row.createdAt : Date.now();
  await adminDb.transact([
    adminDb.tx.project[projectId].update({
      generationLog: [...current, step],
      createdAt: createdAt ?? created,
      updatedAt: Date.now(),
    }),
  ]);
}

export async function POST(request: Request): Promise<Response> {
  let projectId: string;
  let targetType: string;
  try {
    const body = await request.json();
    projectId = body.projectId;
    targetType = body.targetType;
    if (!projectId || !targetType) throw new Error("Missing projectId or targetType");
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  try {
    const projectResult = await adminDb.query({
      project: {
        $: { where: { id: projectId } },
        outputs: {},
      },
    });
    const projectRow = projectResult.project?.[0] as unknown as (Project & {
      outputs?: Array<{ id: string; targetType: string } | Record<string, unknown>>;
    }) | undefined;
    if (!projectRow) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const outputsRaw = projectRow.outputs;
    const outputsList: { id: string; targetType: string }[] = Array.isArray(
      outputsRaw
    )
      ? (outputsRaw as { id: string; targetType: string }[])
      : outputsRaw
        ? Object.entries(outputsRaw as Record<string, unknown>).map(
            ([id, v]) => ({
              ...(typeof v === "object" && v !== null
                ? (v as Record<string, unknown>)
                : {}),
              id,
              targetType: (typeof v === "object" && v !== null && v && "targetType" in v
                ? (v as { targetType?: string }).targetType
                : "") ?? "",
            })
          )
        : [];
    const outputRow = outputsList.find(
      (o) => (o.targetType ?? (o as Record<string, unknown>).targetType) === targetType
    ) as { id: string; targetType: string } | undefined;
    if (!outputRow) {
      return Response.json(
        { error: "No output found for this target type" },
        { status: 404 }
      );
    }

    const project = projectRow as Project;
    const projectCreatedAt =
      typeof (project as { createdAt?: number }).createdAt === "number"
        ? (project as { createdAt: number }).createdAt
        : Date.now();

    await appendGenerationLog(
      projectId,
      `Regenerating ${formatTargetType(targetType)}...`,
      projectCreatedAt
    );

    const briefId = project.outputTargetAssignments?.[targetType as keyof typeof project.outputTargetAssignments];
    if (!briefId) {
      await appendGenerationLog(
        projectId,
        `✗ No brief assigned for ${formatTargetType(targetType)}`
      );
      return Response.json(
        { error: "No brief assigned for this target" },
        { status: 400 }
      );
    }

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

    const [brandCtx, collateralCtx, projectInput, briefCtx] =
      await Promise.all([
        assembleBrandContext(targetType as Parameters<typeof assembleBrandContext>[0]),
        assembleCollateralContext(project.collateralTypeId),
        assembleProjectInput(
          project,
          collateralType as unknown as Parameters<typeof assembleProjectInput>[1]
        ),
        assembleDesignBriefContext(briefId),
      ]);

    const systemPrompt = buildSystemPrompt(brandCtx, collateralCtx);
    const userPrompt = buildUserPrompt(
      projectInput,
      briefCtx,
      targetType as Parameters<typeof buildUserPrompt>[2]
    );

    const result = await generateContent({
      projectId,
      targetType,
      systemPrompt,
      userPrompt,
      deliverableType: targetType,
    });

    let contentJson: GeneratedOutputContent;
    try {
      contentJson = JSON.parse(result.content) as GeneratedOutputContent;
    } catch {
      throw new Error("Generated content is invalid JSON");
    }
    const outputId = outputRow.id;
    await adminDb.transact([
      adminDb.tx.projectOutput[outputId].update({
        contentJson: contentJson as unknown as Record<string, unknown>,
        status: "complete",
        updatedAt: Date.now(),
      }),
    ]);

    await appendGenerationLog(
      projectId,
      `${formatTargetType(targetType)} regenerated ✓`
    );

    return Response.json({ projectId, outputId, status: "complete" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
