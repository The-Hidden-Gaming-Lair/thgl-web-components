// Apply the `app_invites` schema (see src/lib/invites.ts) to the Bunny DB
// configured in apps/games-web/.env.local. Idempotent (IF NOT EXISTS).
// Usage: bun scripts/apply-invites-schema.mjs   (from apps/games-web)
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
  `CREATE TABLE IF NOT EXISTS app_invites (
     app        TEXT NOT NULL,
     subject    TEXT NOT NULL,
     note       TEXT,
     created_by TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     PRIMARY KEY (app, subject)
   )`,
  `CREATE INDEX IF NOT EXISTS app_invites_subject ON app_invites(subject)`,
  `SELECT COUNT(*) FROM app_invites`,
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
  if (r.type === "error") {
    console.error(`stmt ${i} failed: ${r.error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`stmt ${i} ok`, JSON.stringify(r.response.result.rows));
  }
}
