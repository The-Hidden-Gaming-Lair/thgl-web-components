/**
 * Canonical games feed. `packages/lib/src/games.ts` (`@repo/lib` `games`) is
 * the single source of truth for which games THGL supports; this endpoint
 * exposes a slim projection as JSON so external consumers (the THGL Discord
 * bot's games sync) can provision/match without importing the web codebase.
 * Served at https://www.th.gl/api/games.
 */
import { games, type Game } from "@repo/lib";

type GameEntry = Pick<Game, "id" | "discordId" | "title" | "logo"> & {
  web: string | null;
};

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  // Cache at the edge for an hour; the games list changes rarely and the bot
  // reconciles on its own interval regardless.
  "Cache-Control": "public, max-age=300, s-maxage=3600",
};

export function GET() {
  const entries = games.map(
    (g): GameEntry => ({
      id: g.id,
      discordId: g.discordId,
      title: g.title,
      web: g.web ?? null,
      logo: g.logo,
    }),
  );
  return Response.json({ count: entries.length, games: entries }, { headers });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
