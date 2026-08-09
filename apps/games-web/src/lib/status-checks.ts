import { connect } from "node:tls";
import { sign } from "jsonwebtoken";
import { type StatusState } from "@repo/lib";

export interface RawCheck {
  component: string;
  state: StatusState;
  latencyMs: number | null;
  detail: string | null;
}

/** Components whose OUTAGE auto-opens an incident + triggers the auto banner. */
export const HARD_COMPONENTS = ["auth", "database", "cdn", "web"];

export const COMPONENT_LABELS: Record<string, string> = {
  web: "Website (maps & guides)",
  auth: "Auth & Sign-in",
  database: "Database (accounts & filters)",
  "api-forge": "Comments & Profiles",
  "actors-api": "Live tracking",
  "palia-api": "Palia community data",
  peer: "Peer Link",
  cdn: "Map data CDN",
  search: "Search API",
  certificates: "TLS certificates",
};

/** Games with an Overwolf-GEP dependency shown on the status page.
 *  gepOnly: the app runs exclusively on Overwolf's Game Events Provider
 *  (external apps — Sons of the Forest, New World), so no "THGL events"
 *  row applies. Diablo IV uses BOTH: THGLApp = THGL events, OW app = GEP. */
export const OW_EVENT_GAMES: {
  id: string;
  label: string;
  owGameId: number;
  gepOnly: boolean;
}[] = [
  { id: "diablo4", label: "Diablo IV", owGameId: 22700, gepOnly: false },
  {
    id: "sons-of-the-forest",
    label: "Sons of the Forest",
    owGameId: 22638,
    gepOnly: true,
  },
  { id: "new-world", label: "New World", owGameId: 21816, gepOnly: true },
];

const TIMEOUT_MS = 5000;

async function timedFetch(
  url: string,
  init: RequestInit = {},
): Promise<{ res: Response | null; ms: number; err: string | null }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      cache: "no-store",
    });
    return { res, ms: Date.now() - start, err: null };
  } catch (e) {
    return {
      res: null,
      ms: Date.now() - start,
      err: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(t);
  }
}

/** Synthetic auth probe: fast 404 = healthy (DB reachable, auth path live),
 *  503 = token store down, anything else = auth path broken. */
async function checkAuth(): Promise<RawCheck> {
  const probe = sign("___status_probe___", process.env.JWT_SECRET!);
  const { res, ms, err } = await timedFetch("https://app.th.gl/api/patreon", {
    headers: { Cookie: `userId=${probe}` },
  });
  if (res?.status === 404)
    return {
      component: "auth",
      state: "operational",
      latencyMs: ms,
      detail: null,
    };
  if (res?.status === 503)
    return {
      component: "auth",
      state: "degraded",
      latencyMs: ms,
      detail: "token store unreachable",
    };
  return {
    component: "auth",
    state: "outage",
    latencyMs: ms,
    detail: err ?? `HTTP ${res?.status}`,
  };
}

// Deliberately not lib/libsql.ts: that client is pinned to the
// BUNNY_DATABASE_URL env var, while this ping must target arbitrary
// URLs (prod path vs direct path). Keep the URL normalization in sync.
async function libsqlPing(
  baseUrl: string,
): Promise<{ ok: boolean; ms: number }> {
  const url = `${baseUrl.replace(/^libsql:\/\//, "https://").replace(/\/+$/, "")}/v2/pipeline`;
  const { res, ms } = await timedFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BUNNY_DATABASE_AUTH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [{ type: "execute", stmt: { sql: "SELECT 1" } }],
    }),
  });
  return { ok: res?.ok ?? false, ms };
}

/** One "database" row: prod path (BUNNY_DATABASE_URL — currently the mia
 *  relay) + the direct bunnydb URL (STATUS_DB_DIRECT_URL). Direct-down but
 *  prod-up = degraded with route detail — and the detail flips to null by
 *  itself when Bunny fixes their route. */
async function checkDatabase(): Promise<RawCheck> {
  const [prod, direct] = await Promise.all([
    libsqlPing(process.env.BUNNY_DATABASE_URL!),
    libsqlPing(
      process.env.STATUS_DB_DIRECT_URL ?? process.env.BUNNY_DATABASE_URL!,
    ),
  ]);
  if (prod.ok && direct.ok)
    return {
      component: "database",
      state: "operational",
      latencyMs: prod.ms,
      detail: null,
    };
  if (prod.ok)
    return {
      component: "database",
      state: "degraded",
      latencyMs: prod.ms,
      detail: "direct route down — serving via relay",
    };
  return {
    component: "database",
    state: "outage",
    latencyMs: prod.ms,
    detail: direct.ok ? "prod path down (direct up)" : "both paths down",
  };
}

