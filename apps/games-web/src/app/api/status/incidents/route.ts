import { requireStatusAdmin } from "@/lib/status-admin";
import { openIncident, resolveIncident } from "@/lib/status-db";
import { purgeStatusCache } from "@/lib/status-purge";

export async function POST(request: Request) {
  if (!(await requireStatusAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: {
    action?: "open" | "resolve";
    id?: string;
    title?: string;
    body?: string | null;
    severity?: "degraded" | "outage";
    affects?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (body.action !== "open" && body.action !== "resolve") {
    return Response.json(
      { error: "action must be 'open' or 'resolve'" },
      { status: 400 },
    );
  }
  if (body.action === "resolve") {
    if (!body.id) {
      return Response.json({ error: "id required" }, { status: 400 });
    }
    await resolveIncident(body.id);
    await purgeStatusCache();
    return Response.json({ ok: true });
  }
  if (!body.title || !["degraded", "outage"].includes(body.severity ?? "")) {
    return Response.json(
      { error: "title + valid severity required" },
      { status: 400 },
    );
  }
  await openIncident({
    id: crypto.randomUUID(),
    title: body.title,
    body: body.body?.trim() || null,
    severity: body.severity!,
    affects: body.affects?.length ? body.affects : ["all"],
    source: "manual",
  });
  await purgeStatusCache();
  return Response.json({ ok: true });
}
