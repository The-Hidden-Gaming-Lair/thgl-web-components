import { games } from "@repo/lib";
import { requireStatusAdmin } from "@/lib/status-admin";
import {
  flagIncidentId,
  resolveIncident,
  setGameFlag,
  upsertFlagIncident,
} from "@/lib/status-db";
import { purgeStatusCache } from "@/lib/status-purge";

export async function POST(request: Request) {
  if (!(await requireStatusAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { game?: string; state?: string; note?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (
    !body.game ||
    !["operational", "degraded", "outage"].includes(body.state ?? "")
  ) {
    return Response.json(
      { error: "game + valid state required" },
      { status: 400 },
    );
  }
  const state = body.state as "operational" | "degraded" | "outage";
  const note = body.note?.trim() || null;
  await setGameFlag(body.game, state, note);
  // Mirror the flag lifecycle into the incidents table so live-mode
  // episodes show up in the status page's incident history once cleared.
  if (state === "operational") {
    await resolveIncident(flagIncidentId(body.game));
  } else {
    await upsertFlagIncident({
      game: body.game,
      label: games.find((g) => g.id === body.game)?.title ?? body.game,
      severity: state,
      note,
    });
  }
  await purgeStatusCache();
  return Response.json({ ok: true });
}
