// Apply the game-stats schema (see src/lib/stats-db.ts) to the Bunny DB
// configured in apps/games-web/.env.local. Idempotent (IF NOT EXISTS).
// Usage: bun scripts/apply-stats-schema.mjs   (from apps/games-web)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const envFile = readFileSync(join(root, ".env.local"), "utf8");
const env = (name) =>
  envFile.match(new RegExp(`^${name}="?([^"\\r\\n]+)"?`, "m"))?.[1];

const url = env("BUNNY_DATABASE_URL")
  ?.replace(/^libsql:\/\//, "https://")
  .replace(/\/+$/, "");
const token = env("BUNNY_DATABASE_AUTH_TOKEN");
if (!url || !token) {
  console.error("BUNNY_DATABASE_URL / BUNNY_DATABASE_AUTH_TOKEN missing");
  process.exit(1);
}

const statements = [
  // One row per tracked game: supported (games.ts), in progress, watched,
  // requested by users, pending review (non-Steam requests) or declined.
  `CREATE TABLE IF NOT EXISTS stats_games (
     id               TEXT PRIMARY KEY,
     title            TEXT NOT NULL,
     status           TEXT NOT NULL,
     thgl_id          TEXT,
     steam_app_id     INTEGER,
     platforms        TEXT NOT NULL DEFAULT '[]',
     image_url        TEXT,
     release_date     TEXT,
     url              TEXT,
     discord_invite   TEXT,
     discord_guild_id TEXT,
     twitch_game_id   TEXT,
     note             TEXT,
     vote_count       INTEGER NOT NULL DEFAULT 0,
     requested_by     TEXT,
     created_at       INTEGER NOT NULL,
     updated_at       INTEGER NOT NULL,
     hourly_at        INTEGER NOT NULL DEFAULT 0,
     daily_at         INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE INDEX IF NOT EXISTS stats_games_steam ON stats_games(steam_app_id)`,
  `CREATE INDEX IF NOT EXISTS stats_games_requested_by ON stats_games(requested_by, created_at)`,
  // Hour buckets (hour = unix / 3600), pruned after 90 days.
  `CREATE TABLE IF NOT EXISTS stats_hourly (
     game_id TEXT NOT NULL,
     metric  TEXT NOT NULL,
     hour    INTEGER NOT NULL,
     max     INTEGER NOT NULL,
     sum     INTEGER NOT NULL,
     n       INTEGER NOT NULL,
     last    INTEGER NOT NULL,
     PRIMARY KEY (game_id, metric, hour)
   ) WITHOUT ROWID`,
  `CREATE INDEX IF NOT EXISTS stats_hourly_hour ON stats_hourly(hour)`,
  // Day buckets (day = unix / 86400), kept forever.
  `CREATE TABLE IF NOT EXISTS stats_daily (
     game_id TEXT NOT NULL,
     metric  TEXT NOT NULL,
     day     INTEGER NOT NULL,
     max     INTEGER NOT NULL,
     sum     INTEGER NOT NULL,
     n       INTEGER NOT NULL,
     last    INTEGER NOT NULL,
     PRIMARY KEY (game_id, metric, day)
   ) WITHOUT ROWID`,
  // Every Steam build id seen per public branch (patch history).
  `CREATE TABLE IF NOT EXISTS stats_builds (
     game_id      TEXT NOT NULL,
     branch       TEXT NOT NULL,
     build_id     TEXT NOT NULL,
     time_updated INTEGER,
     seen_at      INTEGER NOT NULL,
     PRIMARY KEY (game_id, branch, build_id)
   ) WITHOUT ROWID`,
  `CREATE TABLE IF NOT EXISTS stats_request_votes (
     game_id    TEXT NOT NULL,
     user_id    TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     PRIMARY KEY (game_id, user_id)
   ) WITHOUT ROWID`,
  `CREATE INDEX IF NOT EXISTS stats_request_votes_user ON stats_request_votes(user_id)`,
  // Added 2026-09-28 (Discord #game-requests sync). ALTER has no IF NOT
  // EXISTS; a "duplicate column" error on re-runs is expected and ignored.
  `ALTER TABLE stats_games ADD COLUMN discord_thread_id TEXT`,
  // Website comments on requested games; the bot mirrors each into the
  // game's #game-requests thread and records the Discord message id.
  `CREATE TABLE IF NOT EXISTS stats_request_comments (
     id                 TEXT PRIMARY KEY,
     game_id            TEXT NOT NULL,
     user_id            TEXT NOT NULL,
     author_name        TEXT NOT NULL,
     author_avatar      TEXT,
     body               TEXT NOT NULL,
     created_at         INTEGER NOT NULL,
     discord_message_id TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS stats_request_comments_game ON stats_request_comments(game_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS stats_request_comments_user ON stats_request_comments(user_id, created_at)`,
  // Soft delete (author/admin on th.gl, or the Discord copy was deleted).
  `ALTER TABLE stats_request_comments ADD COLUMN deleted_at INTEGER`,
  `SELECT COUNT(*) FROM stats_games`,
];

const res = await fetch(`${url}/v2/pipeline`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    requests: statements.map((sql) => ({ type: "execute", stmt: { sql } })),
  }),
});
const body = await res.json();
for (const [i, r] of body.results.entries()) {
  if (r.type === "error" && /duplicate column/i.test(r.error.message)) {
    console.log(`stmt ${i} ok (column already exists)`);
  } else if (r.type === "error") {
    console.error(`stmt ${i} failed: ${r.error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`stmt ${i} ok`, JSON.stringify(r.response.result.rows));
  }
}
