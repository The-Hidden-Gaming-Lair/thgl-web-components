import { Filter } from "../types.js";
import { OUTPUT_DIR } from "./dirs.js";
import { writeJSON } from "./fs.js";

export function initFilters(seed?: Filter[]): Filter[] {
  return seed ?? [];
}

export function writeFilters(filters: Filter[]) {
  writeJSON(OUTPUT_DIR + "/coordinates/filters.json", filters);
}
