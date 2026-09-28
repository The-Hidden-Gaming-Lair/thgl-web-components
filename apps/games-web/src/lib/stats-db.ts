import { arg, libsql, type LibSqlStmt } from "@/lib/libsql";
import {
  type Metric,
  type PlatformEntry,
  type SeriesPoint,
  type StatsBuild,
  type StatsGame,
  type StatsGameDetail,
  type StatsGameWithSummary,
  type StatsStatus,
  type StatsSummary,
} from "@/lib/stats-types";

/**
 * Bunny DB access for game stats. Schema: scripts/apply-stats-schema.mjs.
 *
 * Every sample is folded into an hour bucket (pruned after 90 days) AND a
 * day bucket (kept forever) — max/sum/n/last per bucket, so no raw rows
 * pile up and "current value" is just the newest bucket's `last`.
 *
 * Upserts are one statement per distinct row; never batch two writes to
 * the same row in one pipeline request (Bunny DB silently no-ops the
 * second — see memory reference-bunnydb-pipeline-upsert-quirk).
 */

const HOUR = 3600;
const DAY = 86400;
const HOURLY_RETENTION_DAYS = 90;
/** Keep pipeline requests small enough for the 5s libsql timeout. */
const CHUNK = 80;

type Row = { type: string; value: string }[];

const now = () => Math.floor(Date.now() / 1000);
const num = (cell: { type: string; value: string } | undefined) =>
  !cell || cell.type === "null" ? null : Number(cell.value);
const str = (cell: { type: string; value: string } | undefined) =>
  !cell || cell.type === "null" ? null : cell.value;
const textOrNull = (v: string | null | undefined) =>
  v === null || v === undefined || v === "" ? arg.null() : arg.text(v);
const intOrNull = (v: number | null | undefined) =>
  v === null || v === undefined ? arg.null() : arg.int(v);

async function libsqlChunked(stmts: LibSqlStmt[]): Promise<void> {
  for (let i = 0; i < stmts.length; i += CHUNK) {
    await libsql(stmts.slice(i, i + CHUNK), 10_000);
  }
}

const GAME_COLS =
  "id, title, status, thgl_id, steam_app_id, platforms, image_url, release_date, url, discord_invite, discord_guild_id, twitch_game_id, note, vote_count, created_at, updated_at";

function rowToGame(row: Row): StatsGame {
  let platforms: PlatformEntry[];
  try {
    platforms = JSON.parse(row[5].value) as PlatformEntry[];
  } catch {
    platforms = [];
  }
  return {
    id: row[0].value,
    title: row[1].value,
    status: row[2].value as StatsStatus,
    thglId: str(row[3]),
    steamAppId: num(row[4]),
    platforms,
    imageUrl: str(row[6]),
    releaseDate: str(row[7]),
    url: str(row[8]),
    discordInvite: str(row[9]),
    discordGuildId: str(row[10]),
    twitchGameId: str(row[11]),
    note: str(row[12]),
    voteCount: Number(row[13].value),
    createdAt: Number(row[14].value),
    updatedAt: Number(row[15].value),
  };
}

export async function listGames(
  statuses?: StatsStatus[],
): Promise<StatsGame[]> {
  const where =
    statuses && statuses.length > 0
      ? `WHERE status IN (${statuses.map(() => "?").join(",")})`
      : "";
  const [result] = await libsql([
    {
      sql: `SELECT ${GAME_COLS} FROM stats_games ${where} ORDER BY vote_count DESC, title`,
      args: statuses?.map((s) => arg.text(s)),
    },
  ]);
  return result.rows.map(rowToGame);
}

/** Unreviewed (pending) requests — all of them, or one user's. */
export async function listPending(userId?: string): Promise<StatsGame[]> {
  const [result] = await libsql([
    {
      sql: `SELECT ${GAME_COLS} FROM stats_games WHERE status = 'pending'${userId ? " AND requested_by = ?" : ""} ORDER BY created_at DESC`,
      args: userId ? [arg.text(userId)] : [],
    },
  ]);
  return result.rows.map(rowToGame);
}

export async function getGame(id: string): Promise<StatsGame | null> {
  const [result] = await libsql([
    {
      sql: `SELECT ${GAME_COLS} FROM stats_games WHERE id = ?`,
      args: [arg.text(id)],
    },
  ]);
  return result.rows[0] ? rowToGame(result.rows[0]) : null;
}

