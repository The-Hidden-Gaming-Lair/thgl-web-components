import { games as thglGames } from "@repo/lib";
import {
  getDueGames,
  insertGame,
  listGames,
  markChecked,
  pruneHourly,
  recordBuilds,
  recordSamples,
  updateGame,
  type Sample,
} from "@/lib/stats-db";
import {
  fetchDiscordInvite,
  fetchSteamAppDetails,
  fetchSteamBuilds,
  fetchSteamCcu,
  fetchSteamFollowers,
  fetchSteamReviews,
  fetchTwitchCounts,
  mapLimit,
  resolveTwitchGameId,
  steamPlatformEntry,
  twitchConfigured,
} from "@/lib/stats-sources";
import { type StatsGame } from "@/lib/stats-types";

/**
 * Secret-gated game-stats collector, called every 10 minutes by the same
 * mia crontab that drives /api/status/run (Bearer STATS_RUN_SECRET, falls
 * back to STATUS_RUN_SECRET).
 *
 * Every run:   Steam player count for every tracked Steam game.
 * Hourly pass: Steam builds, Discord online, Twitch viewers — spread over
 *              runs via stats_games.hourly_at (oldest first, capped).
 * Daily pass:  Steam reviews + followers, Discord members, store metadata.
 *
 * Supported games are synced from games.ts (`steamAppId`) on every run, so
 * a newly added game — or a fulfilled request — needs no manual step.
 */

const LOG = "[stats/run]";
const HOURLY_BATCH = 40;
const DAILY_BATCH = 25;
const TRACKED = (g: StatsGame) =>
  g.status !== "pending" && g.status !== "declined";

async function syncSupportedGames(rows: StatsGame[]): Promise<number> {
  let changed = 0;
  for (const game of thglGames) {
    const byThglId = rows.find((r) => r.thglId === game.id);
    if (byThglId) {
      if (byThglId.status !== "supported") {
        await updateGame(byThglId.id, { status: "supported" });
        changed++;
      }
      continue;
    }
    const bySteam = game.steamAppId
      ? rows.find((r) => r.steamAppId === game.steamAppId)
      : undefined;
    const byId = rows.find((r) => r.id === game.id);
    const existing = bySteam ?? byId;
    if (existing) {
      // A requested/watched game got supported → keep its history + votes.
      await updateGame(existing.id, { status: "supported", thglId: game.id });
    } else {
      await insertGame({
        id: game.id,
        title: game.title,
        status: "supported",
        thglId: game.id,
        steamAppId: game.steamAppId ?? null,
        platforms: game.steamAppId ? [steamPlatformEntry(game.steamAppId)] : [],
      });
    }
    changed++;
  }
  return changed;
}

async function hourlyPass(games: StatsGame[]) {
  const samples: Sample[] = [];
  const builds: Parameters<typeof recordBuilds>[0] = [];
  await mapLimit(games, 6, async (game) => {
    if (game.steamAppId) {
      const branches = await fetchSteamBuilds(game.steamAppId);
      for (const b of branches ?? []) builds.push({ gameId: game.id, ...b });
    }
    if (game.discordInvite) {
      const invite = await fetchDiscordInvite(game.discordInvite);
      // Pin the guild on first resolve; an invite that later points at a
      // different server (expired vanity re-claimed) is ignored.
      if (
        invite &&
        (!game.discordGuildId || invite.guildId === game.discordGuildId)
      ) {
        if (!game.discordGuildId) {
          await updateGame(game.id, { discordGuildId: invite.guildId });
        }
        samples.push({
          gameId: game.id,
          metric: "discord_online",
          value: invite.online,
        });
      }
    }
    if (twitchConfigured()) {
      let twitchId = game.twitchGameId;
      if (!twitchId) {
        twitchId = await resolveTwitchGameId(game.title);
        if (twitchId) await updateGame(game.id, { twitchGameId: twitchId });
      }
      if (twitchId) {
        const counts = await fetchTwitchCounts(twitchId);
        if (counts) {
          samples.push(
            {
              gameId: game.id,
              metric: "twitch_viewers",
              value: counts.viewers,
            },
            {
              gameId: game.id,
              metric: "twitch_channels",
              value: counts.channels,
            },
          );
        }
      }
    }
  });
  await recordSamples(samples, { hourly: true });
  const newBuilds = await recordBuilds(builds);
  await markChecked(
    games.map((g) => g.id),
    "hourly_at",
  );
  return { samples: samples.length, newBuilds };
}

