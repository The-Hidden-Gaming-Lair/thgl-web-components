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
import { initDict, writeDict } from "./lib/dicts.js";
import { saveIcon } from "./lib/image.js";
import { Node } from "./types.js";

initDirs(
  "/mnt/c/dev/Hogwarts Legacy/Extracted/Data",
  "/mnt/c/dev/Hogwarts Legacy/Extracted/Texture",
  "/home/devleon/the-hidden-gaming-lair/static/hogwarts-legacy",
);

const nodes = initNodes();
const filters = initFilters();
const typesIDs = initTypesIDs();
const enDict = initDict();
const addedFilterIDs: string[] = [];
const addedIcons: string[] = [];

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

const tiles = initTiles(
  await generateTiles(
    "overland",
    TEXTURE_DIR +
      "/Phoenix/Content/UI/HUD/MiniMap/MiniMapTiles/Overland/UI_T_MiniMap_Overland_8192_D.png",
    815000,
    512,
    [404000, -302000],
  ),
);

writeTiles(tiles);

const FastTravelLocations = readContentJSON<FastTravelLocations>(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_FastTravelLocations.json",
);
const HogwartsMapIconTable = readContentJSON<HogwartsMapIconTable>(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_HogwartsMapIconTable.json",
);
const KnowledgeInvestigatable = readContentJSON<KnowledgeInvestigatable>(
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
const enUS = readContentJSON<Record<string, string>>(
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
  let world = "overland";
  // if (location.Name.startsWith("FT_HW_")) {
  //   world = "hogwarts";
  // } else if (location.Name.startsWith("FT_OL")) {
  //   world = "overland";
  // } else if (location.Name.startsWith("FT_Hogsmeade")) {
  //   world = "hogsmeade";
  // } else {
  //   throw new Error(`Unknown world for ${location.Name}`);
  // }
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

  const iconPath = `/Phoenix/Content/UI/Icons/Map/${mapIcon?.IconName || "UI_T_Fireplaces"}.png`;
  await handleLocation(
    location.Name,
    `fastTravel`,
    world,
    [y, x],
    "Fast Travel Fireplace",
    iconPath,
    extension === "Fireplaces" ? undefined : extension,
  );
}

const accioPages = KnowledgeInvestigatable.filter((location) =>
  location.Name.includes("AccioPage"),
);
for (const location of accioPages) {
  let world = "overland";
  // if (location.Name.includes("_HW_")) {
  //   world = "hogwarts";
  // } else if (location.Name.includes("_Overland_")) {
  //   world = "overland";
  // } else if (
  //   location.Name.includes("_HM_") ||
  //   location.Name.includes("_Hogsmeade")
  // ) {
  //   world = "hogsmeade";
  // } else {
  //   world = "overland";
  // }
  const x = location.XPos;
  const y = location.YPos;
  const z = location.ZPos;
  const iconPath =
    "/Phoenix/Content/UI/Icons/Talents/UI_T_Talent_Accio_Mastery.png";
  await handleLocation(
    location.Name,
    `accioPage`,
    world,
    [y, x],
    "Accio Page",
    iconPath,
  );
}

writeNodes(nodes);
writeFilters(filters);
writeTypesIDs(typesIDs);
writeDict(enDict, "en");

async function handleLocation(
  id: string,
  type: string,
  mapName: string,
  pos: [number, number],
  text: string,
  iconPath: string,
  overrideIconName?: string,
) {
  const group = "locations";
  if (!filters.find((f) => f.group === group)) {
    filters.push({
      group: group,
      defaultOpen: true,
      defaultOn: true,
      values: [],
    });
    enDict[group] = "Locations";
  }
  const iconName = overrideIconName ?? type;
  if (!addedIcons.includes(iconPath)) {
    addedIcons.push(await saveIcon(iconPath, iconName));
  }

  const category = filters.find((f) => f.group === group)!;
  if (!addedFilterIDs.includes(type)) {
    category.values.push({
      id: type,
      icon: `${iconName}.webp`,
      size: 1.3,
    });
    addedFilterIDs.push(type);

    enDict[type] = text;
  }

  let oldNodes = nodes.find((n) => n.type === type && n.mapName === mapName);
  if (!oldNodes) {
    oldNodes = { type: type, mapName, spawns: [] };
    nodes.push(oldNodes);
    oldNodes = nodes.find((n) => n.type === type && n.mapName === mapName)!;
  }

  if (oldNodes.spawns.some((s) => s.p[0] === pos[0] && s.p[1] === pos[1])) {
    return;
  }
  const spawn: Node["spawns"][number] = {
    id,
    p: pos,
  };
  enDict[id] = enUS[id];
  if (overrideIconName) {
    spawn.icon = {
      name: iconName,
      url: `${iconName}.webp`,
    };
  }
  oldNodes.spawns.push(spawn);
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

export type KnowledgeInvestigatable = Array<{
  Name: string;
  XPos: number;
  YPos: number;
  ZPos: number;
  ZRot: number;
}>;