/** The stats row + summary for a supported games.ts game. */
export async function getSupportedGameSummary(
  thglId: string,
): Promise<StatsGameWithSummary | null> {
  const [result] = await libsql([
    {
      sql: `SELECT ${GAME_COLS} FROM stats_games WHERE thgl_id = ? LIMIT 1`,
      args: [arg.text(thglId)],
    },
  ]);
  if (!result.rows[0]) return null;
  const game = rowToGame(result.rows[0]);
  const summaries = await getSummaries([game.id]);
  return { ...game, summary: summaries[game.id] ?? emptySummary() };
}

export async function getGameBySteamAppId(
  appId: number,
): Promise<StatsGame | null> {
  const [result] = await libsql([
    {
      sql: `SELECT ${GAME_COLS} FROM stats_games WHERE steam_app_id = ? LIMIT 1`,
      args: [arg.int(appId)],
    },
  ]);
  return result.rows[0] ? rowToGame(result.rows[0]) : null;
}

export async function insertGame(game: {
  id: string;
  title: string;
  status: StatsStatus;
  thglId?: string | null;
  steamAppId?: number | null;
  platforms?: PlatformEntry[];
  imageUrl?: string | null;
  releaseDate?: string | null;
  url?: string | null;
  requestedBy?: string | null;
}): Promise<boolean> {
  const t = now();
  const [result] = await libsql([
    {
      sql: "INSERT OR IGNORE INTO stats_games (id, title, status, thgl_id, steam_app_id, platforms, image_url, release_date, url, requested_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        arg.text(game.id),
        arg.text(game.title),
        arg.text(game.status),
        textOrNull(game.thglId),
        intOrNull(game.steamAppId),
        arg.text(JSON.stringify(game.platforms ?? [])),
        textOrNull(game.imageUrl),
        textOrNull(game.releaseDate),
        textOrNull(game.url),
        textOrNull(game.requestedBy),
        arg.int(t),
        arg.int(t),
      ],
    },
  ]);
  return (result.affected_row_count ?? 0) > 0;
}

export type GamePatch = Partial<{
  title: string;
  status: StatsStatus;
  thglId: string | null;
  steamAppId: number | null;
  platforms: PlatformEntry[];
  imageUrl: string | null;
  releaseDate: string | null;
  url: string | null;
  discordInvite: string | null;
  discordGuildId: string | null;
  twitchGameId: string | null;
  note: string | null;
}>;

const PATCH_COLUMNS: Record<keyof GamePatch, string> = {
  title: "title",
  status: "status",
  thglId: "thgl_id",
  steamAppId: "steam_app_id",
  platforms: "platforms",
  imageUrl: "image_url",
  releaseDate: "release_date",
  url: "url",
  discordInvite: "discord_invite",
  discordGuildId: "discord_guild_id",
  twitchGameId: "twitch_game_id",
  note: "note",
};

export async function updateGame(id: string, patch: GamePatch): Promise<void> {
  const sets: string[] = [];
  const args = [];
  for (const [key, column] of Object.entries(PATCH_COLUMNS) as [
    keyof GamePatch,
    string,
  ][]) {
    if (!(key in patch)) continue;
    const value = patch[key];
    sets.push(`${column} = ?`);
    if (key === "platforms") args.push(arg.text(JSON.stringify(value ?? [])));
    else if (key === "steamAppId") args.push(intOrNull(value as number | null));
    else args.push(textOrNull(value as string | null));
  }
  if (sets.length === 0) return;
  sets.push("updated_at = ?");
  args.push(arg.int(now()), arg.text(id));
  await libsql([
    { sql: `UPDATE stats_games SET ${sets.join(", ")} WHERE id = ?`, args },
  ]);
}

export async function deleteGame(id: string): Promise<void> {
  await libsql([
    {
      sql: "DELETE FROM stats_request_votes WHERE game_id = ?",
      args: [arg.text(id)],
    },
    { sql: "DELETE FROM stats_hourly WHERE game_id = ?", args: [arg.text(id)] },
    { sql: "DELETE FROM stats_daily WHERE game_id = ?", args: [arg.text(id)] },
    { sql: "DELETE FROM stats_builds WHERE game_id = ?", args: [arg.text(id)] },
    { sql: "DELETE FROM stats_games WHERE id = ?", args: [arg.text(id)] },
  ]);
}

// ── Collector writes ──────────────────────────────────────────────────

export type Sample = { gameId: string; metric: Metric; value: number };

