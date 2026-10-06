/**
 * One `[pod-health]` JSON log line per minute per pod — the evidence trail for
 * the recurring "origin slow / outbound ETIMEDOUT" incidents (2026-10-02,
 * 10-04, 10-05: SSR fetches to cdn.th.gl and Bunny DB time out on connect for
 * 10-30 min with flat traffic, until the pods are replaced or it self-heals).
 * Without per-pod history nothing distinguishes the candidate causes; this
 * line does:
 *
 *   sock.open / sock.byHost  — live outbound sockets. Climbing toward the Magic
 *                              Container limit (500 outbound connections per
 *                              pod) = socket exhaustion/leak.
 *   connect.err              — connect failures by host and code. Every host
 *                              failing = pod egress; one host = that upstream.
 *   req.started/failed       — outbound request volume + failures per host.
 *   el                       — event-loop delay (ms). High = CPU/GC-starved pod,
 *                              which ALSO shows up as connect timeouts.
 *   heapMB / rssMB           — memory, for GC pressure.
 *   heapLimitMB              — V8's ceiling (4144 MB in prod; container 32 GB).
 *   gc                       — GC pauses this minute: count, total + max ms.
 *                              2026-10-06 outage: IL pods at 2+ GB heap, el p99
 *                              300-500 ms, then 6-11 s stalls and a liveness-
 *                              probe restart loop.
 *   extMB / abMB            — off-heap memory / its ArrayBuffer part (gzip page cache, fetch bodies).
 *   cache                    — page cache (cache-handler.cjs) and JSON memory
 *                              cache (@repo/lib) sizes in MB.
 *
 * Node's built-in fetch is undici; it publishes these diagnostics channels.
 * Read the lines with the MC logs API (`/mc/apps/{id}/logs`, grep pod-health)
 * or `scripts/analyze-origin-incident.ts --mc` in data-forge.
 */
import diagnostics_channel from "node:diagnostics_channel";
import { readFileSync } from "node:fs";
import { monitorEventLoopDelay, PerformanceObserver } from "node:perf_hooks";
import { getHeapStatistics } from "node:v8";
import { memoryFetchCacheStats } from "@repo/lib";
import type { Socket } from "node:net";

const INTERVAL_MS = 60_000;

type ConnectParams = { host?: string; hostname?: string; port?: string };
type RequestInfo = { origin?: string | URL };

const openByHost = new Map<string, number>();
let connectOk = new Map<string, number>();
let connectErr = new Map<string, number>();
let reqStarted = new Map<string, number>();
let reqFailed = new Map<string, number>();

const bump = (m: Map<string, number>, k: string, d = 1) => {
  const n = (m.get(k) ?? 0) + d;
  if (n <= 0) m.delete(k);
  else m.set(k, n);
};
const hostOf = (p?: ConnectParams) => p?.hostname ?? p?.host ?? "?";
const originHost = (r?: RequestInfo) => {
  try {
    return r?.origin ? new URL(String(r.origin)).host : "?";
  } catch {
    return "?";
  }
};

// ---- inbound request timing (what the origin spends per page type) -----------
// Bunny's access logs carry no response time, so this is the only per-route
// latency source. Class = first path segment after the locale (+ " rsc" for
// client navigations / " pf" for prefetches); `slow` keeps the slowest
// requests of the minute with host + path so individual pages can be found.
type Timing = { n: number; total: number[]; ttfb: number[] };
let timings = new Map<string, Timing>();
let slow: { ms: number; ttfb: number; status: number; url: string }[] = [];
let inflight = 0;
let inflightMax = 0;
const SAMPLE_CAP = 400;
const SLOW_KEEP = 8;
const LOCALE_SEG = /^[a-z]{2}(-[A-Za-z]{2,4})?$/;

function routeClass(url: string, headers: Record<string, unknown>): string {
  const path = url.split("?")[0];
  const seg = path.split("/").filter(Boolean);
  if (seg.length && LOCALE_SEG.test(seg[0]) && seg[0] !== "db") seg.shift();
  let c = seg.length ? `/${seg[0]}` : "/";
  if (seg[0] === "api" || seg[0] === "_next") c += `/${seg[1] ?? ""}`;
  if (headers["next-router-prefetch"]) c += " pf";
  else if (headers["rsc"] === "1") c += " rsc";
  return c;
}

const pct = (a: number[], p: number) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return Math.round(
    s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))],
  );
};

let started = false;

