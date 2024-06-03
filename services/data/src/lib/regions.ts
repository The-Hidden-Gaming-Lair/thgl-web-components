import { Region } from "../types.js";
import { OUTPUT_DIR } from "./dirs.js";
import { writeJSON } from "./fs.js";

export function initRegions(seed?: Region[]): Region[] {
  return seed ?? [];
}

export function writeRegions(regions: Region[]) {
  writeJSON(OUTPUT_DIR + "/coordinates/regions.json", regions);
}
