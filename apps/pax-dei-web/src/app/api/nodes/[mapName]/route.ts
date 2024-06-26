import type { NodesCoordinates } from "@repo/ui/providers";
import _nodes from "../../../../coordinates/nodes.json" assert { type: "json" };

const nodes = _nodes as NodesCoordinates;

export function GET(
  _request: Request,
  { params }: { params: { mapName: string } },
): Response {
  const mapNodes = nodes.map((node) => ({
    ...node,
    spawns: node.spawns.filter((spawn) => spawn.mapName === params.mapName),
  }));
  return Response.json(mapNodes);
}
