import { type PlatformEntry } from "@/lib/stats-types";

/**
 * Public data sources for game stats. Every fetcher returns null on any
 * failure (timeout, 4xx/5xx, unexpected shape) — one flaky source must
 * never fail a collector run.
 *
 * - Steam player count: ISteamUserStats/GetNumberOfCurrentPlayers (no key)
 * - Steam builds: api.steamcmd.net (same source as data-forge's
 *   detect-game-updates.ps1)
 * - Steam reviews / follower count / store metadata: store + community
 * - Discord: invite endpoint with_counts (official invite, guild-pinned)
 * - Twitch: Helix, only when TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET are set
 *
 * Never scrape SteamDB.
 */

const USER_AGENT = "THGL-Stats/1.0 (+https://www.th.gl/stats)";

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response | null> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": USER_AGENT, ...init.headers },
      signal: ctrl.signal,
      cache: "no-store",
    });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T | null> {
  const res = await fetchWithTimeout(url, init);
  if (!res) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Run `fn` over items with bounded concurrency. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

// ── Steam ─────────────────────────────────────────────────────────────

export async function fetchSteamCcu(appId: number): Promise<number | null> {
  const body = await fetchJson<{
    response?: { player_count?: number; result?: number };
  }>(
    `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`,
  );
  // result 1 = ok; unreleased apps answer 42 / 404 → no data, not zero.
  if (body?.response?.result !== 1) return null;
  return body.response.player_count ?? null;
}

export type SteamBranchBuild = {
  branch: string;
  buildId: string;
  timeUpdated: number | null;
};

export async function fetchSteamBuilds(
  appId: number,
): Promise<SteamBranchBuild[] | null> {
  const body = await fetchJson<{
    status?: string;
    data?: Record<
      string,
      {
        depots?: {
          branches?: Record<
            string,
            { buildid?: string; timeupdated?: string; pwdrequired?: string }
          >;
        };
      }
    >;
  }>(`https://api.steamcmd.net/v1/info/${appId}`);
  const branches = body?.data?.[String(appId)]?.depots?.branches;
  if (!branches) return null;
  return Object.entries(branches)
    .filter(([, b]) => b.buildid && b.pwdrequired !== "1")
    .map(([branch, b]) => ({
      branch,
      buildId: b.buildid!,
      timeUpdated: b.timeupdated ? Number(b.timeupdated) : null,
    }));
}

export async function fetchSteamReviews(
  appId: number,
): Promise<{ total: number; positive: number } | null> {
  const body = await fetchJson<{
    success?: number;
    query_summary?: { total_reviews?: number; total_positive?: number };
  }>(
    `https://store.steampowered.com/appreviews/${appId}?json=1&num_per_page=0&language=all&purchase_type=all`,
  );
  const q = body?.query_summary;
  if (body?.success !== 1 || q?.total_reviews === undefined) return null;
  return { total: q.total_reviews, positive: q.total_positive ?? 0 };
}

export async function fetchSteamFollowers(
  appId: number,
): Promise<number | null> {
  const res = await fetchWithTimeout(
    `https://steamcommunity.com/games/${appId}/memberslistxml/?xml=1`,
  );
  if (!res) return null;
  const match = (await res.text()).match(/<memberCount>(\d+)<\/memberCount>/);
  return match ? Number(match[1]) : null;
}

export type SteamAppDetails = {
  appId: number;
  name: string;
  type: string;
  imageUrl: string | null;
  releaseDate: string | null;
  comingSoon: boolean;
};

export async function fetchSteamAppDetails(
  appId: number,
): Promise<SteamAppDetails | null> {
  const body = await fetchJson<
    Record<
      string,
      {
        success?: boolean;
        data?: {
          name?: string;
          type?: string;
          header_image?: string;
          release_date?: { coming_soon?: boolean; date?: string };
        };
      }
    >
  >(
    `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=us&filters=basic,release_date`,
  );
  const entry = body?.[String(appId)];
  if (!entry?.success || !entry.data?.name) return null;
  return {
    appId,
    name: entry.data.name,
    type: entry.data.type ?? "unknown",
    imageUrl: entry.data.header_image ?? null,
    releaseDate: entry.data.release_date?.date || null,
    comingSoon: entry.data.release_date?.coming_soon ?? false,
  };
}

export type SteamSearchResult = {
  appId: number;
  name: string;
  imageUrl: string | null;
};

export async function searchSteam(term: string): Promise<SteamSearchResult[]> {
  const body = await fetchJson<{
    items?: { id: number; name: string; tiny_image?: string; type?: string }[];
  }>(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`,
  );
  return (body?.items ?? [])
    .filter((i) => !i.type || i.type === "app")
    .slice(0, 10)
    .map((i) => ({
      appId: i.id,
      name: i.name,
      imageUrl: i.tiny_image ?? null,
    }));
}

export const steamStoreUrl = (appId: number) =>
  `https://store.steampowered.com/app/${appId}/`;

export const steamPlatformEntry = (
  appId: number,
  comingSoon = false,
): PlatformEntry => ({
  client: "steam",
  url: steamStoreUrl(appId),
  status: comingSoon ? "upcoming" : "released",
});

// ── Discord ───────────────────────────────────────────────────────────

export type DiscordInviteCounts = {
  guildId: string;
  guildName: string;
  members: number;
  online: number;
};

export async function fetchDiscordInvite(
  code: string,
): Promise<DiscordInviteCounts | null> {
  const body = await fetchJson<{
    guild?: { id?: string; name?: string };
    approximate_member_count?: number;
    approximate_presence_count?: number;
  }>(
    `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`,
  );
  if (!body?.guild?.id || body.approximate_member_count === undefined) {
    return null;
  }
  return {
    guildId: body.guild.id,
    guildName: body.guild.name ?? "",
    members: body.approximate_member_count,
    online: body.approximate_presence_count ?? 0,
  };
}

// ── Twitch ────────────────────────────────────────────────────────────

let twitchToken: { value: string; expiresAt: number } | null = null;

export function twitchConfigured(): boolean {
  return Boolean(
    process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET,
  );
}

async function getTwitchToken(): Promise<string | null> {
  if (!twitchConfigured()) return null;
  if (twitchToken && twitchToken.expiresAt > Date.now() + 60_000) {
    return twitchToken.value;
  }
  const res = await fetchWithTimeout(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" },
  );
  if (!res) return null;
  const body = (await res.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
  } | null;
  if (!body?.access_token) return null;
  twitchToken = {
    value: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
  };
  return twitchToken.value;
}

async function twitchGet<T>(path: string): Promise<T | null> {
  const token = await getTwitchToken();
  if (!token) return null;
  return fetchJson<T>(`https://api.twitch.tv/helix/${path}`, {
    headers: {
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
    },
  });
}

/** Resolve a Twitch category id by exact game title. */
export async function resolveTwitchGameId(
  title: string,
): Promise<string | null> {
  const body = await twitchGet<{ data?: { id: string }[] }>(
    `games?name=${encodeURIComponent(title)}`,
  );
  return body?.data?.[0]?.id ?? null;
}

/** Live viewers + channels for a category. Capped at 10 pages (1000 streams),
 *  which covers practically every viewer — streams are sorted by viewers. */
export async function fetchTwitchCounts(
  gameId: string,
): Promise<{ viewers: number; channels: number } | null> {
  let viewers = 0;
  let channels = 0;
  let cursor: string | undefined;
  for (let page = 0; page < 10; page++) {
    const body = await twitchGet<{
      data?: { viewer_count: number }[];
      pagination?: { cursor?: string };
    }>(
      `streams?game_id=${gameId}&first=100${cursor ? `&after=${cursor}` : ""}`,
    );
    if (!body?.data) return page === 0 ? null : { viewers, channels };
    for (const s of body.data) viewers += s.viewer_count;
    channels += body.data.length;
    cursor = body.pagination?.cursor;
    if (!cursor || body.data.length < 100) break;
  }
  return { viewers, channels };
}
