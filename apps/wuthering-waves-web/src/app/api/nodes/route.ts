import type { NodesCoordinates } from "@repo/ui/providers";
import _nodes from "../../../coordinates/nodes.json" assert { type: "json" };

const nodes = _nodes as NodesCoordinates;

export function GET(): Response {
  return Response.json(nodes);
}
