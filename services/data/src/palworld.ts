import { CONTENT_DIR, OUTPUT_DIR, TEXTURE_DIR, initDirs } from "./lib/dirs.js";
import { readJSON } from "./lib/fs.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { Node } from "./types.js";

initDirs(
  "/mnt/c/dev/Palworld/Extracted/Data",
  "/mnt/c/dev/Palworld/Extracted/Texture",
  "/home/devleon/the-hidden-gaming-lair/static/palworld",
);

const TILE_SIZE = 512;
const MAP_BOUNDS = [
  [-582888, -301000],
  [335112, 617000],
] as [[number, number], [number, number]];

const REAL_SIZE = MAP_BOUNDS[1][0] - MAP_BOUNDS[0][0];
const MULTIPLE = REAL_SIZE / TILE_SIZE;
const OFFSET = [-MAP_BOUNDS[0][1] / MULTIPLE, MAP_BOUNDS[1][0] / MULTIPLE];

await generateTiles(
  "default",
  TEXTURE_DIR + "/Pal/Content/Pal/Texture/UI/map/T_WorldMap.png",
  REAL_SIZE,
  TILE_SIZE,
  OFFSET,
  MAP_BOUNDS,
);
const tiles = initTiles({
  default: {
    url: `/map-tiles/default/{z}/{y}/{x}.webp`,
    options: {
      minNativeZoom: 0,
      maxNativeZoom: 4,
      bounds: MAP_BOUNDS,
      tileSize: TILE_SIZE,
    },
    minZoom: 0,
    maxZoom: 5,
    fitBounds: MAP_BOUNDS,
    transformation: [1 / MULTIPLE, OFFSET[0], -1 / MULTIPLE, OFFSET[1]],
  },
});

writeTiles(tiles);

const mainWorld = readJSON<any>(
  CONTENT_DIR + "/Pal/Content/Pal/Maps/MainWorld_5/PL_MainWorld5.json",
);

const newNodes = initNodes();

const oldNodes = readJSON<Node[]>(OUTPUT_DIR + "/coordinates/nodes.json");
for (const node of mainWorld) {
  if (node.Type !== "SceneComponent" || !node.Properties?.RelativeLocation) {
    continue;
  }

  let type: string;
  let isStatic: boolean = false;
  if (node.Outer.startsWith("BP_DungeonPortalMarker_")) {
    type = "dungeon_random";
  } else if (node.Outer.startsWith("BP_DungeonFixedEntrance")) {
    type = "dungeon_sealed";
  } else if (node.Outer.startsWith("BP_LevelObject_GoddessStatue")) {
    type = "goddess_statue";
    // } else if (node.Outer.startsWith("?")) {
    //   type = "fasttravel";
    // } else if (node.Outer.startsWith("?")) {
    //   type = "boss_tower";
  } else if (node.Outer.startsWith("BP_RelicObject")) {
    type = "lifmunk_effigy";
  } else if (node.Outer.startsWith("BP_PalMapObjectSpawner_SkillFruits")) {
    type = "skill_fruit";
  } else if (node.Outer.startsWith("BP_PalMapObjectSpawner_Treasure")) {
    type = "treasure_box";
    // } else if (node.Outer.startsWith("bp_palmapobjectspawner_palegg_grass_")) {
    //   type = "egg_common";
    // } else if (node.Outer.startsWith("bp_palmapobjectspawner_palegg_grass_")) {
    //   type = "egg_dark";
  } else {
    continue;
  }

  if (!newNodes.some((n) => n.type === type)) {
    const nodeDef: Node = {
      type,
      spawns: [],
    };
    if (isStatic) {
      nodeDef.static = true;
    }
    newNodes.push(nodeDef);
  }
  const category = newNodes.find((n) => n.type === type)!;
  const spawn: Node["spawns"][0] = {
    p: [node.Properties.RelativeLocation.X, node.Properties.RelativeLocation.Y],
  };
  category.spawns.push(spawn);
}

const nodes = oldNodes.map((n) => {
  const newNodeType = newNodes.find((nn) => nn.type === n.type);
  if (newNodeType) {
    return newNodeType;
  }
  return n;
});
writeNodes(nodes);
