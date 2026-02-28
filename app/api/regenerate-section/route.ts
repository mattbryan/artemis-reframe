// SERVER ONLY

import { adminDb } from "@/lib/instantAdmin";
import {
  assembleBrandContext,
  assembleCollateralContext,
  assembleProjectInput,
  assembleDesignBriefContext,
} from "@/lib/contextAssembly";
import {
  buildSystemPrompt,
  buildRegenerateSectionUserPrompt,
} from "@/lib/promptBuilder";
import { generateSingleSection } from "@/lib/ai";
import type { Project } from "@/types/project";
import type { GeneratedOutputContent, GeneratedSection } from "@/types/generation";

export async function POST(request: Request): Promise<Response> {
  let projectOutputId: string;
  let sectionId: string;
  try {
    const body = await request.json();
    projectOutputId = body.projectOutputId;
    sectionId = body.sectionId;
    if (!projectOutputId || !sectionId) throw new Error("Missing projectOutputId or sectionId");
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  try {
    const outputResult = await adminDb.query({
      projectOutput: { $: { where: { id: projectOutputId } } },
    });
    const outputRow = Array.isArray(outputResult.projectOutput)
      ? outputResult.projectOutput[0]
      : outputResult.projectOutput?.[projectOutputId];
    if (!outputRow) {
      return Response.json({ error: "Project output not found" }, { status: 404 });
    }

    const projectId = (outputRow as { projectId?: string }).projectId;
    const targetType = (outputRow as { targetType?: string }).targetType ?? "print-pdf";
    const briefId = (outputRow as { briefId?: string }).briefId ?? "";

    if (!projectId) {
      return Response.json({ error: "Invalid project output" }, { status: 400 });
    }

    const projectResult = await adminDb.query({
      project: { $: { where: { id: projectId } } },
    });
    const project = projectResult.project?.[0] as unknown as Project | undefined;
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    let contentJson: GeneratedOutputContent;
    try {
      const raw = (outputRow as { contentJson?: unknown }).contentJson;
      contentJson =
        raw && typeof raw === "object" && "sections" in (raw as object)
          ? (raw as GeneratedOutputContent)
          : {
              targetType: targetType as GeneratedOutputContent["targetType"],
              headline: "",
              subheadline: "",
              sections: [],
              assetRecommendations: [],
              generationNotes: "",
            };
    } catch {
      contentJson = {
        targetType: targetType as GeneratedOutputContent["targetType"],
        headline: "",
        subheadline: "",
        sections: [],
        assetRecommendations: [],
        generationNotes: "",
      };
    }

    const section = contentJson.sections?.find((s) => s.sectionId === sectionId);
    const sectionName = section?.sectionName ?? sectionId;

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
      return Response.json(
        { error: "Collateral type not found" },
        { status: 404 }
      );
    }

    const [brandCtx, collateralCtx, projectInput, briefCtx] = await Promise.all([
      assembleBrandContext(targetType as Parameters<typeof assembleBrandContext>[0]),
      assembleCollateralContext(project.collateralTypeId),
      assembleProjectInput(
        project,
        collateralType as unknown as Parameters<typeof assembleProjectInput>[1]
      ),
      assembleDesignBriefContext(briefId),
    ]);

    const systemPrompt = buildSystemPrompt(brandCtx, collateralCtx);
    const userPrompt = buildRegenerateSectionUserPrompt(
      projectInput,
      briefCtx,
      targetType as Parameters<typeof buildRegenerateSectionUserPrompt>[2],
      sectionId,
      sectionName
    );

    const generated = await generateSingleSection(systemPrompt, userPrompt);
    const sectionResponse: GeneratedSection = {
      sectionId: generated.sectionId,
      sectionName: generated.sectionName,
      fields: generated.fields ?? {},
      narrative: generated.narrative ?? "",
    };

    return Response.json({ section: sectionResponse });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
