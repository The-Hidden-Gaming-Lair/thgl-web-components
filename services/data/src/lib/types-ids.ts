import { TypesIds } from "../types.js";
import { OUTPUT_DIR } from "./dirs.js";
import { writeJSON } from "./fs.js";

export function initTypesIDs(seed?: TypesIds): TypesIds {
  return seed ?? {};
}

export function writeTypesIDs(typesIDs: TypesIds) {
  writeJSON(OUTPUT_DIR + "/coordinates/types_id_map.json", typesIDs);
}
