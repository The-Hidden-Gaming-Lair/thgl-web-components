import { Filter, GlobalFilter } from "../types.js";
import { OUTPUT_DIR } from "./dirs.js";
import { writeJSON } from "./fs.js";
import { ImageSprite } from "./image.js";

export function initFilters(seed?: Filter[]): Filter[] {
  return seed ?? [];
}

export function writeFilters(filters: Filter[]) {
  writeJSON(OUTPUT_DIR + "/coordinates/filters.json", filters);
}

export function initGlobalFilters(seed?: GlobalFilter[]): GlobalFilter[] {
  return seed ?? [];
}

export function writeGlobalFilters(globalFilters: GlobalFilter[]) {
  writeJSON(OUTPUT_DIR + "/coordinates/global-filters.json", globalFilters);
}

export function mergeFiltersImageSprite(
  filters: Filter[],
  imageSprite: ImageSprite,
  name = "icons.webp",
) {
  for (const filter of filters) {
    for (const value of filter.values) {
      if (typeof value.icon === "string") {
        continue;
      }
      const url = value.icon.url;
      const icon = imageSprite.find((i) => i.name === url);
      if (!icon) {
        continue;
      }
      value.icon.url = name;
      value.icon.height = icon.height;
      value.icon.width = icon.width;
      value.icon.x = icon.x;
      value.icon.y = icon.y;
    }
  }
}