async function checkSimple(
  component: string,
  url: string,
  expect: (res: Response) => boolean = (r) => r.ok,
): Promise<RawCheck> {
  const { res, ms, err } = await timedFetch(url);
  if (res && expect(res))
    return { component, state: "operational", latencyMs: ms, detail: null };
  return {
    component,
    state: "outage",
    latencyMs: ms,
    detail: err ?? `HTTP ${res?.status}`,
  };
}

/**
 * Dual-path probe for the Bunny-fronted self-hosted APIs: users reach them
 * via the edge hostname, but the `*-direct` origin hostname stays published
 * (also the browser fallback path in resilientFetch). Probing both makes an
 * incident self-diagnosing: edge down + origin up = Bunny route problem;
 * both down = the origin box itself.
 */
async function checkDualPath(
  component: string,
  edgeUrl: string,
  directUrl: string,
  expect: (res: Response) => boolean = (r) => r.ok,
): Promise<RawCheck> {
  const probe = async (url: string) => {
    const { res, ms, err } = await timedFetch(url);
    const ok = res !== null && expect(res);
    return { ok, ms, err: ok ? null : (err ?? `HTTP ${res?.status}`) };
  };
  const [edge, direct] = await Promise.all([probe(edgeUrl), probe(directUrl)]);
  if (edge.ok && direct.ok)
    return {
      component,
      state: "operational",
      latencyMs: edge.ms,
      detail: null,
    };
  if (edge.ok)
    return {
      component,
      state: "degraded",
      latencyMs: edge.ms,
      detail: `origin direct path down (edge serving) — ${direct.err}`,
    };
  if (direct.ok)
    return {
      component,
      state: "degraded",
      latencyMs: direct.ms,
      detail: `edge route down — origin healthy (${edge.err})`,
    };
  return { component, state: "outage", latencyMs: edge.ms, detail: edge.err };
}

/** Hostnames whose TLS certs we watch. Bunny renews the edge certs, the
 *  acme-companions renew the box certs — either failing silently would
 *  otherwise only surface when a cert expires. metrics.th.gl shares one
 *  cert order with a.th.gl (whose HTTP-01 now travels through the edge). */
const CERT_HOSTS = [
  "www.th.gl",
  "cdn.th.gl",
  "metrics.th.gl",
  "peer.th.gl",
  "api-forge-direct.th.gl",
  "actors-api-direct.th.gl",
  "palia-api-direct.th.gl",
];

function certDaysLeft(host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const socket = connect(
      // rejectUnauthorized false: an EXPIRED cert must still be readable —
      // reporting "expired 3 days ago" is the whole point of this check.
      { host, port: 443, servername: host, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert?.valid_to) {
          reject(new Error("no certificate"));
          return;
        }
        resolve((new Date(cert.valid_to).getTime() - Date.now()) / 86_400_000);
      },
    );
    socket.setTimeout(TIMEOUT_MS, () => {
      socket.destroy();
      reject(new Error("timeout"));
    });
    socket.on("error", reject);
  });
}

