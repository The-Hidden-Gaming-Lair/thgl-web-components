import { $ } from "bun";
import { Tiles } from "../types.js";
import { OUTPUT_DIR } from "./dirs.js";
import { readDirRecursive, readDirSync, writeJSON } from "./fs.js";

export function initTiles(seed?: Tiles): Tiles {
  return seed ?? {};
}

export function writeTiles(tiles: Tiles) {
  writeJSON(OUTPUT_DIR + "/coordinates/tiles.json", tiles);
}

export async function generateTiles(
  mapName: string,
  imagePath: string,
  width: number,
  tileSize = 512,
  additionalOffset = [0, 0],
  fitBounds?: [[number, number], [number, number]],
  cropBounds?: [[number, number], [number, number]],
  transformation?: [number, number, number, number],
  transformationMultiplier = [1, 1] as [number, number],
): Promise<Tiles> {
  const halfWidth = width / 2;
  const mapBounds = [
    [-halfWidth, -halfWidth],
    [halfWidth, halfWidth],
  ] as [[number, number], [number, number]];
  const multiple = width / tileSize;
  const offset = [-mapBounds[0][0] / multiple, -mapBounds[0][1] / multiple];

  const outDir = `${OUTPUT_DIR}/map-tiles/${mapName}`;

  const realBounds = [
    [-halfWidth + additionalOffset[1], -halfWidth + additionalOffset[0]],
    [halfWidth + additionalOffset[1], halfWidth + additionalOffset[0]],
  ].map((b, i) => b.map((v, j) => v - (cropBounds?.[i][j] || 0))) as [
    [number, number],
    [number, number],
  ];

  if (Bun.env.TILES === "true") {
    await $`mkdir -p ${outDir}`;
    await $`vips dzsave ${imagePath} ${outDir} --tile-size ${tileSize} --background 0 --overlap 0 --layout google --suffix .jpg[Q=100]`;

    for (const file of readDirRecursive(outDir)) {
      if (file.includes("blank")) {
        await $`rm ${file}`;
        continue;
      }
      if (file.endsWith(".jpg") || file.endsWith(".png")) {
        await $`cwebp ${file} -m 6 -o ${file.replace(".jpg", ".webp").replace(".png", ".webp")} -quiet`;
        await $`rm ${file}`;
      }
    }
  }
  let maxNativeZoom = 3;
  try {
    maxNativeZoom = Math.max(...(await readDirSync(outDir).map((f) => +f)));
  } catch (e) {}

  return {
    [mapName]: {
      url: `/map-tiles/${mapName}/{z}/{y}/{x}.webp`,
      options: {
        minNativeZoom: 0,
        maxNativeZoom: maxNativeZoom,
        bounds: realBounds,
        tileSize: tileSize,
      },
      minZoom: -5,
      maxZoom: 7,
      fitBounds: fitBounds ?? realBounds,
      transformation: transformation ?? [
        (1 / multiple) * transformationMultiplier[0],
        offset[0] - additionalOffset[0] / multiple,
        (1 / multiple) * transformationMultiplier[1],
        offset[1] - additionalOffset[1] / multiple,
      ],
    },
  };
}
