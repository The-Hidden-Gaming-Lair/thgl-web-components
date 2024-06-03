import Ajv, { JSONSchemaType } from "ajv";

const ajv = new Ajv();

type Actor = {
  type: string;
  x: number;
  y: number;
  z: number;
  r: number;
};

export const actorsSchema: JSONSchemaType<Actor[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      type: { type: "string" },
      x: { type: "number" },
      y: { type: "number" },
      z: { type: "number" },
      r: { type: "number" },
    },
    required: ["type", "x", "y", "z", "r"],
    additionalProperties: false,
  },
};

export const validateActors = ajv.compile(actorsSchema);

export type Node = {
  type: string;
  x: number;
  y: number;
  z: number;
  timestamp: number;
};

export function toNode(actor: Actor): Node {
  return {
    type: actor.type,
    x: actor.x,
    y: actor.y,
    z: actor.z,
    timestamp: Date.now(),
  };
}

export function getMinDistance() {
  return 200;
}

export function calculateDistance(
  node1: Node,
  coords: [number, number, number]
) {
  const dx = node1.x - coords[0];
  const dy = node1.y - coords[1];
  return Math.sqrt(dx * dx + dy * dy);
}
