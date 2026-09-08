import { arg, libsql } from "@/lib/libsql";

/**
 * Invite-only companion access, backed by Bunny Database (libSQL/SQLite) —
 * the same DB as the Patreon token store (lib/tokens.ts) and the status page.
 *
 * A row grants ONE account access to ONE `companion.inviteOnly` game
 * (games.ts, e.g. Pax Dei). `subject` is either the Patreon user id or the
 * account's email (lowercased) — admins usually know supporters by email,
 * while the app shows the id in the account dialog; both work. Resolution
 * happens in every account resolver (getAccount, /api/patreon,
 * /api/patreon/verify) and rides on the payload as `invites: string[]`
 * (game ids) next to `isSpecial`.
 *
 * Schema (applied via scripts/apply-invites-schema.mjs → libSQL HTTP API):
 *
 *   CREATE TABLE IF NOT EXISTS app_invites (
 *     app        TEXT NOT NULL,   -- game id (games.ts `id`)
 *     subject    TEXT NOT NULL,   -- Patreon user id OR lowercased email
 *     note       TEXT,            -- who/why (admin-only)
 *     created_by TEXT NOT NULL,   -- admin Patreon user id
 *     created_at INTEGER NOT NULL,
 *     PRIMARY KEY (app, subject)
 *   );
 *   CREATE INDEX IF NOT EXISTS app_invites_subject ON app_invites(subject);
 */

export interface AppInvite {
  app: string;
  subject: string;
  note: string | null;
  createdBy: string;
  createdAt: number;
}

export function normalizeInviteSubject(subject: string): string {
  const trimmed = subject.trim();
  // Emails are matched case-insensitively; Patreon ids are numeric strings.
  return trimmed.includes("@") ? trimmed.toLowerCase() : trimmed;
}

/**
 * Game ids the account is invited to. Matches by Patreon user id and (when
 * known) by email. Throws on DB failure — callers decide whether that is
 * "unknown, keep the client's persisted list" (omit the field) or fatal.
 */
export async function getInvites(
  userId: string,
  email?: string | null,
): Promise<string[]> {
  const subjects = [userId];
  if (email) subjects.push(normalizeInviteSubject(email));
  const [result] = await libsql([
    {
      sql: `SELECT DISTINCT app FROM app_invites WHERE subject IN (${subjects
        .map(() => "?")
        .join(", ")})`,
      args: subjects.map((s) => arg.text(s)),
    },
  ]);
  return result.rows.map((row) => row[0].value).sort();
}

/**
 * Best-effort variant for the account resolvers: a DB hiccup must not sign
 * anyone out or flicker the gate, so it logs and returns `undefined` (=
 * "unknown"; the client keeps its persisted invites — see
 * THGLAccount.invites in @repo/lib).
 */
export async function getInvitesBestEffort(
  tag: string,
  userId: string,
  email?: string | null,
): Promise<string[] | undefined> {
  try {
    return await getInvites(userId, email);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${tag} invites lookup failed for ${userId}: ${msg}`);
    return undefined;
  }
}

export async function listInvites(app?: string): Promise<AppInvite[]> {
  const [result] = await libsql([
    app
      ? {
          sql: "SELECT app, subject, note, created_by, created_at FROM app_invites WHERE app = ? ORDER BY created_at DESC",
          args: [arg.text(app)],
        }
      : {
          sql: "SELECT app, subject, note, created_by, created_at FROM app_invites ORDER BY app, created_at DESC",
        },
  ]);
  return result.rows.map((row) => ({
    app: row[0].value,
    subject: row[1].value,
    note: row[2].type === "null" ? null : row[2].value,
    createdBy: row[3].value,
    createdAt: Number(row[4].value),
  }));
}

export async function addInvite(input: {
  app: string;
  subject: string;
  note: string | null;
  createdBy: string;
}): Promise<void> {
  // One upsert per libsql() call — never batch it with other writes to the
  // same row (Bunny DB pipeline quirk, see lib/libsql.ts callers).
  await libsql([
    {
      sql: "INSERT INTO app_invites (app, subject, note, created_by, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(app, subject) DO UPDATE SET note = excluded.note, created_by = excluded.created_by",
      args: [
        arg.text(input.app),
        arg.text(normalizeInviteSubject(input.subject)),
        input.note === null ? arg.null() : arg.text(input.note),
        arg.text(input.createdBy),
        arg.int(Math.floor(Date.now() / 1000)),
      ],
    },
  ]);
}

export async function removeInvite(
  app: string,
  subject: string,
): Promise<void> {
  await libsql([
    {
      sql: "DELETE FROM app_invites WHERE app = ? AND subject = ?",
      args: [arg.text(app), arg.text(normalizeInviteSubject(subject))],
    },
  ]);
}