async function dailyPass(games: StatsGame[]) {
  const samples: Sample[] = [];
  await mapLimit(games, 4, async (game) => {
    if (game.steamAppId) {
      const [reviews, followers, details] = await Promise.all([
        fetchSteamReviews(game.steamAppId),
        fetchSteamFollowers(game.steamAppId),
        fetchSteamAppDetails(game.steamAppId),
      ]);
      if (reviews) {
        samples.push(
          { gameId: game.id, metric: "steam_reviews", value: reviews.total },
          {
            gameId: game.id,
            metric: "steam_review_positive",
            value: reviews.positive,
          },
        );
      }
      if (followers !== null) {
        samples.push({
          gameId: game.id,
          metric: "steam_followers",
          value: followers,
        });
      }
      if (details) {
        const platforms = game.platforms.map((p) =>
          p.client === "steam"
            ? {
                ...p,
                status: details.comingSoon
                  ? ("upcoming" as const)
                  : p.status === "early_access"
                    ? p.status
                    : ("released" as const),
              }
            : p,
        );
        if (!platforms.some((p) => p.client === "steam")) {
          platforms.unshift(
            steamPlatformEntry(game.steamAppId, details.comingSoon),
          );
        }
        await updateGame(game.id, {
          imageUrl: details.imageUrl,
          releaseDate: details.releaseDate,
          platforms,
        });
      }
    }
    if (game.discordInvite) {
      const invite = await fetchDiscordInvite(game.discordInvite);
      if (
        invite &&
        (!game.discordGuildId || invite.guildId === game.discordGuildId)
      ) {
        samples.push({
          gameId: game.id,
          metric: "discord_members",
          value: invite.members,
        });
      }
    }
  });
  await recordSamples(samples, { hourly: false });
  await markChecked(
    games.map((g) => g.id),
    "daily_at",
  );
  return { samples: samples.length };
}

export const maxDuration = 55;
export async function GET(request: Request) {
  const secret = process.env.STATS_RUN_SECRET ?? process.env.STATUS_RUN_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const started = Date.now();
  const report: Record<string, unknown> = {};
  try {
    let rows = await listGames();
    const synced = await syncSupportedGames(rows);
    if (synced > 0) rows = await listGames();
    report.synced = synced;

    // Every run: Steam player counts.
    const steamGames = rows.filter((g) => TRACKED(g) && g.steamAppId);
    const ccus = await mapLimit(steamGames, 12, (g) =>
      fetchSteamCcu(g.steamAppId!),
    );
    const ccuSamples: Sample[] = [];
    steamGames.forEach((g, i) => {
      const value = ccus[i];
      if (value !== null)
        ccuSamples.push({ gameId: g.id, metric: "steam_ccu", value });
    });
    await recordSamples(ccuSamples, { hourly: true });
    report.ccu = `${ccuSamples.length}/${steamGames.length}`;

    const byId = new Map(rows.map((g) => [g.id, g]));
    const pick = (ids: string[]) =>
      ids.map((id) => byId.get(id)).filter((g): g is StatsGame => Boolean(g));

    // Slow passes, spread across runs (oldest-checked first).
    const hourlyDue = pick(
      await getDueGames("hourly_at", 3600 - 300, HOURLY_BATCH),
    );
    if (hourlyDue.length > 0)
      report.hourly = {
        games: hourlyDue.length,
        ...(await hourlyPass(hourlyDue)),
      };

    if (Date.now() - started < 30_000) {
      const dailyDue = pick(
        await getDueGames("daily_at", 86400 - 600, DAILY_BATCH),
      );
      if (dailyDue.length > 0)
        report.daily = {
          games: dailyDue.length,
          ...(await dailyPass(dailyDue)),
        };
    }

    // Once a day (first run after 00:00 UTC).
    if (Math.floor(Date.now() / 1000) % 86400 < 600) {
      await pruneHourly();
      report.pruned = true;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} failed: ${msg}`);
    return Response.json({ ok: false, error: msg, ...report }, { status: 500 });
  }
  report.ms = Date.now() - started;
  return Response.json({ ok: true, ...report });
}
