import { CONTENT_DIR, TEMP_DIR, TEXTURE_DIR, initDirs } from "./lib/dirs.js";
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
import { IconProps, saveIcon } from "./lib/image.js";
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

// Phoenix/Content/UI/HUD/MiniMap/MiniMapTiles/UI_DT_MinimapCollection_Data.uasset
const MiniMapParametersHogwarts =
  readContentJSON<UI_DT_MiniMapParametersHogwarts>(
    "/Phoenix/Content/UI/HUD/MiniMap/UI_DT_MiniMapParametersHogwarts.json",
  );
const MinimapCollectionData = readContentJSON<UI_DT_MinimapCollection_Data>(
  "/Phoenix/Content/UI/HUD/MiniMap/MiniMapTiles/UI_DT_MinimapCollection_Data.json",
);

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

  const WIDTH = MiniMapParametersHogwarts[0].Properties.Width;
  const HEIGHT = MiniMapParametersHogwarts[0].Properties.Height;
  tiles[mapName] = (
    await generateTiles(
      mapName,
      TEXTURE_DIR +
        `/Phoenix/Content/UI/HUD/MiniMap/MiniMapTiles/Hogwarts/${tile}`,
      WIDTH,
      512,
      [
        MiniMapParametersHogwarts[0].Properties.BottomLeft.X + HEIGHT / 2,
        MiniMapParametersHogwarts[0].Properties.BottomLeft.Y - WIDTH / 2,
      ],
    )
  )[mapName];
}

writeTiles(tiles);

await saveIcon(
  "/Phoenix/Content/UI/Icons/Map/UI_T_PlayerMarker.png",
  "player",
  { rotate: 90 },
);

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
const enUSKeys = Object.keys(enUS);