/** Fold samples into their hour bucket (hourly=true) and day bucket. */
export async function recordSamples(
  samples: Sample[],
  { hourly }: { hourly: boolean },
): Promise<void> {
  const t = now();
  const hour = Math.floor(t / HOUR);
  const day = Math.floor(t / DAY);
  const stmts: LibSqlStmt[] = [];
  for (const s of samples) {
    const v = Math.max(0, Math.round(s.value));
    const bucketArgs = (bucket: number) => [
      arg.text(s.gameId),
      arg.text(s.metric),
      arg.int(bucket),
      arg.int(v),
      arg.int(v),
      arg.int(v),
    ];
    if (hourly) {
      stmts.push({
        sql: "INSERT INTO stats_hourly (game_id, metric, hour, max, sum, n, last) VALUES (?, ?, ?, ?, ?, 1, ?) ON CONFLICT(game_id, metric, hour) DO UPDATE SET max = MAX(stats_hourly.max, excluded.max), sum = stats_hourly.sum + excluded.sum, n = stats_hourly.n + 1, last = excluded.last",
        args: bucketArgs(hour),
      });
    }
    stmts.push({
      sql: "INSERT INTO stats_daily (game_id, metric, day, max, sum, n, last) VALUES (?, ?, ?, ?, ?, 1, ?) ON CONFLICT(game_id, metric, day) DO UPDATE SET max = MAX(stats_daily.max, excluded.max), sum = stats_daily.sum + excluded.sum, n = stats_daily.n + 1, last = excluded.last",
      args: bucketArgs(day),
    });
  }
  await libsqlChunked(stmts);
}

export async function recordBuilds(
  builds: {
    gameId: string;
    branch: string;
    buildId: string;
    timeUpdated: number | null;
  }[],
): Promise<number> {
  const t = now();
  let inserted = 0;
  for (let i = 0; i < builds.length; i += CHUNK) {
    const results = await libsql(
      builds.slice(i, i + CHUNK).map((b) => ({
        sql: "INSERT OR IGNORE INTO stats_builds (game_id, branch, build_id, time_updated, seen_at) VALUES (?, ?, ?, ?, ?)",
        args: [
          arg.text(b.gameId),
          arg.text(b.branch),
          arg.text(b.buildId),
          intOrNull(b.timeUpdated),
          arg.int(t),
        ],
      })),
      10_000,
    );
    inserted += results.filter((r) => (r.affected_row_count ?? 0) > 0).length;
  }
  return inserted;
}

export async function markChecked(
  ids: string[],
  column: "hourly_at" | "daily_at",
): Promise<void> {
  if (ids.length === 0) return;
  const t = now();
  await libsqlChunked(
    ids.map((id) => ({
      sql: `UPDATE stats_games SET ${column} = ? WHERE id = ?`,
      args: [arg.int(t), arg.text(id)],
    })),
  );
}

/** Ids due for a slow collection pass, oldest first. */
export async function getDueGames(
  column: "hourly_at" | "daily_at",
  intervalSeconds: number,
  limit: number,
): Promise<string[]> {
  const [result] = await libsql([
    {
      sql: `SELECT id FROM stats_games WHERE status != 'declined' AND status != 'pending' AND ${column} < ? ORDER BY ${column} LIMIT ?`,
      args: [arg.int(now() - intervalSeconds), arg.int(limit)],
    },
  ]);
  return result.rows.map((r) => r[0].value);
}

export async function pruneHourly(): Promise<void> {
  const cutoff = Math.floor(now() / HOUR) - HOURLY_RETENTION_DAYS * 24;
  await libsql([
    { sql: "DELETE FROM stats_hourly WHERE hour < ?", args: [arg.int(cutoff)] },
  ]);
}

// ── Reads ─────────────────────────────────────────────────────────────

function emptySummary(): StatsSummary {
  return {
    steamCcu: null,
    steamPeak24h: null,
    steamPeak30d: null,
    steamPeakAllTime: null,
    steamTrend7d: null,
    twitchViewers: null,
    twitchChannels: null,
    discordOnline: null,
    discordMembers: null,
    steamReviews: null,
    steamReviewPositive: null,
    steamFollowers: null,
    lastPatchAt: null,
  };
}

const LATEST_FIELDS: Partial<Record<Metric, keyof StatsSummary>> = {
  steam_ccu: "steamCcu",
  twitch_viewers: "twitchViewers",
  twitch_channels: "twitchChannels",
  discord_online: "discordOnline",
  discord_members: "discordMembers",
  steam_reviews: "steamReviews",
  steam_review_positive: "steamReviewPositive",
  steam_followers: "steamFollowers",
};

