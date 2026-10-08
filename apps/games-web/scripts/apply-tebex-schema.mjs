// Apply the `tebex_entitlements` + email sign-in schema (src/lib/tebex.ts,
// src/lib/email-login.ts) to the Bunny DB
// configured in apps/games-web/.env.local. Idempotent (IF NOT EXISTS).
// Usage: bun scripts/apply-tebex-schema.mjs   (from apps/games-web)
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
  `CREATE TABLE IF NOT EXISTS tebex_entitlements (
     ref        TEXT PRIMARY KEY,
     user_id    TEXT NOT NULL,
     package_id TEXT NOT NULL,
     tier_id    TEXT NOT NULL,
     status     TEXT NOT NULL,
     revoked    INTEGER NOT NULL DEFAULT 0,
     expires_at INTEGER NOT NULL,
     email      TEXT,
     event_at   INTEGER NOT NULL,
     updated_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS tebex_entitlements_user ON tebex_entitlements(user_id)`,
  // Email sign-in (src/lib/email-login.ts).
  `CREATE TABLE IF NOT EXISTS account_emails (
     email      TEXT NOT NULL,
     user_id    TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     PRIMARY KEY (email, user_id)
   )`,
  `CREATE INDEX IF NOT EXISTS account_emails_user ON account_emails(user_id)`,
  `CREATE TABLE IF NOT EXISTS email_login_codes (
     email      TEXT PRIMARY KEY,
     code_hash  TEXT NOT NULL,
     expires_at INTEGER NOT NULL,
     attempts   INTEGER NOT NULL DEFAULT 0,
     created_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS email_login_requests (
     email      TEXT NOT NULL,
     ip         TEXT NOT NULL,
     created_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS email_login_requests_email ON email_login_requests(email, created_at)`,
  `CREATE INDEX IF NOT EXISTS email_login_requests_ip ON email_login_requests(ip, created_at)`,
  // Purchase emails stored before account_emails existed.
  `INSERT OR IGNORE INTO account_emails (email, user_id, created_at)
     SELECT lower(trim(email)), user_id, MIN(event_at) FROM tebex_entitlements
      WHERE email IS NOT NULL AND email != '' GROUP BY lower(trim(email)), user_id`,
  `SELECT COUNT(*) FROM tebex_entitlements`,
  `SELECT COUNT(*) FROM account_emails`,
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
