import type { NodesCoordinates } from "@repo/ui/providers";
import _nodes from "../../../../coordinates/nodes.json" assert { type: "json" };

const nodes = _nodes as NodesCoordinates;

export function GET(
  _request: Request,
  { params }: { params: { mapName: string } },
): Response {
  const mapNodes = nodes.filter((node) => node.mapName === params.mapName);
  return Response.json(mapNodes, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "CDN-Cache-Control": "public, s-maxage=2678400",
    },
  });
}
