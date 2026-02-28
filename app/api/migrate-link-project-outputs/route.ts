// SERVER ONLY — one-off migration to backfill project ↔ projectOutput links
// for records created before bidirectional linking was added.
//
// Run once:
//   POST /api/migrate-link-project-outputs
//   Optional: set MIGRATE_LINK_SECRET in .env.local and send body: { "secret": "<value>" }

import { adminDb } from "@/lib/instantAdmin";

const BATCH_SIZE = 20;

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.MIGRATE_LINK_SECRET;
  if (secret) {
    try {
      const body = await request.json().catch(() => ({}));
      if ((body as { secret?: string }).secret !== secret) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    let toLink: { id: string; projectId: string }[] = [];

    const result = await adminDb.query({
      projectOutput: {},
    }).catch(() => null);

    const raw = result
      ? (result as { projectOutput?: unknown }).projectOutput
      : undefined;

    if (raw !== undefined && raw !== null) {
      const list: { id: string; projectId: string }[] = Array.isArray(raw)
        ? (raw as { id: string; projectId: string }[]).map((r) => ({
            id: r.id,
            projectId: String(r.projectId ?? ""),
          }))
        : Object.entries(raw as Record<string, { projectId?: string }>).map(
            ([id, r]) => ({
              id,
              projectId: String(r?.projectId ?? ""),
            })
          );
      toLink = list.filter((x) => x.id && x.projectId);
    }

    if (toLink.length === 0) {
      const projResult = await adminDb.query({ project: {} }).catch(() => null);
      const proj = projResult
        ? (projResult as { project?: unknown }).project
        : undefined;
      const projectIds: string[] = Array.isArray(proj)
        ? (proj as { id: string }[]).map((p) => p.id).filter(Boolean)
        : proj && typeof proj === "object"
          ? Object.keys(proj as Record<string, unknown>)
          : [];
      for (const projectId of projectIds) {
        const outResult = await adminDb.query({
          projectOutput: { $: { where: { projectId } } },
        });
        const outRaw = (outResult as { projectOutput?: unknown }).projectOutput;
        if (outRaw == null) continue;
        const outList = Array.isArray(outRaw)
          ? (outRaw as { id: string }[]).map((r) => ({ id: r.id, projectId }))
          : Object.keys(outRaw as Record<string, unknown>).map((id) => ({
              id,
              projectId,
            }));
        toLink.push(...outList.filter((x) => x.id && x.projectId));
      }
    }

    if (toLink.length === 0) {
      return Response.json({
        ok: true,
        message: "No projectOutput entities to link",
        linked: 0,
        total: 0,
        errors: [],
      });
    }

    let linked = 0;
    const errors: string[] = [];

    for (let i = 0; i < toLink.length; i += BATCH_SIZE) {
      const batch = toLink.slice(i, i + BATCH_SIZE);
      const ops = batch.flatMap(({ id: outputId, projectId }) => [
        adminDb.tx.projectOutput[outputId].link({ project: projectId }),
        adminDb.tx.project[projectId].link({ outputs: outputId }),
      ]);
      try {
        await adminDb.transact(ops);
        linked += batch.length;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : String(err);
        errors.push(`Batch ${i / BATCH_SIZE + 1}: ${msg}`);
      }
    }

    return Response.json({
      ok: errors.length === 0,
      message:
        linked > 0
          ? `Linked ${linked} projectOutput(s) to their project(s).`
          : "Nothing to link or all batches failed.",
      linked,
      total: toLink.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
