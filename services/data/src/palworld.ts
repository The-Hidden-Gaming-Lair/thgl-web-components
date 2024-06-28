import { TEXTURE_DIR, initDirs } from "./lib/dirs.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";

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
