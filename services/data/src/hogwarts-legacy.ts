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
enDict["overland"] = "Overland";
for (const tile of readDirSync(
  TEXTURE_DIR + "/Phoenix/Content/UI/HUD/MiniMap/MiniMapTiles/Hogwarts",
)) {
  const level = tile.split("_").at(-2);
  if (level === "Base") {
    continue;
  }
  const mapName = `hogwarts-${level}`;
  enDict[mapName] = `Hogwarts Level ${level}`;
  tiles[mapName] = (
    await generateTiles(
      mapName,
      TEXTURE_DIR +
        `/Phoenix/Content/UI/HUD/MiniMap/MiniMapTiles/Hogwarts/${tile}`,
      815000,
      512,
      [404000, -302000],
    )
  )[mapName];
}

writeTiles(tiles);

const FastTravelLocations =
  readContentJSON<PhoenixGameData_FastTravelLocations>(
    "/Phoenix/Content/SQLiteDB/PhoenixGameData_FastTravelLocations.json",
  );
const HogwartsMapIconTable =
  readContentJSON<PhoenixGameData_HogwartsMapIconTable>(
    "/Phoenix/Content/SQLiteDB/PhoenixGameData_HogwartsMapIconTable.json",
  );
const KnowledgeInvestigatable =
  readContentJSON<PhoenixGameData_KnowledgeInvestigatable>(
    "/Phoenix/Content/SQLiteDB/PhoenixGameData_KnowledgeInvestigatable.json",
  );
const KnowledgeLocations = readContentJSON<PhoenixGameData_KnowledgeLocations>(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_KnowledgeLocations.json",
);
const Locations = readContentJSON<PhoenixGameData_Locations>(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_Locations.json",
);
const MiscLocations = readContentJSON<PhoenixGameData_MiscLocations>(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_MiscLocations.json",
);
const SphinxPuzzleLocations =
  readContentJSON<PhoenixGameData_SphinxPuzzleLocations>(
    "/Phoenix/Content/SQLiteDB/PhoenixGameData_SphinxPuzzleLocations.json",
  );
const enUS = readContentJSON<Record<string, string>>(
  "/Phoenix/Content/Localization/WIN64/MAIN-enUS.json",
);

const MiniMapNHogwartsLevelData =
  readContentJSON<UI_DT_MiniMapNHogwartsLevelData>(
    "/Phoenix/Content/UI/Map/UI_DT_MiniMapNHogwartsLevelData.json",
  );
const bottomZValues = Object.entries(MiniMapNHogwartsLevelData[0].Rows).reduce(
  (acc, [key, value]) => {
    acc[key] = value.BottomZValue;
    return acc;
  },
  {} as {
    [level: string]: number;
  },
);
const getLevelByZ = (z: number) => {
  const entry = Object.entries(bottomZValues).find(([level, bottomZ]) => {
    if (bottomZ > z) {
      return false;
    }
    const nextLevel = bottomZValues[(+level + 1).toString()];
    if (nextLevel && nextLevel <= z) {
      return false;
    }
    return true;
  });
  if (entry) {
    return +entry[0];
  }
  return 1;
};
const pad = (value: number) => `0${Math.floor(value)}`.slice(-2);
const getHogwartsLevel = (z: number) => {
  const level = getLevelByZ(z);
  const padLevel = pad(level);
  return `hogwarts-${padLevel}`;
};

const hogwartsFastTravelLocations = FastTravelLocations.filter(
  (location) => location.ShowOnMap,
);

for (const location of hogwartsFastTravelLocations) {
  const mapIcon = HogwartsMapIconTable.find(
    (icon) => icon.Name.toLowerCase() === location.Name.toLowerCase(),
  );
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
  const group = "locations";
  const title = "Locations";
  const iconPath = `/Phoenix/Content/UI/Icons/Map/${mapIcon?.IconName || "UI_T_Fireplaces"}.png`;

  const extension = mapIcon ? mapIcon.IconName.split("_").at(-1) : "Fireplaces";
  if (location.Name.startsWith("FT_HW_")) {
    await handleLocation(
      group,
      title,
      location.Name,
      `fastTravel`,
      getHogwartsLevel(z),
      [y, x],
      "Fast Travel Fireplace",
      iconPath,
      extension === "Fireplaces" ? undefined : extension,
    );
  }
  // else if (location.Name.startsWith("FT_OL")) {
  //   world = "overland";
  // } else if (location.Name.startsWith("FT_Hogsmeade")) {
  //   world = "hogsmeade";
  // } else {
  //   throw new Error(`Unknown world for ${location.Name}`);
  // }

  await handleLocation(
    group,
    title,
    location.Name,
    `fastTravel`,
    "overland",
    [y, x],
    "Fast Travel Fireplace",
    iconPath,
    extension === "Fireplaces" ? undefined : extension,
  );
}

