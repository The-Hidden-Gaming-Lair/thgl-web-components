import type { App } from "../../lib/apps";
import { response, unauthorized } from "../../lib/http";
import {
  selectActors,
  selectActorsByMapName,
  selectActorsByType,
  selectActorsByTypeAndMapname,
} from "../../lib/db";

export async function handleGET(req: Request, app: App) {
  const auth = req.headers.get("authorization");
  const type = req.headers.get("type");
  const mapName = req.headers.get("mapName");
  if (!auth || auth !== process.env.AUTH_TOKEN) {
    return unauthorized();
  }

  let result;
  if (type) {
    if (mapName) {
      result = selectActorsByTypeAndMapname(app.db, type, mapName);
    } else {
      result = selectActorsByType(app.db, type);
    }
  } else if (mapName) {
    result = selectActorsByMapName(app.db, mapName);
  } else {
    result = selectActors(app.db);
  }
  return response(JSON.stringify(result));
}
