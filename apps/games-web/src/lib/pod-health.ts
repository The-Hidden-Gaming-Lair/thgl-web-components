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
 *
 * Node's built-in fetch is undici; it publishes these diagnostics channels.
 * Read the lines with the MC logs API (`/mc/apps/{id}/logs`, grep pod-health)
 * or `scripts/analyze-origin-incident.ts --mc` in data-forge.
 */
import diagnostics_channel from "node:diagnostics_channel";
import { monitorEventLoopDelay } from "node:perf_hooks";
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

let started = false;

export function startPodHealth() {
  if (started) return;
  started = true;

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

  const top = (m: Map<string, number>, n = 8) =>
    Object.fromEntries([...m].sort((a, b) => b[1] - a[1]).slice(0, n));
  const ms = (ns: number) => Math.round(ns / 1e6);

  setInterval(() => {
    const mem = process.memoryUsage();
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
        rssMB: Math.round(mem.rss / 1048576),
      })}`,
    );
    connectOk = new Map();
    connectErr = new Map();
    reqStarted = new Map();
    reqFailed = new Map();
    el.reset();
  }, INTERVAL_MS).unref();
}
