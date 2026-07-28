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

const LOG = "[status/run]";

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

  const transitions: string[] = [];
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
        transitions.push(
          `**${COMPONENT_LABELS[check.component] ?? check.component}**: ${before} → ${after}` +
            (check.detail ? ` (${check.detail})` : "") +
            (check.latencyMs !== null ? ` [${check.latencyMs}ms]` : ""),
        );
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

  if (transitions.length > 0) {
    await notifyDiscord(
      `🛰️ THGL status change:\n${transitions.join("\n")}\nhttps://status.th.gl`,
    );
  }

  return Response.json({
    ok: true,
    checks: checks.map((c) => ({ component: c.component, state: c.state })),
    transitions: transitions.length,
  });
}
