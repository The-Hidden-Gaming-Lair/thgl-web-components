import {
  type NodesCoordinates,
  type Dict,
  type Spawns,
} from "@repo/ui/providers";
import Fuse from "fuse.js";
import { encodeToBuffer } from "@repo/lib";
import _enDict from "../../../../dicts/en.json" assert { type: "json" };
import _nodes from "../../../../coordinates/nodes.json" assert { type: "json" };

const enDict = _enDict as Dict;

const nodes = _nodes as NodesCoordinates;
const spreadedSpawns = nodes.flatMap((node) =>
  node.spawns.map((spawn) => ({
    type: node.type,
    data: spawn.data ?? node.data,
    mapName: node.mapName,
    ...spawn,
  })),
);
const fuse = new Fuse<Spawns[number]>(spreadedSpawns, {
  keys: [
    {
      name: "type",
      getFn: (spawn) => enDict[spawn.type],
      weight: 1,
    },
    {
      name: "name",
      getFn: (spawn) => (spawn.id ? enDict[spawn.id] ?? "" : ""),
      weight: 2,
    },
    {
      name: "tags",
      getFn: (spawn) => enDict[`${spawn.id ?? spawn.type}_tags`] ?? "",
      weight: 2,
    },
  ],
  shouldSort: true,
  includeScore: true,
  threshold: 0.3,
});

export function GET(request: Request): Response {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 3) {
    return Response.json([], {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "CDN-Cache-Control": "public, s-maxage=2678400",
      },
    });
  }

  const items = fuse
    .search(query)
    .map((result) => ({ ...result.item, score: result.score }));
  const buffer = encodeToBuffer(items);
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/cbor",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "CDN-Cache-Control": "public, s-maxage=2678400",
    },
  });
}
