export type StatusState = "operational" | "degraded" | "outage";

export interface StatusComponent {
  id: string;
  label: string;
  state: StatusState;
  latencyMs: number | null;
  detail: string | null;
  uptime24h: number | null;
  uptime7d: number | null;
}

export interface StatusGame {
  id: string;
  label: string;
  /** THGL's own event pipeline (memory reading / live mode) — the
   *  manually-flagged status; null for external apps that don't use it
   *  (Sons of the Forest, New World run on Overwolf GEP only). */
  thglEvents: StatusState | null;
  /** Overwolf GEP feed state — only for games whose OW app uses GEP
   *  (Diablo IV, Sons of the Forest, New World); null otherwise. */
  owEvents: StatusState | null;
  liveMode: {
    state: StatusState;
    note: string | null;
    /** Flag's last-change time — part of the banner dismiss key, so an
     *  updated flag re-shows even if a prior version was dismissed. */
    updatedAt: number;
  } | null;
}

export interface StatusIncident {
  id: string;
  title: string;
  body: string | null;
  severity: "degraded" | "outage";
  affects: string[];
  source: "manual" | "auto";
  createdAt: number;
  resolvedAt: number | null;
}

export interface StatusDocument {
  state: StatusState;
  updatedAt: number;
  components: StatusComponent[];
  games: StatusGame[];
  incidents: StatusIncident[];
  /**
   * True when the document was built by the on-demand fallback (status DB
   * unreachable): component states are single un-suppressed probes and the
   * incident list is empty. Too weak as evidence for user-facing alarm —
   * consumers must not synthesize outage banners from a provisional doc.
   */
  provisional?: boolean;
}

const RANK: Record<StatusState, number> = {
  operational: 0,
  degraded: 1,
  outage: 2,
};

export function worstState(states: StatusState[]): StatusState {
  return states.reduce<StatusState>(
    (worst, s) => (RANK[s] > RANK[worst] ? s : worst),
    "operational",
  );
}

/**
 * Flap suppression: a component's PUBLIC state only degrades after 3
 * consecutive failed runs (surfacing the newest state); recovery is
 * immediate on the first success. A component with fewer than 3
 * recorded runs stays "operational" by design — a brand-new component
 * fills its window within 3 runs (~3 minutes), which is cheaper than
 * alarming on startup noise. Input is newest-first ([0] = current run).
 */
export function applyFlapSuppression(
  newestFirstRaw: StatusState[],
): StatusState {
  const current = newestFirstRaw[0] ?? "operational";
  if (current === "operational") return "operational";
  const lastThree = newestFirstRaw.slice(0, 3);
  if (lastThree.length < 3) return "operational";
  return lastThree.every((s) => s !== "operational") ? current : "operational";
}

export function overallState(input: {
  componentStates: StatusState[];
  gameStates: StatusState[];
  activeIncidentSeverities: ("degraded" | "outage")[];
}): StatusState {
  return worstState([
    ...input.componentStates,
    ...input.gameStates,
    ...input.activeIncidentSeverities,
  ]);
}

/**
 * Does an incident apply to a surface? `affects` entries are component
 * ids, game ids, or the wildcard "all". A surface declares which
 * components it uses plus (optionally) the game it shows.
 */
export function incidentMatchesSurface(
  incident: StatusIncident,
  surface: { components: string[]; game: string | null },
): boolean {
  return incident.affects.some(
    (a) =>
      a === "all" ||
      surface.components.includes(a) ||
      (surface.game !== null && a === surface.game),
  );
}
