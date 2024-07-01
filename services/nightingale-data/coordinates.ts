import { fileURLToPath } from "url";
import typesIdMap from "../../static/nightingale/coordinates/types_id_map.json";
import { readJSON, writeJSON } from "./lib/fs.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const OUT_DIR = __dirname + "out";
const PROD_OUT_DIR = "/home/devleon/the-hidden-gaming-lair/static/nightingale";

const nodes: {
  type: string;
  mapName: string;
  spawns: { p: [number, number] }[];
}[] = readJSON(PROD_OUT_DIR + "/coordinates/nodes.json");

if (Bun.env.NODES === "true") {
  const response = await fetch(
    "https://nightingale-api.th.gl/nodes?type=spawnNodes",
  );
  const data = (await response.json()) as Record<
    string,
    [number, number, number, string][]
  >;
  const maps = new Set<string>();
  Object.keys(typesIdMap).forEach((type) => {
    const spawns = data[type];
    if (spawns) {
      spawns.forEach(([x, y, z, mapName]) => {
        let oldNodes = nodes.find(
          (n) => n.type === typesIdMap[type] && n.mapName === mapName,
        );
        if (!oldNodes) {
          oldNodes = { type: typesIdMap[type], spawns: [], mapName };
          nodes.push(oldNodes);
          oldNodes = nodes.find(
            (n) => n.type === typesIdMap[type] && n.mapName === mapName,
          )!;
        }

        const isTooClose = oldNodes.spawns.some((s) => {
          const distance = calculateDistance(s, [x, y, z]);
          const minDistance = getMinDistance(type);
          return distance < minDistance;
        });
        if (isTooClose) {
          return;
        }
        maps.add(mapName);
        oldNodes!.spawns.push({
          p: [x, y],
        });
      });
    }
  });
  const types = Object.keys(data).sort();
  writeJSON(OUT_DIR + "/creatures/types.json", types);
  writeJSON(OUT_DIR + "/creatures/maps.json", Array.from(maps));
}

writeJSON(PROD_OUT_DIR + "/coordinates/nodes.json", nodes);

function getMinDistance(type: string) {
  if (type.startsWith("BP_Creature")) {
    return 15000;
  }
  return 3000;
}

function calculateDistance(
  node1: { p: [number, number] },
  coords: [number, number, number],
) {
  const dx = node1.p[0] - coords[0];
  const dy = node1.p[1] - coords[1];
  return Math.sqrt(dx * dx + dy * dy);
}
