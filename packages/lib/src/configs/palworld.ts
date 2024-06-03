import type { MarkerOptions, TileOptions } from "./types";

const TILE_SIZE = 512;
const MAP_BOUNDS = [
  [-582888, -301000],
  [335112, 617000],
] as [[number, number], [number, number]];

const REAL_SIZE = MAP_BOUNDS[1][0] - MAP_BOUNDS[0][0];
const MULTIPLE = REAL_SIZE / TILE_SIZE;
const OFFSET = [-MAP_BOUNDS[0][1] / MULTIPLE, MAP_BOUNDS[1][0] / MULTIPLE];

export const PALWORLD: {
  markerOptions: MarkerOptions;
  tileOptions: TileOptions;
} = {
  markerOptions: {
    radius: 6,
    playerZoom: 4,
  },
  tileOptions: {
    default: {
      url: `/map-tiles/worldmap/{z}/{y}/{x}.webp`,
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
  },
};
