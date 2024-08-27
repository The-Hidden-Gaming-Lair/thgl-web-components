import { initDirs, OUTPUT_DIR } from "./lib/dirs.js";
import { encodeToFile, readJSON } from "./lib/fs.js";
import { writeNodes } from "./lib/nodes.js";

import { Filter, Node, Tiles, TypesIds } from "./types.js";

initDirs(
  Bun.env.ONCE_HUMAN_CONTENT_DIR ?? "/mnt/c/dev/OnceHuman/Extracted/Data",
  Bun.env.ONCE_HUMAN_TEXTURE_DIR ?? "/mnt/c/dev/OnceHuman/Extracted/Texture",
  Bun.env.ONCE_HUMAN_OUTPUT_DIR ??
    "/home/devleon/the-hidden-gaming-lair/static/once-human",
);

const nodes = await readJSON<Node[]>(OUTPUT_DIR + "/coordinates/nodes.json");
const tiles = await readJSON<Tiles>(OUTPUT_DIR + "/coordinates/tiles.json");
const filters = await readJSON<Filter[]>(
  OUTPUT_DIR + "/coordinates/filters.json",
);
const typeIDs = await readJSON<TypesIds>(
  OUTPUT_DIR + "/coordinates/types_id_map.json",
);

const filter = filters.find((f) => f.group === "items")!;

const response = await fetch("https://actors-api.th.gl/nodes/once-human");
const data = (await response.json()) as Record<
  string,
  [number, number, number, string][]
>;

Object.entries(data).forEach(([type, spawnNodes]) => {
  let id = typeIDs[type];
  if (!id) {
    console.warn("No type for", type);
    return;
  }
  if (!filter.values.some((v) => v.id === id)) {
    return;
  }

  spawnNodes.forEach(([x, y]) => {
    const oldNodes = nodes.find((n) => n.type === id)!;
    const hasCloseSpawn = oldNodes.spawns.some((s) => {
      return Math.abs(s.p[0] - x) < 1 && Math.abs(s.p[1] - y) < 1;
    });
    if (hasCloseSpawn) {
      return;
    }
    oldNodes.spawns.push({
      p: [x, y],
    });
  });
});

const filteredNodes = nodes.map((n) => ({
  ...n,
  static: !Object.values(typeIDs).includes(n.type) || n.type.endsWith("_crate"),
  spawns: n.spawns.filter((s) => {
    const isNotOnWorldMap = s.p[0] > 3050 || (s.p[0] > -600 && s.p[1] < 600);
    return !isNotOnWorldMap;
  }),
}));

writeNodes(filteredNodes);
Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    filteredNodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});

console.log("Done!");
