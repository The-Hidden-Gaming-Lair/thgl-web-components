import { CONTENT_DIR, initDirs, OUTPUT_DIR } from "./lib/dirs.js";
import { encodeToFile, readDirSync, readJSON } from "./lib/fs.js";
import { writeNodes } from "./lib/nodes.js";
import { TriggerData } from "./once-human.types.js";

import { Filter, Node, Tiles, TypesIds } from "./types.js";

initDirs(
  String.raw`C:\dev\OnceHuman\Extracted\Data`,
  String.raw`C:\dev\OnceHuman\Extracted\Texture`,
  String.raw`C:\dev\the-hidden-gaming-lair\static\once-human`,
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

const response = await fetch("https://actors-api.th.gl/nodes/once-human-9", {
  headers: {
    Authorization: `thgl`,
  },
});
const data = (await response.json()) as Record<
  string,
  [number, number, number, string][]
>;
// Object.keys(data).forEach((type) => {
//   let id = typeIDs[type];
//   if (!id || id === "gear_crate") {
//     return;
//   }
//   const oldNodes = nodes.find((n) => n.type === id);
//   if (!oldNodes) {
//     console.log("No old nodes for", type);
//   } else {
//     // oldNodes.spawns = [];
//     if (id === "morphic_crate") {
//       oldNodes.spawns = [];
//     }
//   }
// });

const items = filters.find((f) => f.group === "items")!;
Object.entries(data).forEach(([type, spawnNodes]) => {
  let id = typeIDs[type];
  if (!id) {
    console.warn("No type for", type);
    return;
  }
  if (!nodes.some((n) => n.type === id)) {
    console.log("No filter for", id);
    return;
  }

  let targetSpawnNodes = spawnNodes;
  if (id === "gear_crate") {
    const busMonsterLocations = [
      ...(data["bus_monster.gim"] || []),
      ...(data["bus_monster_arm.gim"] || []),
    ];
    targetSpawnNodes = targetSpawnNodes.filter(([x, y, z, mapName]) => {
      return busMonsterLocations.every(([bx, by, bz, bMapName]) => {
        if (mapName !== bMapName) {
          return true;
        }
        const distance = Math.sqrt(
          (x - bx) ** 2 + (y - by) ** 2 + (z - bz) ** 2,
        );
        return distance > 20;
      });
    });
  }
  if (id.startsWith("deviations_")) {
    const balls = data["ball.gim"] || [];
    targetSpawnNodes = targetSpawnNodes.filter(([x, y, z, mapName]) => {
      return balls.some(([bx, by, bz, bMapName]) => {
        if (mapName !== bMapName) {
          return false;
        }
        const distance = Math.sqrt(
          (x - bx) ** 2 + (y - by) ** 2 + (z - bz) ** 2,
        );
        return distance < 1;
      });
    });
  }

  const isItem = items.values.some((v) => v.id === id);

  if (isItem) {
    targetSpawnNodes = targetSpawnNodes.filter(([x, y, z, mapName]) => {
      const closestDrop = triggeredDrops.reduce((acc, [ty, tz, tx]) => {
        const distance = Math.sqrt(
          (x - tx) ** 2 + (y - ty) ** 2 + (z - tz) ** 2,
        );
        return Math.min(acc, distance);
      }, Infinity);

      return closestDrop > 1;
    });
  }

  targetSpawnNodes.forEach(([x, y, z, mapName]) => {
    if (!["default", "raid"].includes(mapName)) {
      return;
    }
    let minDistance;
    if (mapName === "raid") {
      minDistance = isItem ? 1 : 3;
    } else {
      minDistance = isItem ? (id === "morphic_crate" ? 20 : 5) : 75;
      const isNotOnWorldMap =
        x < -8100 || x > 3050 || y > 8200 || y < -2000 || (x > -600 && y < 600);
      if (isNotOnWorldMap) {
        return false;
      }
    }

    if (!nodes.some((n) => n.type === id && n.mapName === mapName)) {
      nodes.push({
        type: id,
        mapName,
        spawns: [],
      });
    }
    const oldNodes = nodes.find((n) => n.type === id && n.mapName === mapName)!;

    const hasCloseSpawn = oldNodes.spawns.some((s) => {
      const distance = Math.sqrt((s.p[0] - x) ** 2 + (s.p[1] - y) ** 2);
      return distance < minDistance;
    });

    if (hasCloseSpawn) {
      return;
    }
    oldNodes.spawns.push({
      p: [x, y, z],
    });
  });
});

writeNodes(nodes);
Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    nodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});

console.log("Done!");
