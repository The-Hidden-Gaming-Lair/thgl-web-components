import type { NodesCoordinates } from "@repo/ui/providers";
import { encodeToBuffer } from "@repo/lib";
import _nodes from "../../../../coordinates/nodes.json" assert { type: "json" };

const nodes = _nodes as NodesCoordinates;

export function GET(
  _request: Request,
  { params }: { params: { mapName: string } },
): Response {
  const mapNodes = nodes.filter(
    (node) => !node.mapName || node.mapName === params.mapName,
  );
  const buffer = encodeToBuffer(mapNodes);
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/cbor",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "CDN-Cache-Control": "public, s-maxage=2678400",
    },
  });
}
