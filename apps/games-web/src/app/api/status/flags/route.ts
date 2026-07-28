import { requireStatusAdmin } from "@/lib/status-admin";
import { setGameFlag } from "@/lib/status-db";

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
  await setGameFlag(
    body.game,
    body.state as "operational" | "degraded" | "outage",
    body.note?.trim() || null,
  );
  return Response.json({ ok: true });
}
