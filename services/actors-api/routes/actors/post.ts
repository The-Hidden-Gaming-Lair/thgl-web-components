import type { App } from "../../lib/apps";
import { insertActors, type Actor } from "../../lib/db";
import { badRequest, response } from "../../lib/http";
import Ajv, { type JSONSchemaType } from "ajv";

const ajv = new Ajv();

const actorsSchema: JSONSchemaType<Omit<Actor, "id">[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      type: { type: "string" },
      x: { type: "number" },
      y: { type: "number" },
      z: { type: "number" },
      mapName: { type: "string" },
    },
    required: ["type", "x", "y", "z"],
    additionalProperties: true,
  },
};

export const validateActors = ajv.compile(actorsSchema);
export async function handlePOST(req: Request, app: App) {
  if (req.headers.get("content-type") !== "application/json") {
    return badRequest();
  }
  try {
    const body = await req.json();
    if (!body) {
      return badRequest();
    }
    if (!validateActors(body)) {
      const message = validateActors
        .errors!.map((error) => error.message)
        .join("\n");
      return response(`Invalid actor: ${message}`, 400);
    }
    const actors = body.map((actor) => ({
      ...actor,
      id:
        (actor.mapName || "default@") +
        Math.round(actor.x) +
        ":" +
        Math.round(actor.y) +
        ":" +
        Math.round(actor.z),
    }));
    insertActors(app.db, actors);

    return response(`Inserted new actors`, 201);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return badRequest();
    }
    throw e;
  }
}
