import { Dict } from "../types.js";
import { OUTPUT_DIR } from "./dirs.js";
import { writeJSON } from "./fs.js";

export function initDict(seed?: Dict): Dict {
  return seed ?? {};
}

export function writeDict(dict: Dict, lang: string) {
  writeJSON(OUTPUT_DIR + `/dicts/${lang}.json`, dict);
}
