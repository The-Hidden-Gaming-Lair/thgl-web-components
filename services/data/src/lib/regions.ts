import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Region } from "../types.js";
import { OUTPUT_DIR, TEMP_DIR } from "./dirs.js";
import { saveImage, writeJSON } from "./fs.js";
import uniqolor from "uniqolor";

export function initRegions(seed?: Region[]): Region[] {
  return seed ?? [];
}

export function writeRegions(regions: Region[]) {
  writeJSON(OUTPUT_DIR + "/coordinates/regions.json", regions);
}

interface Point {
  x: number;
  y: number;
}
export async function getRegionsFromImage(
  fileName: string,
  normalizeValue: (value: number) => number,
): Promise<Region[]> {
  const image = await loadImage(fileName);
  const width = image.width;
  const height = image.height;

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, image.width, image.height).data;
  const pixels = data.reduce((acc, value, index) => {
    const j = index % 4;
    if (j === 0) {
      acc.push(value);
    }
    return acc;
  }, [] as number[]);
  const floodFill = (x: number, y: number, value: number): Point[] => {
    const queue: Point[] = [{ x, y }];
    const points: Point[] = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 1, y: 0 }, // right
      { x: 0, y: 1 }, // down
      { x: -1, y: 0 }, // left
    ];

    while (queue.length > 0) {
      const point = queue.shift();
      if (!point) continue;

      if (point.x < 0 || point.x >= width || point.y < 0 || point.y >= height) {
        continue;
      }
      const i = point.x + point.y * width;
      const newValue = normalizeValue(pixels[i]);
      if (newValue !== value) {
        continue;
      }
      if (points.find((p) => p.x === point.x && p.y === point.y)) continue;
      points.push(point);

      for (const direction of directions) {
        queue.push({ x: point.x + direction.x, y: point.y + direction.y });
      }
    }
    return points;
  };

  const regions: Region[] = [];
  const visited = new Set<string>();
  const nodeSize = 1;
  const canvas2 = createCanvas(width, height);
  const ctx2 = canvas2.getContext("2d");

  for (let i = 0; i < pixels.length; i++) {
    const x = i % width;
    const y = Math.floor(i / height);
    if (!visited.has(`${x},${y}`)) {
      const value = normalizeValue(pixels[i]);

      const points = floodFill(x, y, value);
      console.log(value, points.length);
      ctx2.beginPath();
      ctx2.lineWidth = 1;
      ctx2.fillStyle = `rgba(0,0,0,1)`;
      ctx2.strokeStyle = uniqolor(value, { format: "hex" }).color;

      points.forEach((point) => {
        visited.add(`${point.x},${point.y}`);
        ctx2.rect(point.x * nodeSize, point.y * nodeSize, nodeSize, nodeSize);
      });

      ctx2.stroke();
      points.forEach((point) => {
        ctx2.fillRect(
          point.x * nodeSize,
          point.y * nodeSize,
          nodeSize,
          nodeSize,
        );
      });
    }
  }
  saveImage(TEMP_DIR + "/regions.png", canvas2.toBuffer("image/png"));
  return regions;
}
