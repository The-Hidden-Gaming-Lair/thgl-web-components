import { buildStatusDocument } from "@/lib/status-document";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const CACHED = {
  ...CORS,
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};
const UNCACHED = { ...CORS, "Cache-Control": "no-store" };

// No request object is used, so Next would otherwise statically
// optimize this route and serve a build-time snapshot. Freshness comes
// from per-request rendering + the s-maxage CDN cache below.
export const dynamic = "force-dynamic";

export const maxDuration = 25;
export async function GET() {
  const { doc, degradedMode } = await buildStatusDocument();
  return Response.json(doc, { headers: degradedMode ? UNCACHED : CACHED });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
