// SERVER ONLY

import { adminDb } from "@/lib/instantAdmin";
import { renderOutputToPdfBuffer } from "@/lib/pdfRenderer";
import type { GeneratedOutputContent } from "@/types/generation";
import { formatTargetType } from "@/lib/collateralTypeUtils";

export async function POST(request: Request): Promise<Response> {
  let projectOutputId: string;
  try {
    const body = await request.json();
    projectOutputId = body.projectOutputId;
    if (!projectOutputId) throw new Error("Missing projectOutputId");
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
      : (outputResult.projectOutput as Record<string, unknown>)?.[projectOutputId];

    if (!outputRow || typeof outputRow !== "object") {
      return Response.json(
        { error: "Project output not found" },
        { status: 404 }
      );
    }

    const projectId = (outputRow as { projectId?: string }).projectId;
    const targetType = (outputRow as { targetType?: string }).targetType ?? "print-pdf";

    if (!projectId) {
      return Response.json(
        { error: "Invalid project output" },
        { status: 400 }
      );
    }

    const projectResult = await adminDb.query({
      project: { $: { where: { id: projectId } } },
    });
    const projectRow = projectResult.project?.[0] as { name?: string } | undefined;
    const projectName = projectRow?.name ?? "document";

    const edited = (outputRow as { editedContentJson?: unknown }).editedContentJson;
    const contentRaw = (outputRow as { contentJson?: unknown }).contentJson;
    const rawContent: GeneratedOutputContent =
      contentRaw && typeof contentRaw === "object" && "sections" in (contentRaw as object)
        ? (contentRaw as GeneratedOutputContent)
        : {
            targetType: targetType as GeneratedOutputContent["targetType"],
            headline: "",
            subheadline: "",
            sections: [],
            assetRecommendations: [],
            generationNotes: "",
          };
    const content: GeneratedOutputContent =
      edited && typeof edited === "object" && "sections" in (edited as object)
        ? (edited as GeneratedOutputContent)
        : rawContent;

    // Preserve designSpec from raw content when using edited content that may omit it
    const resolvedContent: GeneratedOutputContent = {
      ...content,
      designSpec: content.designSpec ?? rawContent.designSpec,
    };

    const pdfBytes = await renderOutputToPdfBuffer(resolvedContent);
    const safeName = projectName.replace(/[^a-zA-Z0-9-_]/g, "-");
    const targetLabel = formatTargetType(targetType).replace(/\s+/g, "-");
    const filename = `${safeName}-${targetLabel}.pdf`;

    return new Response(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
