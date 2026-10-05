import { buildStatusDocument } from "@/lib/status-document";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const CACHED = {
  ...CORS,
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};
// Degraded (DB unreachable) docs are provisional, so keep them short-lived —
// but never no-store: every banner poll would then reach the origin.
const DEGRADED = {
  ...CORS,
  "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
};

// No request object is used, so Next would otherwise statically
// optimize this route and serve a build-time snapshot. Freshness comes
// from per-request rendering + the s-maxage CDN cache below.
export const dynamic = "force-dynamic";

export const maxDuration = 25;
export async function GET() {
  const { doc, degradedMode } = await buildStatusDocument();
  return Response.json(doc, { headers: degradedMode ? DEGRADED : CACHED });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