async function checkCertificates(): Promise<RawCheck> {
  const results = await Promise.all(
    CERT_HOSTS.map(async (host) => {
      try {
        return { host, days: await certDaysLeft(host), err: null };
      } catch (e) {
        return {
          host,
          days: null,
          err: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );
  const expired = results.filter((r) => r.days !== null && r.days < 3);
  const expiringSoon = results.filter(
    (r) => r.days !== null && r.days >= 3 && r.days < 21,
  );
  const unreachable = results.filter((r) => r.days === null);
  if (expired.length > 0)
    return {
      component: "certificates",
      state: "outage",
      latencyMs: null,
      detail: expired
        .map((r) => `${r.host}: ${Math.floor(r.days!)}d left`)
        .join(", "),
    };
  if (expiringSoon.length > 0 || unreachable.length > 0)
    return {
      component: "certificates",
      state: "degraded",
      latencyMs: null,
      detail: [
        ...expiringSoon.map((r) => `${r.host}: ${Math.floor(r.days!)}d left`),
        ...unreachable.map((r) => `${r.host}: ${r.err}`),
      ].join(", "),
    };
  return {
    component: "certificates",
    state: "operational",
    latencyMs: null,
    detail: null,
  };
}

/**
 * Overwolf public game-events health feed → per-game states.
 *
 * Feed shape: array of { game_id: number, name: string, state: number, ... }
 * state values: 1 = operational, 2 = degraded, 3 = outage, 0 = unknown/offline
 */
export async function checkOwEvents(): Promise<
  Record<string, StatusState | null>
> {
  const { res } = await timedFetch(
    "https://game-events-status.overwolf.com/gamestatus_prod.json",
  );
  const out: Record<string, StatusState | null> = {};
  if (!res?.ok) {
    for (const g of OW_EVENT_GAMES) out[g.id] = null; // feed unavailable ≠ game down
    return out;
  }
  // state: 1=good 2=partial 3=down; 0/unknown or disabled entries are "no data", not an outage
  const feed = (await res.json()) as {
    game_id: number;
    state: number;
    disabled?: boolean;
  }[];
  for (const g of OW_EVENT_GAMES) {
    const entry = feed.find((f) => f.game_id === g.owGameId);
    out[g.id] =
      entry === undefined || entry.disabled === true
        ? null
        : entry.state === 1
          ? "operational"
          : entry.state === 2
            ? "degraded"
            : entry.state === 3
              ? "outage"
              : null;
  }
  return out;
}

/**
 * Games-web page-origin health. Probes key root pages with a per-minute
 * cache-buster so we hit the Magic Container ORIGIN — a cached 200 would
 * otherwise hide a 504 (the AI-crawler overload pattern where the origin
 * 504s across all tenants while the edge still serves cached pages). Catches
 * two failure modes: origin down/overloaded (all roots 5xx/slow/timeout) and
 * a single root that stops being accessible (e.g. a bad tenant/locale config
 * → 404). All roots share one Magic Container, so a small representative set
 * is enough to detect an origin-wide outage.
 */
const WEB_ROOTS = [
  "https://www.th.gl/",
  "https://palworld.th.gl/",
  "https://satisfactory.th.gl/",
];
// A 200 that takes this long signals origin overload (early warning before a
// full 504) — surfaced as "degraded" so it pings without declaring an outage.
const WEB_SLOW_MS = 3000;

async function checkWeb(): Promise<RawCheck> {
  const bust = Math.floor(Date.now() / 60000);
  const results = await Promise.all(
    WEB_ROOTS.map(async (base) => {
      const { res, ms, err } = await timedFetch(`${base}?status=${bust}`);
      return {
        host: new URL(base).host,
        ok: res?.ok ?? false,
        status: res?.status ?? null,
        ms,
        err,
      };
    }),
  );
  const down = results.filter((r) => !r.ok);
  const slowest = Math.max(...results.map((r) => r.ms));

  if (down.length === 0) {
    if (slowest > WEB_SLOW_MS) {
      const slow = results
        .filter((r) => r.ms > WEB_SLOW_MS)
        .map((r) => `${r.host} ${r.ms}ms`);
      return {
        component: "web",
        state: "degraded",
        latencyMs: slowest,
        detail: `slow origin — ${slow.join(", ")}`,
      };
    }
    return {
      component: "web",
      state: "operational",
      latencyMs: slowest,
      detail: null,
    };
  }

  const detail = down
    .map((r) => `${r.host}: ${r.err ?? `HTTP ${r.status}`}`)
    .join("; ");
  // All roots down = origin-wide outage (auto-incident); a subset = one root
  // broken while the origin is otherwise up = degraded.
  return {
    component: "web",
    state: down.length === results.length ? "outage" : "degraded",
    latencyMs: down[0].ms,
    detail,
  };
}

export async function runAllChecks(): Promise<RawCheck[]> {
  return Promise.all([
    checkWeb(),
    checkAuth(),
    checkDatabase(),
    // api-forge: /comments with a dummy node returns 200 with empty array — no auth needed
    checkDualPath(
      "api-forge",
      "https://api-forge.th.gl/comments?app_id=palworld&node_id=test%400%3A0",
      "https://api-forge-direct.th.gl/comments?app_id=palworld&node_id=test%400%3A0",
    ),
    // actors-api: /health returns 200 when the service is up
    checkDualPath(
      "actors-api",
      "https://actors-api.th.gl/health",
      "https://actors-api-direct.th.gl/health",
    ),
    // palia-api has no /health; an unauthenticated /nodes answers 401 when
    // the service is up (any other status = nginx default page or down)
    checkDualPath(
      "palia-api",
      "https://palia-api.th.gl/nodes?type=spawnNodes",
      "https://palia-api-direct.th.gl/nodes?type=spawnNodes",
      (r) => r.status === 401,
    ),
    // PeerJS signaling server root returns its JSON banner with 200
    checkSimple("peer", "https://peer.th.gl/"),
    checkCertificates(),
    checkSimple(
      "cdn",
      // Cache-buster rotates once per minute: fresh enough to catch an
      // edge outage, coarse enough that repeated checks share a cache key.
      `https://cdn.th.gl/palworld/version.json?status=${Math.floor(Date.now() / 60000)}`,
    ),
    checkSimple(
      "search",
      "https://api.th.gl/api/palworld/search?q=chest&locale=en",
    ),
  ]);
}
