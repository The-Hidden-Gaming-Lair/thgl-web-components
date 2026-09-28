import { corsPreflight, handle, jsonResponse } from "@/lib/api-errors";
import { listGamesWithSummary } from "@/lib/stats-db";
import { PUBLIC_STATUSES } from "@/lib/stats-types";

/** Public list of tracked games with their stat summaries (edge-cached, next.config.js). */
export async function GET() {
  return handle(async () =>
    jsonResponse({ games: await listGamesWithSummary(PUBLIC_STATUSES) }),
  );
}

export function OPTIONS() {
  return corsPreflight();
}
