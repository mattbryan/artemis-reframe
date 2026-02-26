import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies elemental asset downloads to bypass CORS.
 * Server-side fetch avoids cross-origin restrictions when the CDN
 * doesn't allow direct browser fetches.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, filename } = body as { url?: string; filename?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid url" },
        { status: 400 }
      );
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch asset: ${res.status}` },
        { status: 502 }
      );
    }

    const blob = await res.blob();
    const safeName = (filename || "download").replace(/[^a-zA-Z0-9._-]/g, "_");
    const disposition = `attachment; filename="${safeName}"`;

    return new NextResponse(blob, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
        "Content-Disposition": disposition,
      },
    });
  } catch (err) {
    console.error("Download proxy error:", err);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
