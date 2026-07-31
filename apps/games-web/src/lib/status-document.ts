/**
 * Shared document-building logic for /api/status and the status page
 * server component. Extracted here so the page can call it directly
 * (no self-HTTP, no host-resolution guessing) while the route stays a
 * thin handler that attaches the correct Cache-Control header.
 */
import {
  applyFlapSuppression,
  games,
  overallState,
  type StatusDocument,
  type StatusGame,
  type StatusState,
} from "@repo/lib";
import {
  COMPONENT_LABELS,
  OW_EVENT_GAMES,
  checkOwEvents,
  runAllChecks,
} from "@/lib/status-checks";
import {
  getGameFlags,
  getIncidents,
  getRecentRawStates,
  getUptime,
} from "@/lib/status-db";

const COMPONENT_IDS = Object.keys(COMPONENT_LABELS);

export interface StatusDocumentResult {
  doc: StatusDocument;
  /** true when the DB was unreachable and the document was built on-demand */
  degradedMode: boolean;
}

function buildGames(
  ow: Record<string, StatusState | null> | null,
  flags: {
    game: string;
    state: StatusState;
    note: string | null;
    updatedAt: number;
  }[],
): StatusGame[] {
  const flagged = new Map(flags.map((f) => [f.game, f]));
  const owById = new Map(OW_EVENT_GAMES.map((g) => [g.id, g]));
  // Every supported game runs on THGL's own event pipeline (memory
  // reading / live mode) — its status is Leon's manual flag, defaulting
  // to operational. The Overwolf-GEP games additionally surface
  // Overwolf's public feed; Diablo IV uses both sources (THGLApp =
  // THGL events, OW app = GEP).
  const rows: StatusGame[] = games.map((g) => {
    const flag = flagged.get(g.id);
    const owGame = owById.get(g.id);
    return {
      id: g.id,
      label: g.title,
      // GEP-only apps (external repos) have no THGL-events pipeline.
      thglEvents: owGame?.gepOnly ? null : (flag?.state ?? "operational"),
      owEvents: owGame ? (ow?.[g.id] ?? null) : null,
      liveMode:
        flag && flag.state !== "operational"
          ? { state: flag.state, note: flag.note, updatedAt: flag.updatedAt }
          : null,
    };
  });
  // External OW-GEP apps that live outside this repo (Sons of the
  // Forest, New World) — GEP is their only event source.
  for (const g of OW_EVENT_GAMES) {
    if (!rows.some((r) => r.id === g.id)) {
      rows.push({
        id: g.id,
        label: g.label,
        thglEvents: null,
        owEvents: ow?.[g.id] ?? null,
        liveMode: null,
      });
    }
  }
  // Problems first, then alphabetical — with the full roster listed,
  // a degraded game must not hide below the fold.
  const rank = (g: StatusGame) =>
    g.liveMode || (g.owEvents && g.owEvents !== "operational") ? 0 : 1;
  return rows.sort(
    (a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label),
  );
}

export async function buildStatusDocument(): Promise<StatusDocumentResult> {
  const owPromise = checkOwEvents().catch(() => null);

  try {
    const [history, uptime24h, uptime7d, incidents, flags] = await Promise.all([
      getRecentRawStates(COMPONENT_IDS),
      getUptime(COMPONENT_IDS, 24 * 3600),
      getUptime(COMPONENT_IDS, 7 * 24 * 3600),
      getIncidents(),
      getGameFlags(),
    ]);
    const ow = await owPromise;
    const components = COMPONENT_IDS.map((id) => {
      const raw = (history[id] ?? []) as StatusState[];
      return {
        id,
        label: COMPONENT_LABELS[id],
        state: applyFlapSuppression(raw),
        latencyMs: null,
        detail: null,
        uptime24h: uptime24h[id],
        uptime7d: uptime7d[id],
      };
    });
    const games = buildGames(ow, flags);
    const doc: StatusDocument = {
      state: overallState({
        componentStates: components.map((c) => c.state),
        gameStates: games.flatMap((g) => [
          g.owEvents ?? "operational",
          g.liveMode?.state ?? "operational",
        ]),
        activeIncidentSeverities: incidents
          .filter((i) => i.resolvedAt === null)
          .map((i) => i.severity),
      }),
      updatedAt: Math.floor(Date.now() / 1000),
      components,
      games,
      incidents,
    };
    return { doc, degradedMode: false };
  } catch (err) {
    // DB down: compute live, serve uncached.
    console.error(
      "[status-document] DB read failed — on-demand fallback:",
      err,
    );
    const [checks, ow] = await Promise.all([runAllChecks(), owPromise]);
    const components = checks.map((c) => ({
      id: c.component,
      label: COMPONENT_LABELS[c.component] ?? c.component,
      state: c.state,
      latencyMs: c.latencyMs,
      detail: c.detail,
      uptime24h: null,
      uptime7d: null,
    }));
    const games = buildGames(ow, []);
    const doc: StatusDocument = {
      state: overallState({
        componentStates: components.map((c) => c.state),
        gameStates: games.flatMap((g) => [
          g.owEvents ?? "operational",
          g.liveMode?.state ?? "operational",
        ]),
        activeIncidentSeverities: [],
      }),
      updatedAt: Math.floor(Date.now() / 1000),
      components,
      games,
      incidents: [],
      provisional: true,
    };
    return { doc, degradedMode: true };
  }
}
