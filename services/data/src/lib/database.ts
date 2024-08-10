import { Database, Group } from "../types.js";
import { OUTPUT_DIR } from "./dirs.js";
import { writeJSON } from "./fs.js";

export function initDatabase(seed?: Database): Database {
  return seed ?? [];
}

export function writeDatabase(nodes: Database) {
  writeJSON(OUTPUT_DIR + "/data/database.json", nodes);
}

export function initGroups(seed?: Group[]): Group[] {
  return seed ?? [];
}

export function writeGroups(groups: Group[]) {
  writeJSON(OUTPUT_DIR + "/data/groups.json", groups);
}
