import { CONTENT_DIR, initDirs, OUTPUT_DIR } from "./lib/dirs.js";
import { encodeToFile, readDirSync, readJSON } from "./lib/fs.js";
import { writeNodes } from "./lib/nodes.js";
import { TriggerData } from "./once-human.types.js";

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
const triggeredDrops: [number, number, number][] = [];
for (const file of readDirSync(
  CONTENT_DIR + "/game_common/data/task/trigger_data/",
)) {
  if (!file.endsWith(".json")) {
    continue;
  }
  const prefabInfoData = await readJSON<TriggerData>(
    CONTENT_DIR + "/game_common/data/task/trigger_data/" + file,
  );
  for (const placeNode of Object.values(prefabInfoData.place_nodes)) {
    for (const node of Object.values(placeNode)) {
      if (node.drop_no && node.pos3) {
        triggeredDrops.push(node.pos3);
      }
    }
  }
}

const response = await fetch("https://actors-api.th.gl/nodes/once-human-7", {
  headers: {
    Authorization: `thgl`,
  },
});
const data = (await response.json()) as Record<
  string,
  [number, number, number, string][]
>;
Object.keys(data).forEach((type) => {
  let id = typeIDs[type];
  if (!id || id === "gear_crate" || id === "morphic_crate") {
    return;
  }
  const oldNodes = nodes.find((n) => n.type === id);
  if (!oldNodes) {
    console.log("No old nodes for", type);
  } else {
    // oldNodes.spawns = [];
  }
});

const items = filters.find((f) => f.group === "items")!;
Object.entries(data).forEach(([type, spawnNodes]) => {
  let id = typeIDs[type];
  if (!id || id === "gear_crate" || id === "morphic_crate") {
    console.warn("No type for", type);
    return;
  }
  let targetSpawnNodes = spawnNodes;
  if (id === "gear_crate") {
    const busMonsterLocations = [
      ...(data["bus_monster.gim"] || []),
      ...(data["bus_monster_arm.gim"] || []),
    ];
    targetSpawnNodes = targetSpawnNodes.filter(([x, y, z]) => {
      return busMonsterLocations.every(([bx, by, bz]) => {
        const distance = Math.sqrt(
          (x - bx) ** 2 + (y - by) ** 2 + (z - bz) ** 2,
        );
        return distance > 20;
      });
    });
  }
  if (id.startsWith("deviations_")) {
    const balls = data["ball.gim"] || [];
    targetSpawnNodes = targetSpawnNodes.filter(([x, y, z]) => {
      return balls.some(([bx, by, bz]) => {
        const distance = Math.sqrt(
          (x - bx) ** 2 + (y - by) ** 2 + (z - bz) ** 2,
        );
        return distance < 1;
      });
    });
  }

  const oldNodes = nodes.find((n) => n.type === id);
  if (!oldNodes) {
    // console.warn("No old nodes for", type);
    return;
  }
  // oldNodes.spawns = [];

  const isItem = items.values.some((v) => v.id === id);
  const minDistance = isItem ? 1 : 75;

  if (isItem) {
    targetSpawnNodes = targetSpawnNodes.filter(([x, y, z]) => {
      const closestDrop = triggeredDrops.reduce((acc, [ty, tz, tx]) => {
        const distance = Math.sqrt(
          (x - tx) ** 2 + (y - ty) ** 2 + (z - tz) ** 2,
        );
        return Math.min(acc, distance);
      }, Infinity);

      return closestDrop > 1;
    });
  }

  targetSpawnNodes.forEach(([x, y, z]) => {
    const hasCloseSpawn = oldNodes.spawns.some((s) => {
      const distance = Math.sqrt((s.p[0] - x) ** 2 + (s.p[1] - y) ** 2);
      return distance < minDistance;
    });
    const isNotOnWorldMap =
      x < -8100 || x > 3050 || y > 8200 || y < -2000 || (x > -600 && y < 600);
    if (hasCloseSpawn || isNotOnWorldMap) {
      return;
    }
    oldNodes.spawns.push({
      p: [x, y, z],
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
