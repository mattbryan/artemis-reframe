/**
 * Server-side image proxy for Cowork Package assembly.
 * Fetches images from allowlisted storage domains to avoid CORS when building ZIPs client-side.
 */

const ALLOWED_HOSTS = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "instantdb.com",
];

function isHostAllowlisted(hostname: string): boolean {
  if (ALLOWED_HOSTS.includes(hostname)) return true;
  if (hostname.endsWith(".instantdb.com")) return true;
  return false;
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";
  if (!url || url.trim() === "") {
    return new Response("Missing or empty url", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!isHostAllowlisted(parsed.hostname)) {
    return new Response("Forbidden", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch {
    return new Response("Bad Gateway", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("Bad Gateway", { status: 502 });
  }

  const contentType = upstream.headers.get("Content-Type") ?? "application/octet-stream";
  const body = upstream.body;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
