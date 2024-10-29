import { TypesIds } from "../types.js";
import { OUTPUT_DIR } from "./dirs.js";
import { writeJSON } from "./fs.js";

let typeIDs: TypesIds = {};
export function initTypesIDs(seed?: TypesIds): TypesIds {
  typeIDs = seed ?? {};
  return typeIDs;
}

export function writeTypesIDs(targetTypeIds?: TypesIds) {
  writeJSON(
    OUTPUT_DIR + "/coordinates/types_id_map.json",
    targetTypeIds ?? typeIDs,
  );
}

export function setTypeId(typeId: string, type: string) {
  if (typeIDs[typeId] && typeIDs[typeId] !== type) {
    // console.warn(
    //   `Type ID already exists for ${typeId}. ${typeIDs[typeId]} !== ${type}`,
    // );
  }
  typeIDs[typeId] = type;
}

export function getTypeId(typeId: string): string | undefined {
  return typeIDs[typeId];
}

export function includesTypeId(type: string): boolean {
  return Object.values(typeIDs).includes(type);
}
