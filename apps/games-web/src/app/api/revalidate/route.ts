import { revalidateTag } from "next/cache";
import { games } from "@repo/lib";
import { getAppConfigBySlug } from "@/configs";
import { palia } from "@/configs/palia";

/**
 * On-demand revalidation endpoint. Two callers:
 *
 *   1. **Game-data updates** (`{ game: "<id>" }`) — data-forge's
 *      `sync:bunny` pings this after mirroring a game's data to the CDN,
 *      so that game's tenant pages re-render with the new data
 *      immediately instead of waiting out their (now long) s-maxage.
 *      Dynamic pages read `version.json` on every render; the cached
 *      /db pages (cache-handler.cjs) are stamped with the data version
 *      they were rendered from and re-render once it changes — on every
 *      pod by itself. So we only need the Bunny EDGE purge (twice, see
 *      below), no `revalidateTag`: revalidate ONLY the tenant whose data
 *      actually changed.
 *
 *   2. **Palia live data** (`{ tag: "leaderboard" | ... }`) — the
 *      upstream palia-api pings this on leaderboard / rummage-pile /
 *      weekly-wants updates; those pages use tagged `force-cache`
 *      fetches, so they need `revalidateTag` AND the edge purge.
 *
 * Secret-gated (Authorization: Bearer <PALIA_REVALIDATE_SECRET>).
 *
 * Bunny purge uses `async=false` — wildcard purges submitted with
 * `async=true` were observed to take >15s (or fail silently) to take
 * effect. The synchronous variant returns once Bunny has confirmed the
 * purge, which is fast enough (~1-2s for a few URLs in parallel).
 * Bunny rate-limits wildcard purges to ~5/second per account (HTTP 429),
 * so we purge at most one wildcard per tenant per call.
 */

// Map upstream tag → palia path. Tags we don't know about still get
// revalidateTag()-ed (in case palia-api adds new ones), but we skip the
// edge purge for them since we don't know which URL to invalidate.
const TAG_TO_PATH: Record<string, string> = {
  leaderboard: "/leaderboard",
  "rummage-pile": "/rummage-pile",
  "weekly-wants": "/weekly-wants",
};

type PurgeFailure = { url: string; status: number | "error"; body: string };
type PurgeResult =
  | { configured: false }
  | {
      configured: true;
      succeeded: number;
      failed: number;
      total: number;
      failures: PurgeFailure[];
    };