/** Summaries for the given games (all games when ids is omitted). */
export async function getSummaries(
  ids?: string[],
): Promise<Record<string, StatsSummary>> {
  const t = now();
  const today = Math.floor(t / DAY);
  const hourNow = Math.floor(t / HOUR);
  const idFilter =
    ids && ids.length > 0
      ? ` AND game_id IN (${ids.map(() => "?").join(",")})`
      : "";
  const idArgs = ids?.map((id) => arg.text(id)) ?? [];

  const [latest, peak24, peak30, peakAll, trend, patches] = await libsql(
    [
      {
        // Newest day bucket's `last` = the latest sample (daily is written
        // on every sample). Stale (> 2 days) values are dropped.
        sql: `SELECT game_id, metric, last FROM stats_daily d WHERE day >= ?${idFilter} AND day = (SELECT MAX(day) FROM stats_daily d2 WHERE d2.game_id = d.game_id AND d2.metric = d.metric)`,
        args: [arg.int(today - 2), ...idArgs],
      },
      {
        sql: `SELECT game_id, MAX(max) FROM stats_hourly WHERE metric = 'steam_ccu' AND hour > ?${idFilter} GROUP BY game_id`,
        args: [arg.int(hourNow - 24), ...idArgs],
      },
      {
        sql: `SELECT game_id, MAX(max) FROM stats_daily WHERE metric = 'steam_ccu' AND day > ?${idFilter} GROUP BY game_id`,
        args: [arg.int(today - 30), ...idArgs],
      },
      {
        sql: `SELECT game_id, MAX(max) FROM stats_daily WHERE metric = 'steam_ccu'${idFilter} GROUP BY game_id`,
        args: idArgs,
      },
      {
        sql: `SELECT game_id, SUM(CASE WHEN day > ? THEN sum ELSE 0 END), SUM(CASE WHEN day > ? THEN n ELSE 0 END), SUM(CASE WHEN day <= ? THEN sum ELSE 0 END), SUM(CASE WHEN day <= ? THEN n ELSE 0 END) FROM stats_daily WHERE metric = 'steam_ccu' AND day > ?${idFilter} GROUP BY game_id`,
        args: [
          arg.int(today - 7),
          arg.int(today - 7),
          arg.int(today - 7),
          arg.int(today - 7),
          arg.int(today - 14),
          ...idArgs,
        ],
      },
      {
        sql: `SELECT game_id, MAX(COALESCE(time_updated, seen_at)) FROM stats_builds WHERE branch = 'public'${idFilter} GROUP BY game_id`,
        args: idArgs,
      },
    ],
    10_000,
  );

  const out: Record<string, StatsSummary> = {};
  const get = (id: string) => (out[id] ??= emptySummary());
  for (const row of latest.rows) {
    const field = LATEST_FIELDS[row[1].value as Metric];
    if (field)
      (get(row[0].value)[field] as number | null) = Number(row[2].value);
  }
  for (const row of peak24.rows) get(row[0].value).steamPeak24h = num(row[1]);
  for (const row of peak30.rows) get(row[0].value).steamPeak30d = num(row[1]);
  for (const row of peakAll.rows)
    get(row[0].value).steamPeakAllTime = num(row[1]);
  for (const row of trend.rows) {
    const [recentSum, recentN, prevSum, prevN] = row
      .slice(1)
      .map((c) => Number(c.value));
    if (recentN > 0 && prevN > 0 && prevSum > 0) {
      const recent = recentSum / recentN;
      const prev = prevSum / prevN;
      get(row[0].value).steamTrend7d =
        Math.round(((recent - prev) / prev) * 1000) / 10;
    }
  }
  for (const row of patches.rows) get(row[0].value).lastPatchAt = num(row[1]);
  return out;
}

export async function listGamesWithSummary(
  statuses?: StatsStatus[],
): Promise<StatsGameWithSummary[]> {
  const [games, summaries] = await Promise.all([
    listGames(statuses),
    getSummaries(),
  ]);
  return games.map((g) => ({
    ...g,
    summary: summaries[g.id] ?? emptySummary(),
  }));
}

function toSeries(rows: Row[]): Partial<Record<Metric, SeriesPoint[]>> {
  const out: Partial<Record<Metric, SeriesPoint[]>> = {};
  for (const row of rows) {
    const metric = row[0].value as Metric;
    const n = Number(row[4].value);
    (out[metric] ??= []).push({
      t: Number(row[1].value),
      max: Number(row[2].value),
      avg: n > 0 ? Math.round(Number(row[3].value) / n) : 0,
    });
  }
  return out;
}

