import {
  BadRequestError,
  corsPreflight,
  handle,
  jsonResponse,
} from "@/lib/api-errors";
import { listGames } from "@/lib/stats-db";
import { searchSteam } from "@/lib/stats-sources";

/** Steam store search for the request form, annotated with games we already track. */
export async function GET(request: Request) {
  return handle(async () => {
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2 || q.length > 80)
      throw new BadRequestError("Query must be 2-80 characters");
    const [results, tracked] = await Promise.all([searchSteam(q), listGames()]);
    const bySteam = new Map(
      tracked.filter((g) => g.steamAppId).map((g) => [g.steamAppId!, g]),
    );
    return jsonResponse({
      results: results.map((r) => {
        const game = bySteam.get(r.appId);
        return {
          ...r,
          tracked:
            game && game.status !== "pending"
              ? { id: game.id, status: game.status }
              : null,
        };
      }),
    });
  });
}

export function OPTIONS() {
  return corsPreflight();
}
