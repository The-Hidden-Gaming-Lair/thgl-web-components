import { arg, libsql } from "@/lib/libsql";
import { type StatusIncident, type StatusState } from "@repo/lib";
import { type RawCheck } from "@/lib/status-checks";

/** Newest-first raw states per component from the last N runs. */
export async function getRecentRawStates(
  components: string[],
  // Matches the applyFlapSuppression window (newest 3 runs).
  perComponent = 3,
): Promise<Record<string, StatusState[]>> {
  const results = await libsql(
    components.map((c) => ({
      sql: "SELECT state FROM status_checks WHERE component = ? ORDER BY checked_at DESC LIMIT ?",
      args: [arg.text(c), arg.int(perComponent)],
    })),
  );
  const out: Record<string, StatusState[]> = {};
  components.forEach((c, i) => {
    out[c] = results[i].rows.map((r) => r[0].value as StatusState);
  });
  return out;
}

export async function insertChecks(checks: RawCheck[]): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await libsql(
    checks.map((c) => ({
      sql: "INSERT INTO status_checks (component, state, latency_ms, detail, checked_at) VALUES (?, ?, ?, ?, ?)",
      args: [
        arg.text(c.component),
        arg.text(c.state),
        c.latencyMs === null ? arg.null() : arg.int(c.latencyMs),
        c.detail === null ? arg.null() : arg.text(c.detail),
        arg.int(now),
      ],
    })),
  );
}

export async function pruneOldChecks(): Promise<void> {
  const cutoff = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  await libsql([
    {
      sql: "DELETE FROM status_checks WHERE checked_at < ?",
      args: [arg.int(cutoff)],
    },
  ]);
}

/** AVAILABILITY percentage per component over a window (seconds).
 *  Degraded counts as up — it means impaired-but-serving (e.g. the DB
 *  running via the relay while the direct route is down); only outage
 *  is downtime. The current state dot + detail carry the impairment. */
export async function getUptime(
  components: string[],
  windowSeconds: number,
): Promise<Record<string, number | null>> {
  const since = Math.floor(Date.now() / 1000) - windowSeconds;
  const results = await libsql(
    components.map((c) => ({
      sql: "SELECT COUNT(*), SUM(CASE WHEN state != 'outage' THEN 1 ELSE 0 END) FROM status_checks WHERE component = ? AND checked_at > ?",
      args: [arg.text(c), arg.int(since)],
    })),
  );
  const out: Record<string, number | null> = {};
  components.forEach((c, i) => {
    const total = Number(results[i].rows[0]?.[0]?.value ?? 0);
    const ok = Number(results[i].rows[0]?.[1]?.value ?? 0);
    out[c] = total === 0 ? null : Math.round((ok / total) * 1000) / 10;
  });
  return out;
}

function rowToIncident(row: { type: string; value: string }[]): StatusIncident {
  return {
    id: row[0].value,
    title: row[1].value,
    body: row[2].type === "null" ? null : row[2].value,
    severity: row[3].value as "degraded" | "outage",
    affects: JSON.parse(row[4].value) as string[],
    source: row[5].value as "manual" | "auto",
    createdAt: Number(row[6].value),
    resolvedAt: row[7].type === "null" ? null : Number(row[7].value),
  };
}

const INCIDENT_COLS =
  "id, title, body, severity, affects, source, created_at, resolved_at";

export async function getIncidents(
  resolvedWithinSeconds = 14 * 24 * 3600,
): Promise<StatusIncident[]> {
  const since = Math.floor(Date.now() / 1000) - resolvedWithinSeconds;
  const [result] = await libsql([
    {
      sql: `SELECT ${INCIDENT_COLS} FROM status_incidents WHERE resolved_at IS NULL OR resolved_at > ? ORDER BY created_at DESC`,
      args: [arg.int(since)],
    },
  ]);
  return result.rows.map(rowToIncident);
}

export async function openIncident(incident: {
  id: string;
  title: string;
  body: string | null;
  severity: "degraded" | "outage";
  affects: string[];
  source: "manual" | "auto";
}): Promise<void> {
  // Auto incidents reuse a stable id per component; a RE-opened outage
  // must reactivate the resolved row (resolved_at = NULL) — plain
  // INSERT OR IGNORE would silently keep it resolved forever. Manual
  // incidents use random UUIDs, so the conflict branch never fires for
  // them.
  await libsql([
    {
      sql: "INSERT INTO status_incidents (id, title, body, severity, affects, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, severity = excluded.severity, affects = excluded.affects, created_at = excluded.created_at, resolved_at = NULL",
      args: [
        arg.text(incident.id),
        arg.text(incident.title),
        incident.body === null ? arg.null() : arg.text(incident.body),
        arg.text(incident.severity),
        arg.text(JSON.stringify(incident.affects)),
        arg.text(incident.source),
        arg.int(Math.floor(Date.now() / 1000)),
      ],
    },
  ]);
}

/** Open MANUAL incident with this exact title, if any — the admin form
 *  re-submitting a title updates that incident instead of stacking a
 *  duplicate. */
export async function findOpenManualIncidentId(
  title: string,
): Promise<string | null> {
  const [result] = await libsql([
    {
      sql: "SELECT id FROM status_incidents WHERE resolved_at IS NULL AND source = 'manual' AND title = ?",
      args: [arg.text(title)],
    },
  ]);
  return result.rows[0]?.[0].value ?? null;
}

export async function resolveIncident(id: string): Promise<void> {
  await libsql([
    {
      sql: "UPDATE status_incidents SET resolved_at = ? WHERE id = ? AND resolved_at IS NULL",
      args: [arg.int(Math.floor(Date.now() / 1000)), arg.text(id)],
    },
  ]);
}

/** Auto-incident id per component — stable so open/resolve is idempotent
 *  across runner invocations (one open auto incident per component). */
export function autoIncidentId(component: string): string {
  return `auto-${component}`;
}

export interface GameFlag {
  game: string;
  state: StatusState;
  note: string | null;
  updatedAt: number;
}

export async function getGameFlags(): Promise<GameFlag[]> {
  const [result] = await libsql([
    { sql: "SELECT game, state, note, updated_at FROM game_status_flags" },
  ]);
  return result.rows.map((r) => ({
    game: r[0].value,
    state: r[1].value as StatusState,
    note: r[2].type === "null" ? null : r[2].value,
    updatedAt: Number(r[3].value),
  }));
}

export async function setGameFlag(
  game: string,
  state: StatusState,
  note: string | null,
): Promise<void> {
  await libsql([
    {
      sql: "INSERT INTO game_status_flags (game, state, note, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(game) DO UPDATE SET state = excluded.state, note = excluded.note, updated_at = excluded.updated_at",
      args: [
        arg.text(game),
        arg.text(state),
        note === null ? arg.null() : arg.text(note),
        arg.int(Math.floor(Date.now() / 1000)),
      ],
    },
  ]);
}