export async function getGameDetail(
  id: string,
): Promise<StatsGameDetail | null> {
  const game = await getGame(id);
  if (!game) return null;
  const t = now();
  const [summaries, [hourly, daily, builds]] = await Promise.all([
    getSummaries([id]),
    libsql(
      [
        {
          sql: "SELECT metric, hour * 3600, max, sum, n FROM stats_hourly WHERE game_id = ? AND hour > ? ORDER BY hour",
          args: [arg.text(id), arg.int(Math.floor(t / HOUR) - 7 * 24)],
        },
        {
          sql: "SELECT metric, day * 86400, max, sum, n FROM stats_daily WHERE game_id = ? ORDER BY day",
          args: [arg.text(id)],
        },
        {
          sql: "SELECT branch, build_id, time_updated, seen_at FROM stats_builds WHERE game_id = ? ORDER BY COALESCE(time_updated, seen_at) DESC LIMIT 50",
          args: [arg.text(id)],
        },
      ],
      10_000,
    ),
  ]);
  return {
    ...game,
    summary: summaries[id] ?? emptySummary(),
    hourly: toSeries(hourly.rows),
    daily: toSeries(daily.rows),
    builds: builds.rows.map(
      (r): StatsBuild => ({
        branch: r[0].value,
        buildId: r[1].value,
        timeUpdated: num(r[2]),
        seenAt: Number(r[3].value),
      }),
    ),
  };
}

// ── Requests + votes ─────────────────────────────────────────────────

export async function countRecentRequests(
  userId: string,
  windowSeconds: number,
): Promise<number> {
  const [result] = await libsql([
    {
      sql: "SELECT COUNT(*) FROM stats_games WHERE requested_by = ? AND created_at > ?",
      args: [arg.text(userId), arg.int(now() - windowSeconds)],
    },
  ]);
  return Number(result.rows[0]?.[0]?.value ?? 0);
}

async function readVoteCount(gameId: string): Promise<number> {
  const [result] = await libsql([
    {
      sql: "SELECT vote_count FROM stats_games WHERE id = ?",
      args: [arg.text(gameId)],
    },
  ]);
  return Number(result.rows[0]?.[0]?.value ?? 0);
}

/** Add a vote (idempotent). Mirrors filters-db toggleVote's counter upkeep. */
export async function addVote(gameId: string, userId: string): Promise<number> {
  const [insert] = await libsql([
    {
      sql: "INSERT OR IGNORE INTO stats_request_votes (game_id, user_id, created_at) VALUES (?, ?, ?)",
      args: [arg.text(gameId), arg.text(userId), arg.int(now())],
    },
  ]);
  if ((insert.affected_row_count ?? 0) > 0) {
    await libsql([
      {
        sql: "UPDATE stats_games SET vote_count = vote_count + 1 WHERE id = ?",
        args: [arg.text(gameId)],
      },
    ]);
  }
  return readVoteCount(gameId);
}

export async function toggleVote(
  gameId: string,
  userId: string,
): Promise<{ voted: boolean; voteCount: number }> {
  const [insert] = await libsql([
    {
      sql: "INSERT OR IGNORE INTO stats_request_votes (game_id, user_id, created_at) VALUES (?, ?, ?)",
      args: [arg.text(gameId), arg.text(userId), arg.int(now())],
    },
  ]);
  let voted: boolean;
  if ((insert.affected_row_count ?? 0) > 0) {
    await libsql([
      {
        sql: "UPDATE stats_games SET vote_count = vote_count + 1 WHERE id = ?",
        args: [arg.text(gameId)],
      },
    ]);
    voted = true;
  } else {
    const [del] = await libsql([
      {
        sql: "DELETE FROM stats_request_votes WHERE game_id = ? AND user_id = ?",
        args: [arg.text(gameId), arg.text(userId)],
      },
    ]);
    if ((del.affected_row_count ?? 0) > 0) {
      await libsql([
        {
          sql: "UPDATE stats_games SET vote_count = MAX(vote_count - 1, 0) WHERE id = ?",
          args: [arg.text(gameId)],
        },
      ]);
    }
    voted = false;
  }
  return { voted, voteCount: await readVoteCount(gameId) };
}

export async function getUserVotes(userId: string): Promise<string[]> {
  const [result] = await libsql([
    {
      sql: "SELECT game_id FROM stats_request_votes WHERE user_id = ?",
      args: [arg.text(userId)],
    },
  ]);
  return result.rows.map((r) => r[0].value);
}