const moreLocations = [...KnowledgeInvestigatable, ...KnowledgeLocations];
for (const location of moreLocations) {
  let type;
  let title;
  let iconPath;
  let group;
  let titleGroup;
  if (location.Name.includes("AccioPage")) {
    type = "accioPage";
    title = "Accio Page";
    iconPath =
      "/Phoenix/Content/UI/Icons/Talents/UI_T_Talent_Accio_Mastery.png";
    group = "collectibles";
    titleGroup = "Collectibles";
  } else if (location.Name.includes("GuardianLeviosa")) {
    type = "guardianLeviosa";
    title = "Winguardian Leviosa";
    iconPath = "/Phoenix/Content/UI/Icons/Spells/UI_T_wingardium.png";
    group = "collectibles";
    titleGroup = "Collectibles";
  } else if (location.Name.includes("MothFrame")) {
    type = "mothFrame";
    title = "Moth Frame";
    iconPath =
      "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/cigale_delapouite.webp";
    group = "locations";
    titleGroup = "Locations";
  } else if (location.Name.startsWith("KO_Demiguise")) {
    type = "demiguise";
    title = "Demiguise Statue";
    iconPath = "/Phoenix/Content/UI/Icons/Map/UI_T_DemiguiseStatue.png";
    group = "collectibles";
    titleGroup = "Collectibles";
  } else {
    continue;
  }
  const x = location.XPos;
  const y = location.YPos;
  const z = location.ZPos;
  if (location.Name.includes("_HW_")) {
    await handleLocation(
      group,
      titleGroup,
      location.Name,
      type,
      getHogwartsLevel(z),
      [y, x],
      title,
      iconPath,
    );
  }
  await handleLocation(
    group,
    titleGroup,
    location.Name,
    type,
    "overland",
    [y, x],
    title,
    iconPath,
  );

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
}

writeNodes(nodes);
writeFilters(filters);
writeTypesIDs(typesIDs);
writeDict(enDict, "en");

async function handleLocation(
  group: string,
  title: string,
  id: string,
  type: string,
  mapName: string,
  pos: [number, number],
  text: string,
  iconPath: string,
  overrideIconName?: string,
) {
  if (!filters.find((f) => f.group === group)) {
    filters.push({
      group: group,
      defaultOpen: true,
      defaultOn: true,
      values: [],
    });
    enDict[group] = title;
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

export type PhoenixGameData_HogwartsMapIconTable = Array<{
  Name: string;
  OverrideLocationX: number;
  OverrideLocationY: number;
  OverrideLocationZ: number;
  IconName: string;
  Type: string;
  Region: string;
  ShowOnRegionTier: number;
}>;

type PhoenixGameData_FastTravelLocations = Array<{
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

export type PhoenixGameData_KnowledgeInvestigatable = Array<{
  Name: string;
  XPos: number;
  YPos: number;
  ZPos: number;
  ZRot: number;
}>;

export type PhoenixGameData_KnowledgeLocations = Array<{
  Name: string;
  XPos: number;
  YPos: number;
  ZPos: number;
  ZRot: number;
}>;

export type PhoenixGameData_MiscLocations = Array<{
  Name: string;
  XPos: number;
  YPos: number;
  ZPos: number;
  ZRot: number;
  Owner: any;
}>;

export type UI_DT_MiniMapNHogwartsLevelData = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: {
    "1": {
      BottomZValue: number;
    };
    "2": {
      BottomZValue: number;
    };
    "3": {
      BottomZValue: number;
    };
    "4": {
      BottomZValue: number;
    };
    "5": {
      BottomZValue: number;
    };
    "6": {
      BottomZValue: number;
    };
    "7": {
      BottomZValue: number;
    };
    "8": {
      BottomZValue: number;
    };
    "9": {
      BottomZValue: number;
    };
    "10": {
      BottomZValue: number;
    };
    "11": {
      BottomZValue: number;
    };
    "12": {
      BottomZValue: number;
    };
    "13": {
      BottomZValue: number;
    };
    "14": {
      BottomZValue: number;
    };
    "15": {
      BottomZValue: number;
    };
    "16": {
      BottomZValue: number;
    };
    "17": {
      BottomZValue: number;
    };
    "18": {
      BottomZValue: number;
    };
    "19": {
      BottomZValue: number;
    };
    "20": {
      BottomZValue: number;
    };
    "21": {
      BottomZValue: number;
    };
    "22": {
      BottomZValue: number;
    };
    "23": {
      BottomZValue: number;
    };
    "24": {
      BottomZValue: number;
    };
    "25": {
      BottomZValue: number;
    };
    "26": {
      BottomZValue: number;
    };
    "27": {
      BottomZValue: number;
    };
    "28": {
      BottomZValue: number;
    };
    "29": {
      BottomZValue: number;
    };
    "30": {
      BottomZValue: number;
    };
    "31": {
      BottomZValue: number;
    };
    "32": {
      BottomZValue: number;
    };
    "33": {
      BottomZValue: number;
    };
    "34": {
      BottomZValue: number;
    };
    "35": {
      BottomZValue: number;
    };
    "36": {
      BottomZValue: number;
    };
    "37": {
      BottomZValue: number;
    };
    "38": {
      BottomZValue: number;
    };
    "39": {
      BottomZValue: number;
    };
    "40": {
      BottomZValue: number;
    };
    "41": {
      BottomZValue: number;
    };
    "42": {
      BottomZValue: number;
    };
    "43": {
      BottomZValue: number;
    };
    "44": {
      BottomZValue: number;
    };
  };
}>;

export type PhoenixGameData_Locations = Array<{
  LocationID: string;
  XPos: number;
  YPos: number;
  ZPos: number;
  ZRot: number;
  WorldID?: string;
  TypeID: string;
  ParentLocationID?: string;
  VolumeOriginX?: number;
  VolumeOriginY?: number;
  VolumeOriginZ?: number;
  VolumeExtentX?: number;
  VolumeExtentY?: number;
  VolumeExtentZ?: number;
  VolumeRotX?: number;
  VolumeRotY?: number;
  VolumeRotZ?: number;
  HouseAndGender?: number;
  DEV_TimeStamp?: string;
}>;

export type PhoenixGameData_SphinxPuzzleLocations = Array<{
  Name: string;
  XPos: number;
  YPos: number;
  ZPos: number;
  ZRot: number;
}>;
