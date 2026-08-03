/**
 * Fetch with automatic failover for the Bunny-fronted self-hosted APIs.
 *
 * Some ISPs have broken routes to either the Bunny edge or the Hetzner
 * origin (2026-08-03: a PH user could reach neither comments nor live
 * tracking for weeks — see the DNS-Issue incident). Both hostnames stay
 * published, so a network-level failure on the primary (edge) hostname is
 * retried once against the `*-direct` origin hostname, giving every client
 * two independent network paths. HTTP error responses are NOT retried —
 * only thrown fetches (DNS, TLS, unreachable route).
 *
 * Failures also emit anonymous Plausible custom events (once per service
 * per session) so regional reachability problems become visible in
 * analytics instead of waiting for a user report.
 */

const DIRECT_HOSTS: Record<string, string> = {
  "https://api-forge.th.gl": "https://api-forge-direct.th.gl",
  "https://actors-api.th.gl": "https://actors-api-direct.th.gl",
  "https://palia-api.th.gl": "https://palia-api-direct.th.gl",
};

/** Per-session working base per primary host ("" until first success). */
const activeBase = new Map<string, string>();
/** Events already emitted this session (dedupe key: `${event}:${host}`). */
const reportedEvents = new Set<string>();

function beacon(event: string, service: string) {
  const key = `${event}:${service}`;
  if (reportedEvents.has(key)) return;
  reportedEvents.add(key);
  try {
    const plausible = (
      globalThis as {
        plausible?: (
          event: string,
          options: { props: Record<string, string> },
        ) => void;
      }
    ).plausible;
    if (typeof plausible === "function") {
      plausible(event, { props: { service } });
    }
  } catch {
    // Telemetry must never break the actual request path.
  }
}

export async function resilientFetch(
  url: string | URL,
  init?: RequestInit,
): Promise<Response> {
  const target = url.toString();
  const primary = Object.keys(DIRECT_HOSTS).find((host) =>
    target.startsWith(host),
  );
  if (!primary) {
    return fetch(url, init);
  }
  const service = new URL(primary).hostname;

  // A previous request this session already failed over — go direct first.
  if (activeBase.get(primary) === DIRECT_HOSTS[primary]) {
    try {
      return await fetch(target.replace(primary, DIRECT_HOSTS[primary]), init);
    } catch {
      // Direct path died too; fall through and give the edge another shot.
      activeBase.delete(primary);
    }
  }

  try {
    const res = await fetch(target, init);
    activeBase.set(primary, primary);
    return res;
  } catch (primaryError) {
    beacon("Service Unreachable", service);
    try {
      const res = await fetch(
        target.replace(primary, DIRECT_HOSTS[primary]),
        init,
      );
      activeBase.set(primary, DIRECT_HOSTS[primary]);
      beacon("Service Fallback Active", service);
      return res;
    } catch {
      throw primaryError;
    }
  }
}
