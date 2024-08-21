import { initDict, writeDict } from "./lib/dicts.js";
import { initDirs } from "./lib/dirs.js";
import {
  initFilters,
  initGlobalFilters,
  writeFilters,
  writeGlobalFilters,
} from "./lib/filters.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import { initTiles, writeTiles } from "./lib/tiles.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";

initDirs(
  "/mnt/c/dev/Black Myth Wukon/Extracted/Data",
  "/mnt/c/dev/Black Myth Wukon/Extracted/Texture",
  import.meta.dir + "/../../../static/black-myth-wukong",
);

const nodes = initNodes();
const filters = initFilters();
const typesIDs = initTypesIDs();
const enDict = initDict();
const tiles = initTiles();
const regions = initRegions();
const globalFilters = initGlobalFilters();

writeNodes(nodes);
writeFilters(filters);
writeTypesIDs(typesIDs);
writeDict(enDict, "en");
writeTiles(tiles);
writeRegions(regions);
writeGlobalFilters(globalFilters);