export function startPodHealth() {
  if (started) return;
  started = true;

  diagnostics_channel.subscribe("http.server.request.start", (msg) => {
    const { request, response } = msg as {
      request: {
        url?: string;
        headers: Record<string, unknown>;
      };
      response: {
        statusCode: number;
        writeHead: (...a: unknown[]) => unknown;
        once: (ev: string, fn: () => void) => void;
      };
    };
    // A proxy rewrite that Next forwards over HTTP to itself (see proxy.ts)
    // re-enters here; the outer request already counts it.
    if (request.headers["x-thgl-route"]) return;
    const t0 = performance.now();
    let ttfb = 0;
    inflight++;
    if (inflight > inflightMax) inflightMax = inflight;
    const writeHead = response.writeHead;
    response.writeHead = function (this: unknown, ...a: unknown[]) {
      if (!ttfb) ttfb = performance.now() - t0;
      return writeHead.apply(this, a);
    };
    let doneOnce = false;
    const done = () => {
      if (doneOnce) return;
      doneOnce = true;
      inflight--;
      const ms = performance.now() - t0;
      const url = request.url ?? "/";
      const cls = routeClass(url, request.headers);
      let t = timings.get(cls);
      if (!t) timings.set(cls, (t = { n: 0, total: [], ttfb: [] }));
      t.n++;
      if (t.total.length < SAMPLE_CAP) {
        t.total.push(ms);
        t.ttfb.push(ttfb || ms);
      }
      if (slow.length < SLOW_KEEP || ms > slow[slow.length - 1].ms) {
        slow.push({
          ms: Math.round(ms),
          ttfb: Math.round(ttfb || ms),
          status: response.statusCode,
          url: `${String(request.headers.host ?? "")}${url}`.slice(0, 140),
        });
        slow.sort((a, b) => b.ms - a.ms);
        slow.length = Math.min(slow.length, SLOW_KEEP);
      }
    };
    response.once("finish", done);
    response.once("close", done);
  });

  diagnostics_channel.subscribe("undici:client:connected", (msg) => {
    const { connectParams, socket } = msg as {
      connectParams?: ConnectParams;
      socket?: Socket;
    };
    const host = hostOf(connectParams);
    bump(connectOk, host);
    bump(openByHost, host);
    socket?.once("close", () => bump(openByHost, host, -1));
  });
  diagnostics_channel.subscribe("undici:client:connectError", (msg) => {
    const { connectParams, error } = msg as {
      connectParams?: ConnectParams;
      error?: { code?: string; name?: string };
    };
    bump(
      connectErr,
      `${hostOf(connectParams)} ${error?.code ?? error?.name ?? "?"}`,
    );
  });
  diagnostics_channel.subscribe("undici:request:create", (msg) => {
    bump(reqStarted, originHost((msg as { request?: RequestInfo }).request));
  });
  diagnostics_channel.subscribe("undici:request:error", (msg) => {
    bump(reqFailed, originHost((msg as { request?: RequestInfo }).request));
  });

  const el = monitorEventLoopDelay({ resolution: 20 });
  el.enable();

  let gcCount = 0;
  let gcMs = 0;
  let gcMax = 0;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      gcCount++;
      gcMs += e.duration;
      if (e.duration > gcMax) gcMax = e.duration;
    }
  }).observe({ entryTypes: ["gc"] });

  const heapLimitMB = Math.round(getHeapStatistics().heap_size_limit / 1048576);
  console.log(
    `[pod-health] start ${JSON.stringify({ heapLimitMB, containerMemMB: containerMemMB() })}`,
  );

  const top = (m: Map<string, number>, n = 8) =>
    Object.fromEntries([...m].sort((a, b) => b[1] - a[1]).slice(0, n));
  const ms = (ns: number) => Math.round(ns / 1e6);

  setInterval(() => {
    const mem = process.memoryUsage();
    const json = memoryFetchCacheStats();
    const open = [...openByHost.values()].reduce((a, b) => a + b, 0);
    console.log(
      `[pod-health] ${JSON.stringify({
        sock: { open, byHost: top(openByHost) },
        connect: { ok: top(connectOk), err: top(connectErr) },
        req: { started: top(reqStarted), failed: top(reqFailed) },
        el: {
          p50: ms(el.percentile(50)),
          p99: ms(el.percentile(99)),
          max: ms(el.max),
        },
        heapMB: Math.round(mem.heapUsed / 1048576),
        heapLimitMB,
        rssMB: Math.round(mem.rss / 1048576),
        extMB: Math.round(mem.external / 1048576),
        abMB: Math.round(mem.arrayBuffers / 1048576),
        gc: { n: gcCount, ms: Math.round(gcMs), max: Math.round(gcMax) },
        cache: {
          pageMB: pageCacheMB(),
          jsonMB: json.mb,
          jsonEntries: json.entries,
          jsonCopies: json.copies,
        },
      })}`,
    );
    // Page types ranked by origin time spent this minute (n × mean).
    const routes = [...timings]
      .map(([cls, t]) => {
        const mean = t.total.reduce((a, b) => a + b, 0) / (t.total.length || 1);
        return { cls, t, spent: t.n * mean };
      })
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 15);
    console.log(
      `[pod-timing] ${JSON.stringify({
        inflightMax,
        routes: Object.fromEntries(
          routes.map(({ cls, t }) => [
            cls,
            {
              n: t.n,
              p50: pct(t.total, 50),
              p95: pct(t.total, 95),
              max: pct(t.total, 100),
              ttfb50: pct(t.ttfb, 50),
            },
          ]),
        ),
        slow,
      })}`,
    );
    timings = new Map();
    slow = [];
    inflightMax = inflight;
    connectOk = new Map();
    connectErr = new Map();
    reqStarted = new Map();
    reqFailed = new Map();
    el.reset();
    gcCount = 0;
    gcMs = 0;
    gcMax = 0;
  }, INTERVAL_MS).unref();
}

/** cache-handler.cjs publishes its size on globalThis (it loads outside the bundle). */
function pageCacheMB(): number | undefined {
  const bytes = (globalThis as { __thglPageCacheBytes?: number })
    .__thglPageCacheBytes;
  return bytes === undefined ? undefined : Math.round(bytes / 1048576);
}

/** cgroup v2 / v1 memory limit of this container, if readable. */
function containerMemMB(): number | undefined {
  for (const f of [
    "/sys/fs/cgroup/memory.max",
    "/sys/fs/cgroup/memory/memory.limit_in_bytes",
  ]) {
    try {
      const n = Number(readFileSync(f, "utf8").trim());
      if (Number.isFinite(n) && n > 0 && n < 2 ** 60) {
        return Math.round(n / 1048576);
      }
    } catch {
      // not this cgroup layout
    }
  }
  return undefined;
}
