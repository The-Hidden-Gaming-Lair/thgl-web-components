import { CONTENT_DIR, TEXTURE_DIR, initDirs } from "./lib/dirs.js";
import { sqliteToJSON } from "./lib/db.js";
import {
  readContentJSON,
  readDirRecursive,
  readDirSync,
  writeJSON,
} from "./lib/fs.js";
import { decodeAvaf } from "./lib/avafdict.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { initFilters, writeFilters } from "./lib/filters.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";

initDirs(
  "/mnt/c/dev/Hogwarts Legacy/Extracted/Data",
  "/mnt/c/dev/Hogwarts Legacy/Extracted/Texture",
  "/home/devleon/the-hidden-gaming-lair/static/hogwarts-legacy",
);

const nodes = initNodes();
const filters = initFilters();
const typesIDs = initTypesIDs();

if (Bun.env.DB === "true") {
  readDirSync(CONTENT_DIR + "/Phoenix/Content/Localization/WIN64").forEach(
    (file) => {
      if (file.endsWith(".bin")) {
        const dict = decodeAvaf(
          CONTENT_DIR + "/Phoenix/Content/Localization/WIN64/" + file,
        );
        writeJSON(
          CONTENT_DIR +
            "/Phoenix/Content/Localization/WIN64/" +
            file.replace(".bin", ".json"),
          dict,
        );
      }
    },
  );
  sqliteToJSON("/Phoenix/Content/SQLiteDB");
}

if (Bun.env.TILES === "true") {
  const tiles = initTiles(
    await generateTiles(
      "overland",
      TEXTURE_DIR +
        "/Phoenix/Content/UI/HUD/MiniMap/MiniMapTiles/Overland/UI_T_MiniMap_Overland_8192_D.png",
      44100,
      512,
    ),
  );

  writeTiles(tiles);
}

const FastTravelLocations = readContentJSON<FastTravelLocations>(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_FastTravelLocations.json",
);
const HogwartsMapIconTable = readContentJSON<HogwartsMapIconTable>(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_HogwartsMapIconTable.json",
);
const KnowledgeInvestigatable = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_KnowledgeInvestigatable.json",
);
const KnowledgeLocations = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_KnowledgeLocations.json",
);
const Locations = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_Locations.json",
);
const MiscLocations = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_MiscLocations.json",
);
const SphinxPuzzleLocations = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_SphinxPuzzleLocations.json",
);
const enDict = readContentJSON(
  "/Phoenix/Content/Localization/WIN64/MAIN-enUS.json",
);

const hogwartsFastTravelLocations = FastTravelLocations.filter(
  (location) => location.ShowOnMap,
);

for (const location of hogwartsFastTravelLocations) {
  const mapIcon = HogwartsMapIconTable.find(
    (icon) => icon.Name.toLowerCase() === location.Name.toLowerCase(),
  );
  const extension = mapIcon ? mapIcon.IconName.split("_").at(-1) : "Fireplaces";
  let world;
  if (location.Name.startsWith("FT_HW_")) {
    world = "hogwarts";
  } else if (location.Name.startsWith("FT_OL")) {
    world = "overland";
  } else if (location.Name.startsWith("FT_Hogsmeade")) {
    world = "hogsmeade";
  } else {
    throw new Error(`Unknown world for ${location.Name}`);
  }
  const x =
    mapIcon?.OverrideLocationX ||
    location.BeaconLocationX ||
    location.LocationX;
  const y =
    mapIcon?.OverrideLocationY ||
    location.BeaconLocationY ||
    location.LocationY;
  const z =
    mapIcon?.OverrideLocationZ ||
    location.BeaconLocationZ ||
    location.LocationZ;

  handleLocation(location.Name, `fastTravel${extension}`, world, [x, y]);
}

writeNodes(nodes);
writeFilters(filters);
writeTypesIDs(typesIDs);

function handleLocation(
  id: string,
  type: string,
  mapName: string,
  pos: [number, number],
) {
  let oldNodes = nodes.find((n) => n.type === type);
  if (!oldNodes) {
    oldNodes = { type: type, spawns: [] };
    nodes.push(oldNodes);
    oldNodes = nodes.find((n) => n.type === type)!;
  }

  if (
    oldNodes.spawns.some(
      (s) => s.p[0] === pos[0] && s.p[1] === pos[1] && s.mapName === mapName,
    )
  ) {
    return;
  }
  oldNodes.spawns.push({
    id,
    p: pos,
    mapName,
  });
}

export type HogwartsMapIconTable = Array<{
  Name: string;
  OverrideLocationX: number;
  OverrideLocationY: number;
  OverrideLocationZ: number;
  IconName: string;
  Type: string;
  Region: string;
  ShowOnRegionTier: number;
}>;

type FastTravelLocations = Array<{
  Name: string;
  Available: any;
  LocationX: number;
  LocationY: number;
  LocationZ: number;
  WorldName: string;
  IsSaveLocation: number;
  IsFloo: number;
  ZRot: number;
  IsBuiltNightly: number;
  ShowOnMap: number;
  BeaconLocationX: number;
  BeaconLocationY: number;
  BeaconLocationZ: number;
}>;
