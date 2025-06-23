import type { App } from "../../lib/apps";
import { deleteActors } from "../../lib/db";
import { ok, unauthorized } from "../../lib/http";

export async function handleDELETE(req: Request, app: App) {
  const auth = req.headers.get("authorization");
  if (!auth || auth !== process.env.AUTH_TOKEN) {
    return unauthorized();
  }
  deleteActors(app.db);
  return ok();
}