async function purgeBunny(urls: string[]): Promise<PurgeResult> {
  const accessKey = process.env.BUNNY_ACCOUNT_API_KEY;
  if (!accessKey) return { configured: false };
  if (urls.length === 0)
    return {
      configured: true,
      succeeded: 0,
      failed: 0,
      total: 0,
      failures: [],
    };

  const results = await Promise.all(
    urls.map(async (url): Promise<PurgeFailure | null> => {
      try {
        const res = await fetch(
          `https://api.bunny.net/purge?url=${encodeURIComponent(url)}&async=false`,
          {
            method: "POST",
            headers: { AccessKey: accessKey, accept: "application/json" },
          },
        );
        if (res.ok) return null;
        const body = await res.text().catch(() => "");
        console.error(
          `Bunny purge failed (${res.status}): ${url} — ${body.slice(0, 200)}`,
        );
        return { url, status: res.status, body: body.slice(0, 200) };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Bunny purge error: ${url}`, err);
        return { url, status: "error", body: msg.slice(0, 200) };
      }
    }),
  );
  const failures = results.filter((r): r is PurgeFailure => r !== null);
  return {
    configured: true,
    succeeded: results.length - failures.length,
    failed: failures.length,
    total: results.length,
    failures,
  };
}

/**
 * Build the en-locale variant of the given canonical path, with a
 * trailing `*` so Bunny purges the bare URL AND any query-string
 * variants in one call. Without the wildcard, `/rummage-pile` is a
 * separate cache key from `/rummage-pile?map=kilima-valley` and only
 * the bare URL would be invalidated.
 *
 * We deliberately do NOT purge each locale prefix (`/de/...`, `/fr/...`
 * etc): Bunny rate-limits wildcard purges to ~5/second per account
 * with HTTP 429 (`type: prefix`, `retry_after_seconds: 1-2`), so
 * firing all 10 in parallel produced half-failures. en accounts for
 * the bulk of palia traffic; localized variants refresh naturally
 * within the 60s s-maxage. If we ever need instant localized purges,
 * serialise with the server's `retry_after_seconds` backoff.
 */
function paliaUrlsForPath(path: string): string[] {
  return [`https://${palia.domain}.th.gl${path}*`];
}

export async function POST(request: Request) {
  const expected = process.env.PALIA_REVALIDATE_SECRET;
  // Fail closed when the secret isn't configured — otherwise both sides
  // are `undefined`, the equality check passes, and any anonymous POST
  // would trigger a revalidateTag + Bunny purge.
  if (!expected) {
    return Response.json(
      { message: "Revalidate not configured" },
      { status: 503 },
    );
  }
  const secret = request.headers.get("authorization")?.split(" ")[1];
  if (secret !== expected) {
    return Response.json({ message: "Invalid token" }, { status: 401 });
  }

  const body = await request.json();

  // --- Mode 1: game-data update -> purge that tenant's pages (edge only) ---
  if (typeof body.game === "string") {
    const game = games.find((g) => g.id === body.game);
    // Web-only tenants (e.g. drakantos) have a tenant config but no games
    // registry entry; their URL comes from the config's subdomain.
    const tenant = game ? null : getAppConfigBySlug(body.game);
    if (!game && !tenant) {
      return Response.json(
        { message: `Unknown game: ${body.game}` },
        { status: 404 },
      );
    }
    const web = game ? game.web : `https://${tenant!.domain}.th.gl`;
    if (!web) {
      return Response.json(
        { message: `Game ${body.game} has no tenant web URL` },
        { status: 400 },
      );
    }
    // A new release-notes post (`updates: true`, sent by data-forge's post-release-notes):
    // the release-notes feed is a cached fetch, so expire it NOW - a stale-while-revalidate
    // mark would hand the old feed to the very render that refills the purged edge.
    if (body.updates === true) revalidateTag("discord-updates", { expire: 0 });
    // One wildcard covers every path + locale + query variant for the tenant.
    const purgeResult = await purgeBunny([`${web}/*`]);
    // ...and once more after every pod has seen the new data version. Pods
    // learn about it within ~30-90 s (version.json memory cache, page-cache
    // version check in cache-handler.cjs); an edge refill inside that window
    // could otherwise pin the previous data at the edge for the 1-day page TTL.
    setTimeout(() => {
      purgeBunny([`${web}/*`]).catch(() => {});
    }, 150_000);
    return Response.json({
      revalidated: true,
      game: body.game,
      purge: purgeResult,
      now: Date.now(),
    });
  }

  // --- Mode 2: palia live-data tag revalidation (existing) ---
  const tag = body.tag;
  if (typeof tag !== "string") {
    return Response.json(
      { message: "Provide `game` (id) or `tag`" },
      { status: 400 },
    );
  }

  // Next.js 16 requires a cacheLife profile as the second argument.
  // "max" marks the tagged data stale for background revalidation; the
  // synchronous Bunny purge below handles immediate edge invalidation.
  revalidateTag(tag, "max");

  const path = TAG_TO_PATH[tag];
  const purgedUrls = path ? paliaUrlsForPath(path) : [];
  // Await sync purge so the caller knows the edge cache is invalidated
  // before we return — async=true purges weren't reliable end-to-end.
  const purgeResult = await purgeBunny(purgedUrls);

  return Response.json({
    revalidated: true,
    purge: purgeResult,
    now: Date.now(),
  });
}
