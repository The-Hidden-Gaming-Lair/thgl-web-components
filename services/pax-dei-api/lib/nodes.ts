import Ajv, { JSONSchemaType } from "ajv";

const ajv = new Ajv();

type Actor = {
  type: string;
  x: number;
  y: number;
  z: number;
  r: number;
  path: string;
};

export const actorsSchema: JSONSchemaType<Actor[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      address: { type: "number" },
      type: { type: "string" },
      x: { type: "number" },
      y: { type: "number" },
      z: { type: "number" },
      r: { type: "number" },
      path: { type: "string" },
    },
    required: ["type", "x", "y", "z", "path"],
    additionalProperties: true,
  },
};

export const validateActors = ajv.compile(actorsSchema);

export type Node = {
  type: string;
  x: number;
  y: number;
  z: number;
  timestamp: number;
  path: string;
};

export function toNode(actor: Actor): Node {
  return {
    type: actor.type,
    x: actor.x,
    y: actor.y,
    z: actor.z,
    timestamp: Date.now(),
    path: actor.path,
  };
}

export function getMinDistance() {
  return 200;
}

export function calculateDistance(
  node1: Node,
  coords: [number, number, number],
) {
  const dx = node1.x - coords[0];
  const dy = node1.y - coords[1];
  return Math.sqrt(dx * dx + dy * dy);
}
