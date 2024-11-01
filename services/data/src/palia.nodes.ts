import { initDirs, OUTPUT_DIR } from "./lib/dirs.js";
import { encodeToFile, readJSON } from "./lib/fs.js";
import { writeNodes } from "./lib/nodes.js";

import { Node, Tiles, TypesIds } from "./types.js";

initDirs(
  String.raw`C:\dev\Palia\Extracted\Data`,
  String.raw`C:\dev\Palia\Extracted\Texture`,
  String.raw`C:\dev\the-hidden-gaming-lair\static\palia`,
);

const nodes = await readJSON<Node[]>(OUTPUT_DIR + "/coordinates/nodes.json");
const tiles = await readJSON<Tiles>(OUTPUT_DIR + "/coordinates/tiles.json");
const typeIDs = await readJSON<TypesIds>(
  OUTPUT_DIR + "/coordinates/types_id_map.json",
);

const response = await fetch("https://palia-api.th.gl/nodes?type=spawnNodes");
const data = (await response.json()) as Record<
  string,
  Record<string, [number, number, number][]>
>;

Object.entries(data).forEach(([type, mapSpawnNodes]) => {
  if (Object.values(mapSpawnNodes).length === 0) {
    // console.warn("No spawns for", type);
    return;
  }
  let typeId = type.endsWith("_C") ? type : type + "_C";
  if (typeId.includes("+")) {
    typeId = typeId.replace("+", "");
  }
  let id = typeIDs[typeId];

  if (!id) {
    console.warn("No type for", type);
    return;
  }

  const entries = Object.entries(mapSpawnNodes);

  entries.forEach(([deprecatedMapName, spawnNodes]) => {
    let mapName;
    if (deprecatedMapName === "kilima-valley") {
      mapName = "VillageWorld";
    } else if (deprecatedMapName === "bahari-bay") {
      mapName = "AdventureZoneWorld";
    } else if (deprecatedMapName === "housing") {
      mapName = "HousingPlot";
    } else {
      mapName = deprecatedMapName;
    }
    if (tiles[mapName] === undefined) {
      console.warn("No map name for", deprecatedMapName);
      return;
    }
    if (!nodes.some((n) => n.type === id && n.mapName === mapName)) {
      nodes.push({
        type: id,
        spawns: [],
        mapName,
      });
    }
    const oldNodes = nodes.find((n) => n.type === id && n.mapName === mapName)!;
    spawnNodes.forEach(([x, y, z]) => {
      if (mapName === "VillageWorld") {
        if (y > 60000 || x > 41000 || y < -56000 || x < -45000) {
          return;
        }
      } else if (mapName === "AdventureZoneWorld") {
        if (y > 160000 || x > 22500 || y < 51080 || x < -115838) {
          return;
        }
      } else if (mapName === "HousingPlot") {
        return;
      }
      let minDistance = 4000;

      const hasCloseSpawn = oldNodes.spawns.some((s) => {
        const distance = Math.sqrt((s.p[0] - x) ** 2 + (s.p[1] - y) ** 2);
        return distance < minDistance;
      });

      if (hasCloseSpawn) {
        // console.warn("Close spawn", x, y, z);
        return;
      }
      oldNodes.spawns.push({
        p: [x, y, z],
      });
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
