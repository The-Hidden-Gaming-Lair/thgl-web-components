import { fileURLToPath } from "url";
import typesIdMap from "../../static/nightingale/coordinates/types_id_map.json";
import { writeJSON } from "./lib/fs.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const OUT_DIR = __dirname + "../out";
const PROD_OUT_DIR = "/home/devleon/the-hidden-gaming-lair/static/nightingale";

const response = await fetch(
  "https://nightingale-api.th.gl/nodes?type=spawnNodes"
);
const data = (await response.json()) as Record<
  string,
  [number, number, number, string][]
>;

const nodes: {
  type: string;
  spawns: { p: [number, number]; mapName: string }[];
}[] = [];

const maps = new Set<string>();
Object.keys(typesIdMap).forEach((type) => {
  const spawns = data[type];
  if (spawns) {
    const newSpawns: { p: [number, number]; mapName: string }[] = [];

    spawns.forEach(([x, y, z, mapName]) => {
      const isTooClose = newSpawns.some((s) => {
        if (s.mapName !== mapName) {
          return false;
        }
        const distance = calculateDistance(s, [x, y, z, mapName]);
        const minDistance = getMinDistance(type);
        return distance < minDistance;
      });
      if (isTooClose) {
        return;
      }
      maps.add(mapName);
      newSpawns.push({
        p: [x, y],
        mapName,
      });
    });

    nodes.push({
      type: typesIdMap[type],
      spawns: newSpawns,
    });
  }
});

const types = Object.keys(data).sort();

writeJSON(PROD_OUT_DIR + "/coordinates/nodes.json", nodes);
writeJSON(OUT_DIR + "/creatures/types.json", types);
writeJSON(OUT_DIR + "/creatures/maps.json", Array.from(maps));

function getMinDistance(type: string) {
  if (type.startsWith("BP_Creature")) {
    return 15000;
  }
  return 3000;
}

function calculateDistance(
  node1: { p: [number, number]; mapName: string },
  coords: [number, number, number, string]
) {
  const dx = node1.p[0] - coords[0];
  const dy = node1.p[1] - coords[1];
  return Math.sqrt(dx * dx + dy * dy);
}