const EnemyDefinitionNamed =
  readContentJSON<PhoenixGameData_EnemyDefinitionNamed>(
    "/Phoenix/Content/SQLiteDB/PhoenixGameData_EnemyDefinitionNamed.json",
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
writeJSON(TEMP_DIR + "/bottomZValues.json", bottomZValues);
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

const isInHogwarts = ([y, x]: [number, number]) => {
  const bounds = tiles["hogwarts-01"].options!.bounds;
  return (
    x >= bounds[0][1] &&
    x < bounds[1][1] &&
    y >= bounds[0][0] &&
    y < bounds[1][0]
  );
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
  if (isInHogwarts([y, x])) {
    const level = getHogwartsLevel(z);
    enDict[`${location.Name}_desc`] = enDict[level];

    await handleLocation(
      group,
      title,
      location.Name,
      `fastTravel`,
      level,
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

const moreLocations = [
  ...KnowledgeInvestigatable,
  ...KnowledgeLocations,
  ...Locations,
  ...MiscLocations,
  ...SphinxPuzzleLocations,
];
for (const location of moreLocations) {
  const name = "Name" in location ? location.Name : location.LocationID;
  let type;
  let title;
  let iconPath;
  let group;
  let titleGroup;
  const iconProps: IconProps = {};
  if (name.includes("AccioPage")) {
    type = "accioPage";
    title = "Accio Page";
    iconPath =
      "/Phoenix/Content/UI/Icons/Talents/UI_T_Talent_Accio_Mastery.png";
    group = "collectibles";
    titleGroup = "Collectibles";
  } else if (name.includes("GuardianLeviosa")) {
    type = "guardianLeviosa";
    title = "Winguardian Leviosa";
    iconPath = "/Phoenix/Content/UI/Icons/Spells/UI_T_wingardium.png";
    group = "collectibles";
    titleGroup = "Collectibles";
  } else if (name.includes("MothFrame")) {
    type = "mothFrame";
    title = "Moth Frame";
    iconPath =
      "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/cigale_delapouite.webp";
    group = "locations";
    titleGroup = "Locations";
  } else if (name.includes("IncendioDragon")) {
    type = "incendioDragon";
    title = "Incendio";
    iconPath =
      "/Phoenix/Content/UI/Icons/Talents/UI_T_Talent_Incendio_Mastery.png";
    group = "locations";
    titleGroup = "Locations";
  } else if (name.includes("KIO_")) {
    type = "kio";
    title = "Field Guide Page (Revelio)";
    iconPath = "/Phoenix/Content/UI/Icons/Spells/UI_T_revelio.png";
    group = "locations";
    titleGroup = "Locations";
    const key = (name.match(/_HW_(.*)_SUB/) ||
      name.match(/_Hogsmeade_(.*)_X/) ||
      name.match(/_Overland_(.*)_/))?.[1];
    if (!key) {
      console.warn(`Can not find key for ${name}`);
    } else {
      const normalized = key.replaceAll(" ", "");
      const title =
        {
          "KIO_HW_Chizperffles (Wizard Bees)_SUB_GroundsQ_TECH_X=355828 Y=-476907 Z=-86650":
            "LORE_GROUNDS_CHIZPERFLES",
          "KIO_Hogsmeade_Hogs Head_X=380978 Y=-514211 Z=-83431":
            "LORE_HOGSHEAD_MOUNTEDHOG",
          "KIO_Hogsmeade_Gladrags Wizardwear_X=392646 Y=-519484 Z=-82081":
            "LORE_GLADRAGS_SHOP",
          "KIO_Hogsmeade_Tea Shop Decor_X=396292 Y=-517708 Z=-82012":
            "LORE_TEASHOP_DECOR",
          "KIO_Hogsmeade_Honeydukes_X=397138 Y=-518659 Z=-82062":
            "LORE_HONEYDUKES_SHOP",
          "KIO_Hogsmeade_Tomes Staircase_X=385750 Y=-509539 Z=-83484":
            "LORE_TOMESNSCROLLS_STAIRCASE",
          "KIO_Hogsmeade_Dung Bomb_X=389147 Y=-517336 Z=-82557":
            "LORE_ZONKOS_DUNGBOMB",
          "KIO_Hogsmeade_Abandoned Shop_X=386249 Y=-528325 Z=-79494":
            "LORE_OLDFOOL_ABANDONED",
          "KIO_HW_Booby trapped barrels in Cellar_SUB_HufflepuffBasement_TECH_X=363662 Y=-451811 Z=-83698":
            "LORE_HUFFBASEMENT_BARRELS",
          "KIO_HW_Astronomy Telescope_SUB_AstronomyTower_TECH_X=346607 Y=-460685 Z=-74716":
            "LORE_ASTRONOMYTOWER_TELESCOPE",
          "KIO_HW_Bell Tower Plaque_SUB_BellTowers_TECH_X=348755 Y=-470142 Z=-86164":
            "LORE_BELLTOWERS_PLAQUE",
          "KIO_HW_Painting of Sir Cadogan_SUB_ViaductEntrance_TECH_X=356146 Y=-463577 Z=-82775":
            "LORE_VIADUCTS_SIRCADOGAN",
        }[name] ||
        enUSKeys.find(
          (key) => key.startsWith("LORE_") && key.includes(normalized),
        ) ||
        enUSKeys.find(
          (key) =>
            key.startsWith("LORE_") &&
            (name.includes("Central") ? key.includes("Central") : true) &&
            (name.includes("Courtyard") ? key.includes("Courtyard") : true) &&
            name
              .split(" ")
              .filter((word) => word !== "Statue")
              .some((word) => key.includes(word)),
        );
      if (!title) {
        console.warn(`Can not find title for ${name}`);
      } else {
        enDict[name] = enUS[title];
      }
    }
  } else if (name.startsWith("KO_Demiguise")) {
    type = "demiguise";
    title = "Demiguise Statue";
    iconPath = "/Phoenix/Content/UI/Icons/Map/UI_T_DemiguiseStatue.png";
    group = "collectibles";
    titleGroup = "Collectibles";
  } else if (name.startsWith("INT_Kill")) {
    type = "named_enemy";
    title = "Named Enemy";
    iconPath = "/Phoenix/Content/UI/Icons/Map/UI_T_EnemyLevel.png";
    group = "npcs";
    titleGroup = "NPCs";
    const enemy = EnemyDefinitionNamed.find(
      (enemy) => enemy.KilledLockID && name.startsWith(enemy.KilledLockID),
    );
    if (!enemy) {
      throw new Error(`No enemy found for ${name}`);
    }
    enDict[name] = enUS[enemy.RegistryID];
  } else if (name.startsWith("KL_")) {
    type = "enemy";
    title = "Enemy";
    iconPath = "/Phoenix/Content/UI/Icons/MiniMap/UI_T_MiniMap_Enemy.png";
    group = "npcs";
    titleGroup = "NPCs";
    const kind = name.split("_").at(2);
    if (kind) {
      enDict[name] = enUS[kind];
    }
  } else if (name.startsWith("KO_Astronomy")) {
    type = "astronomy";
    title = "Astronomy Altar";
    iconPath = "/Phoenix/Content/UI/Icons/Map/UI_T_Astronomy.png";
    group = "locations";
    titleGroup = "Locations";
  } else if (
    name.includes("SlytherinHouseChest") ||
    name.includes("HufflepuffHouseChest") ||
    name.includes("RavenHouseChest") ||
    name.includes("GryfindorHouseChest")
  ) {
    type = "house_chest";
    title = "House Chest";
    iconPath =
      "/Phoenix/Content/UI/Icons/Transfiguration/Categories/UI_T_Chests.png";
    group = "chests";
    titleGroup = "Chests";
    if (name.includes("SlytherinHouseChest")) {
      enDict[name] = "Slytherin";
    } else if (name.includes("HufflepuffHouseChest")) {
      enDict[name] = "Hufflepuff";
    } else if (name.includes("RavenHouseChest")) {
      enDict[name] = "Ravenclaw";
    } else if (name.includes("GryfindorHouseChest")) {
      enDict[name] = "Gryffindor";
    }
  } else if (name.startsWith("Chest_")) {
    iconPath = "/Phoenix/Content/UI/Icons/Map/UI_T_TreasureChest.png";
    group = "chests";
    titleGroup = "Chests";
    iconProps.circle = true;
    if (name.includes("Disillusionment")) {
      type = "disillusionment";
      title = "Disillusionment Chest";
      iconProps.color = "blue";
    } else if (name.includes("ConjurationsRecipe")) {
      type = "conjurations_recipe";
      title = "Conjurations Recipe Chest";
      iconProps.color = "green";
    } else if (name.includes("LargeGoldSuper")) {
      type = "large_gold_super";
      title = "Large Gold Super Chest";
      iconProps.color = "yellow";
    } else if (name.includes("MediumGear")) {
      type = "medium_gear";
      title = "Medium Gear Chest";
      iconProps.color = "purple";
    } else if (name.includes("Wandskin")) {
      type = "wandskin";
      title = "Wandskin Chest";
      iconProps.color = "orange";
    } else {
      continue;
    }
  } else if (name.startsWith("SphinxPuzzle")) {
    type = "sphinx_puzzle";
    title = "Merlin Trials";
    iconPath = "/Phoenix/Content/UI/Icons/Map/UI_T_SphinxPuzzle.png";
    group = "locations";
    titleGroup = "Locations";
  } else {
    continue;
  }
  const x = location.XPos;
  const y = location.YPos;
  const z = location.ZPos;
  if (isInHogwarts([y, x])) {
    const level = getHogwartsLevel(z);
    enDict[`${name}_desc`] = enDict[level];
    await handleLocation(
      group,
      titleGroup,
      name,
      type,
      level,
      [y, x],
      title,
      iconPath,
      undefined,
      iconProps,
    );
  }
  await handleLocation(
    group,
    titleGroup,
    name,
    type,
    "overland",
    [y, x],
    title,
    iconPath,
    undefined,
    iconProps,
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
  iconProps?: IconProps,
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
    addedIcons.push(await saveIcon(iconPath, iconName, iconProps));
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
    oldNodes = { type: type, mapName, spawns: [], static: true };
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
  if (enUS[id]) {
    enDict[id] = enUS[id];
  }
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

export type PhoenixGameData_EnemyDefinitionNamed = Array<{
  RegistryID: string;
  ObjectClass: string;
  LootDrop: string;
  KilledLockID?: string;
}>;

export type UI_DT_MiniMapParametersHogwarts = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    BottomLeft: {
      X: number;
      Y: number;
    };
    Width: number;
    Height: number;
  };
}>;

export type UI_DT_MinimapCollection_Data = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    StateId: string;
    ScalarParameters: Array<{
      DefaultValue: number;
      ParameterName: string;
      Id: string;
    }>;
  };
}>;
