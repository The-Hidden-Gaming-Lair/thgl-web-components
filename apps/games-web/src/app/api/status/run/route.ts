import { applyFlapSuppression, type StatusState } from "@repo/lib";
import {
  COMPONENT_LABELS,
  HARD_COMPONENTS,
  runAllChecks,
} from "@/lib/status-checks";
import {
  autoIncidentId,
  getRecentRawStates,
  insertChecks,
  openIncident,
  pruneOldChecks,
  resolveIncident,
} from "@/lib/status-db";
import { purgeStatusCache } from "@/lib/status-purge";

const LOG = "[status/run]";

// Per-pod memory of the last state ANNOUNCED per component. When the DB
// is unwritable, the stored history window freezes and every run
// re-detects the same transition — without this guard that meant one
// identical Discord ping per minute (2026-08-17 spam during the relay
// rate-limiting window). Worst case now is one duplicate per pod.
const lastNotifiedState = new Map<string, StatusState>();

async function notifyDiscord(text: string): Promise<void> {
  const webhook = process.env.STATUS_DISCORD_WEBHOOK;
  if (!webhook) return;
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 3000);
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
      signal: ctrl.signal,
    });
  } catch (err) {
    console.error(`${LOG} discord webhook failed:`, err);
  } finally {
    clearTimeout(timeout);
  }
}

export const maxDuration = 55;
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (
    !process.env.STATUS_RUN_SECRET ||
    auth !== `Bearer ${process.env.STATUS_RUN_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks = await runAllChecks();
  const components = checks.map((c) => c.component);

  const transitions: {
    component: string;
    after: StatusState;
    message: string;
  }[] = [];
  try {
    // Public state BEFORE this run (suppression over the stored window)
    // vs AFTER (current + stored). Raw rows only are stored; suppression
    // is applied on read.
    const history = await getRecentRawStates(components, 3);
    for (const check of checks) {
      const prevRaw = (history[check.component] ?? []) as StatusState[];
      const before = applyFlapSuppression(prevRaw);
      const after = applyFlapSuppression([check.state, ...prevRaw]);
      if (before !== after) {
        transitions.push({
          component: check.component,
          after,
          message:
            `**${COMPONENT_LABELS[check.component] ?? check.component}**: ${before} → ${after}` +
            (check.detail ? ` (${check.detail})` : "") +
            (check.latencyMs !== null ? ` [${check.latencyMs}ms]` : ""),
        });
        if (HARD_COMPONENTS.includes(check.component)) {
          if (after === "outage") {
            await openIncident({
              id: autoIncidentId(check.component),
              title: `${COMPONENT_LABELS[check.component]} outage`,
              body: check.detail,
              severity: "outage",
              affects: [check.component],
              source: "auto",
            });
          } else {
            await resolveIncident(autoIncidentId(check.component));
          }
        }
      }
    }
    // Safety net: resolve any auto incident whose component is now
    // publicly operational (covers transitions missed while the DB was
    // unwritable). Only bother when the previous window was NOT clean —
    // a stable-operational component can't have an open auto incident,
    // so skipping it avoids a no-op write per component per minute.
    for (const check of checks) {
      if (!HARD_COMPONENTS.includes(check.component)) continue;
      const prevRaw = (history[check.component] ?? []) as StatusState[];
      const after = applyFlapSuppression([check.state, ...prevRaw]);
      if (after === "operational" && prevRaw.some((s) => s !== "operational")) {
        await resolveIncident(autoIncidentId(check.component));
      }
    }
    await insertChecks(checks);
    await pruneOldChecks();
  } catch (err) {
    // The DB being down IS one of the states we report — never fail the
    // run because of it. Transitions/history are best-effort.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} persistence failed: ${msg}`);
  }

  // Announce only transitions this pod hasn't already announced with the
  // same target state — see lastNotifiedState above.
  const announcements = transitions.filter(
    (t) => lastNotifiedState.get(t.component) !== t.after,
  );
  if (announcements.length > 0) {
    for (const t of announcements) {
      lastNotifiedState.set(t.component, t.after);
    }
    await Promise.all([
      notifyDiscord(
        `🛰️ THGL status change:\n${announcements.map((t) => t.message).join("\n")}\nhttps://www.th.gl/status`,
      ),
      // Evict the cached page/API so the transition is visible
      // immediately, not after the 60s TTL.
      purgeStatusCache(),
    ]);
  }

  return Response.json({
    ok: true,
    checks: checks.map((c) => ({ component: c.component, state: c.state })),
    transitions: announcements.length,
  });
}
