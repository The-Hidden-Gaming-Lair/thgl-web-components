import { Node } from "../types.js";
import { CONTENT_DIR, OUTPUT_DIR } from "./dirs.js";
import { readDirRecursive, readJSON, writeJSON } from "./fs.js";

export function initNodes(seed?: Node[]): Node[] {
  return seed ?? [];
}

export function writeNodes(nodes: Node[]) {
  writeJSON(OUTPUT_DIR + "/coordinates/nodes.json", nodes);
}

export async function readActors(
  dir: string,
  onActor: (item: any, data: any) => void,
) {
  const files = await readDirRecursive(CONTENT_DIR + dir);
  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }
    const data = readJSON<any[]>(file);
    for (const item of data) {
      if (!item.Properties?.RelativeLocation) {
        continue;
      }
      if (!item.Outer.startsWith("BP_")) {
        continue;
      }
      onActor(item, data);
    }
  }
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function normalizeLocation(
  location: { x: number; y: number },
  {
    OFFSET_X,
    OFFSET_Y,
    CAMERA_ANGLE,
  }: { OFFSET_X: number; OFFSET_Y: number; CAMERA_ANGLE: number },
): { x: number; y: number } {
  const x = location.x - OFFSET_X;
  const y = location.y - OFFSET_Y;
  const angle = toRadians(-CAMERA_ANGLE);
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  const newX = x * cosAngle - y * sinAngle;
  const newY = x * sinAngle + y * cosAngle;
  return { x: newX, y: newY };
}

export function calculateDistance(c1: [number, number], c2: [number, number]) {
  const dx = c1[0] - c2[0];
  const dy = c1[1] - c2[1];
  return Math.sqrt(dx * dx + dy * dy);
}
