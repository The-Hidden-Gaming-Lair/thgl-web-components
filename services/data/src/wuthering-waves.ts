import { sqliteToJSONWithModels } from "./lib/db.js";
import { initDict, writeDict } from "./lib/dicts.js";
import { CONTENT_DIR, TEMP_DIR, TEXTURE_DIR, initDirs } from "./lib/dirs.js";
import {
  initFilters,
  initGlobalFilters,
  writeFilters,
  writeGlobalFilters,
} from "./lib/filters.js";
import { readDirSync, readJSON, saveImage } from "./lib/fs.js";
import { extractCanvasFromSprite, mergeImages, saveIcon } from "./lib/image.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";
import { capitalizeWords, formatTimer, toCamelCase } from "./lib/utils.js";
import { Node } from "./types.js";
import {
  DBDrop,
  DBEntityOwnerData,
  DBHandbook,
  DBItems,
  DBLevelPlayData,
  DBLevelPlayNodeData,
  DBMapMark,
  DBModelConfigPreload,
  DBPhantom,
  DBQuestData,
  DBQuestNodeData,
  DBTemplate,
  DTModelConfig,
  MonsterInfo,
  WorldMapIconSprite,
} from "./wuthering-waves.types.js";

initDirs(
  String.raw`C:\dev\WutheringWaves\Extracted_Pre_Download\Data`,
  String.raw`C:\dev\WutheringWaves\Extracted_Pre_Download\Texture`,
  String.raw`C:\dev\the-hidden-gaming-lair\static\wuthering-waves`,
);

const nodes = initNodes();
const filters = initFilters();
const globalFilters = initGlobalFilters();
const regions = initRegions();
const typesIDs = initTypesIDs();

const enDict = initDict({
  AkiWorld_WP: "Overworld",
  WP_HHA_Underground: "Tethys' Deep",
  events: "Temporary Events",
  gameplay: "Waveplate Activities",
  locations: "Locations",
  others: "Others",
});

const ORTHOGRAPHIC_WIDTH_WORLD = 1360000;
const TILE_SIZE = 512;
const multipleWorld = ORTHOGRAPHIC_WIDTH_WORLD / TILE_SIZE;
const WORLD = {
  id: "AkiWorld_WP",
  ORTHOGRAPHIC_WIDTH: ORTHOGRAPHIC_WIDTH_WORLD,
  OFFSET_X: 96 * multipleWorld,
  OFFSET_Y: 96 * multipleWorld,
  CAMERA_ANGLE: 0,
};
const BIG_WORLD_MAP_ID = 8;
const ORTHOGRAPHIC_WIDTH_UNDERGROUND = 1360000 / 2;

const multipleUnderground = ORTHOGRAPHIC_WIDTH_UNDERGROUND / TILE_SIZE;
const UNDERGROUND = {
  id: "WP_HHA_Underground",
  ORTHOGRAPHIC_WIDTH: ORTHOGRAPHIC_WIDTH_UNDERGROUND,
  OFFSET_X: 64 * multipleUnderground,
  OFFSET_Y: 128 * multipleUnderground,
  CAMERA_ANGLE: 0,
};
const UNDERGROUND_MAP_ID = 900;

if (Bun.argv.includes("--db")) {
  sqliteToJSONWithModels(
    "/Client/Content/Aki/ConfigDB",
    "/Client/Content/Aki/JavaScript",
  );
}

if (Bun.argv.includes("--tiles")) {
  const mainMapTiles = await readDirSync(
    TEXTURE_DIR +
      "/Client/Content/Aki/UI/UIResources/UiWorldMap/Image/MapTiles",
  )
    .filter((f) => f.endsWith(".png"))
    .map(
      (f) =>
        TEXTURE_DIR +
        "/Client/Content/Aki/UI/UIResources/UiWorldMap/Image/MapTiles/" +
        f,
    );
  const mainMap = await mergeImages(
    mainMapTiles,
    /_(-?\d+)_(-?\d+)/,
    "#052736",
  );
  saveImage(TEMP_DIR + "/main.png", mainMap.toBuffer("image/png"));

  const hhaTiles = await readDirSync(
    TEXTURE_DIR +
      "/Client/Content/Aki/UI/UIResources/UiWorldMap/Image/HHATiles",
  )
    .filter((f) => f.endsWith(".png"))
    .map(
      (f) =>
        TEXTURE_DIR +
        "/Client/Content/Aki/UI/UIResources/UiWorldMap/Image/HHATiles/" +
        f,
    );
  const hhaMap = await mergeImages(hhaTiles, /_(-?\d+)_(-?\d+)/, "#112a37");
  saveImage(TEMP_DIR + "/hha.png", hhaMap.toBuffer("image/png"));
}

const tiles = initTiles(
  await generateTiles(
    WORLD.id,
    TEMP_DIR + "/main.png",
    WORLD.ORTHOGRAPHIC_WIDTH,
    TILE_SIZE,
    [WORLD.OFFSET_X, WORLD.OFFSET_Y],
    [
      [0, -150000],
      [200000, 50000],
    ],
    [
      [0, 0],
      [510000, 595000],
    ],
  ),
);
tiles[UNDERGROUND.id] = (
  await generateTiles(
    UNDERGROUND.id,
    TEMP_DIR + "/hha.png",
    UNDERGROUND.ORTHOGRAPHIC_WIDTH,
    TILE_SIZE,
    [UNDERGROUND.OFFSET_X, UNDERGROUND.OFFSET_Y],
    [
      [-51446, -83889],
      [141463, 77964],
    ],
    [
      [-100, -100],
      [100, 100],
    ],
  )
)[UNDERGROUND.id];

writeTiles(tiles);
if (tiles[UNDERGROUND.id]) {
  process.exit(0);
}

const monsterInfo = await readJSON<MonsterInfo>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_monster_Info.json",
);
const { MultiText } = await readJSON<{
  MultiText: Array<{
    Id: string;
    Content: string;
  }>;
}>(CONTENT_DIR + "/Client/Content/Aki/ConfigDB/en/lang_multi_text.json");
const { levelentityconfig } = await readJSON<{
  levelentityconfig: Array<{
    Id: number;
    MapId: number;
    EntityId: number;
    BlueprintType: string;
    data: {
      Id: number;
      MapId: number;
      EntityId: number;
      BlueprintType: string;
      Name: string;
      InSleep: boolean;
      IsHidden: boolean;
      AreaId: number;
      Transform: Array<{
        X: number;
        Y: number;
        Z: number;
      }>;
      ComponentsData: any;
    };
  }>;
}>(CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_level_entity.json");
const dbMapMark = await readJSON<DBMapMark>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_map_mark.json",
);
const dbTemplate = await readJSON<DBTemplate>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_template.json",
);
const dbDrop = await readJSON<DBDrop>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_drop.json",
);
const dbItems = await readJSON<DBItems>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_item.json",
);
const dbLevelPlayData = await readJSON<DBLevelPlayData>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_LevelPlayData.json",
);
const dbLevelPlayNodeData = await readJSON<DBLevelPlayNodeData>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_LevelPlayNodeData.json",
);
const worldMapIconSprite = await readJSON<WorldMapIconSprite>(
  CONTENT_DIR +
    "/Client/Content/Aki/UI/UIResources/Common/Atlas/WorldMapIcon/TPI_Common_WorldMapIcon.json",
);
const dbPhantom = await readJSON<DBPhantom>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_phantom.json",
);
const dbQuestNodeData = await readJSON<DBQuestNodeData>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_QuestNodeData.json",
);
const dbEntityOwnerData = await readJSON<DBEntityOwnerData>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_EntityOwnerData.json",
);
const dbQuestData = await readJSON<DBQuestData>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_QuestData.json",
);
const dbHandbook = await readJSON<DBHandbook>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_handbook.json",
);
const dtModelConfig = await readJSON<DTModelConfig>(
  CONTENT_DIR + "/Client/Content/Aki/Data/Entity/CDT_ModelConfig.json",
);
const dbModelConfigPreload = await readJSON<DBModelConfigPreload>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_model_config_preload.json",
);

const workMapIconPath =
  TEXTURE_DIR +
  "/" +
  worldMapIconSprite[0].Properties.AtlasTextures[0].ObjectPath.split(".")[0] +
  ".png";

for (const mapMark of dbMapMark.mapmark) {
  if (
    mapMark.data.MapId !== BIG_WORLD_MAP_ID &&
    mapMark.data.MapId !== UNDERGROUND_MAP_ID
  ) {
    continue;
  }
  const mapName =
    mapMark.data.MapId === BIG_WORLD_MAP_ID ? WORLD.id : UNDERGROUND.id;
  // if (mapMark.data.MapShow !== 2) {
  //   continue;
  // }

  const id = mapMark.data.MarkId.toString();

  if (mapMark.data.ObjectType === 1) {
    if (mapMark.data.ShowRange[0] !== -9999) {
      continue;
    }
    const border: [number, number][] = [];

    const center = [mapMark.data.MarkVector.Y, mapMark.data.MarkVector.X] as [
      number,
      number,
    ];

    enDict[id] =
      MultiText.find((m) => m.Id === mapMark.data.MarkTitle)?.Content ?? id;
    if (mapMark.data.MarkDesc) {
      enDict[id + "_desc"] =
        MultiText.find((m) => m.Id === mapMark.data.MarkDesc)?.Content ?? id;
    }

    regions.push({
      id,
      center,
      border,
      mapName,
    });
  }
}
writeRegions(regions);

// Player Marker
{
  const uiWorldMap = await readJSON<WorldMapIconSprite>(
    CONTENT_DIR +
      "/Client/Content/Aki/UI/UIResources/UiWorldMap/Atlas/TPI_UiWorldMap.json",
  );

  const iconIndex = uiWorldMap[0].Properties.Sprites.indexOf(
    "/Game/Aki/UI/UIResources/UiWorldMap/Atlas/SP_WorldMapPlayer1.SP_WorldMapPlayer1",
  );
  const spriteInfo = uiWorldMap[0].Properties.SpriteInfoMap[iconIndex];
  const iconPath =
    TEXTURE_DIR +
    "/" +
    uiWorldMap[0].Properties.AtlasTextures[0].ObjectPath.split(".")[0] +
    ".png";
  await extractCanvasFromSprite(iconPath, "player", spriteInfo, { rotate: 90 });
}

const addedFilterIDs: string[] = [];
const addedIcons: string[] = [];
const skipIDs: string[] = ["AudioBoxTrigger"];
const eventIDs: string[] = ["Gameplay200", "Gameplay124"];
const overrides: Record<string, string> = {
  Teleport003: "Teleport003",
  Teleport008: "Teleport003",
  Animal021: "Animal021",
  Animal022: "Animal021",
  Animal023: "Animal021",
  Animal024: "Animal021",
  Collect_CXS03: "Collect_CXS03",
  Collect_CXS04: "Collect_CXS03",
  Collect_CXS05: "Collect_CXS03",
  Collect_CXS06: "Collect_CXS03",
};
const monsterFilterIds: string[] = [];
const fetterGroupIds: Record<string, string[]> = {};
for (const monster of monsterInfo.monsterinfo) {
  const phantomItem = dbPhantom.phantomitem.find(
    (p) => p.data.MonsterName === monster.data.Name,
  );
  const isUnique =
    monsterInfo.monsterinfo.filter(
      (m) => m.data.MonsterEntityID === monster.data.MonsterEntityID,
    ).length === 1;
  if (!isUnique && phantomItem?.data.ParentMonsterId) {
    continue;
  }

  const rarityDesc = monsterInfo.monsterrarity.find(
    (mr) => mr.Id === monster.data.RarityId,
  )?.data.RarityDesc!;
  let name =
    MultiText.find((m) => m.Id === monster.data.Name)?.Content ??
    monster.data.Name;
  let id = monster.data.MonsterEntityID;
  if (!id) {
    console.warn(`Missing MonsterEntityID for ${name}`);
    continue;
  }
  if (name === "Exile") {
    overrides[id] = "exile";
    id = "exile";
  }

  const monsterHandbook = dbHandbook.monsterhandbook.find(
    (p) => p.Id === monster.Id,
  );
  const meshId = monsterHandbook?.data.MeshId ?? phantomItem?.data.MeshId;

  if (!meshId) {
    // console.warn(
    //   `Missing MeshId for ${monster.data.Name} (${id} | ${monster.Id})`,
    // );
  }
  if (meshId) {
    const modelConfig = dbModelConfigPreload.modelconfigpreload.find(
      (m) => m.Id === meshId,
    );
    const bpNamesSet = new Set<string>();
    const meshBpName = modelConfig?.data.Meshes[0]?.split(".").at(-1);
    if (meshBpName) {
      bpNamesSet.add(meshBpName);
    }
    const actorBpName = modelConfig?.data.ActorClassPath.split(".").at(-1);
    if (actorBpName) {
      bpNamesSet.add(actorBpName);
    }
    const modelName = Object.values(dtModelConfig[0].Rows)
      .find((m) => m.ID_3_6A014D4F486091DDAF9D4D9D32B8C4FF === meshId)
      ?.网格体_168_BEB7464046E518BA05D4C799C3CC4633.AssetPathName.split("/")[6];
    if (modelName) {
      bpNamesSet.add(`BP_${modelName}_C`);
    }

    const bpNames = Array.from(bpNamesSet).filter(
      (bp) => bp !== "BP_BaseItem_C",
    );

    if (bpNames.length === 0) {
      console.warn(`Missing bpName for ${id}`);
    }
    bpNames.forEach((bpName) => {
      if (typesIDs[bpName] && typesIDs[bpName] !== id) {
        // console.warn(
        //   `Duplicate BP: ${bpName} with ${id} and ${typesIDs[bpName]}`,
        // );
        if (!phantomItem) {
          typesIDs[bpName] = id;
        }
      } else {
        typesIDs[bpName] = id;
      }
    });
  }
  const isExile = name.includes("Exile") || name.includes("Fractsidus");
  const group = isExile ? "exileAndFractsidus" : rarityDesc;
  const filterName = isExile
    ? "Exiles & Fractsidus"
    : MultiText.find((m) => m.Id === rarityDesc)?.Content;
  if (!filters.find((f) => f.group === group)) {
    filters.push({
      group: group,
      defaultOpen: false,
      defaultOn:
        group.includes("_4_") || group.includes("_3_") || group.includes("_2_"),
      values: [],
    });
    enDict[group] = filterName ?? group;
    enDict[group] = capitalizeWords(enDict[group]).replace("s(", "s (");
  }
  const category = filters.find((f) => f.group === group)!;

  if (!addedFilterIDs.includes(id)) {
    category.values.push({
      id,
      icon: await saveIcon(
        monster.data.Icon.replace("/Game", "/Client/Content").split(".")[0] +
          ".png",
        id,
        {
          border: true,
          color: "#aaa",
        },
      ),
      size: 1.3,
    });
    addedFilterIDs.push(id);
    if (addedIcons.includes(monster.data.Icon)) {
      // console.warn(`Duplicate icon: ${monster.data.Icon}`);
    }
    addedIcons.push(monster.data.Icon);
  }

  enDict[id] = name;
  const discoveredDesc =
    MultiText.find((m) => m.Id === monster.data.DiscoveredDes)?.Content ?? "";

  const desc = extractResFromDesc(discoveredDesc);

  const fetterGroups = phantomItem?.data.FetterGroup.map(
    (f) => dbPhantom.phantomfettergroup.find((g) => g.data.Id === f)!,
  );
  if (fetterGroups) {
    enDict[id + "_desc"] =
      fetterGroups
        .map(
          (g) =>
            `<p style="color:#${g.data.FetterElementColor}">${MultiText.find((m) => m.Id === g.data.FetterGroupName)?.Content}</p>`,
        )
        .join("") ?? "";
    const names = fetterGroups.map(
      (g) => MultiText.find((m) => m.Id === g.data.FetterGroupName)?.Content!,
    );
    enDict[id + "_tags"] = names.join(" ");
    fetterGroupIds[id] = names.map(toCamelCase);
    if (!globalFilters.some((f) => f.group === "echoSet")) {
      globalFilters.push({
        group: "echoSet",
        values: [],
      });
      enDict.echoSet = "Echo Set";
    }
    const globalFilter = globalFilters.find((f) => f.group === "echoSet")!;
    names.forEach((name) => {
      const type = toCamelCase(name);
      if (!globalFilter.values.some((v) => v.id === type)) {
        globalFilter.values.push({ id: type, defaultOn: true });
        enDict[type] = name;
      }
    });

    if (desc) {
      enDict[id + "_desc"] += desc;
    }
  } else if (desc) {
    enDict[id + "_desc"] = desc;
  }

  monsterFilterIds.push(id);
}

function extractResFromDesc(desc: string) {
  const lastColor = desc.lastIndexOf("</color>");
  if (lastColor !== -1) {
    const to = Math.min(
      desc.slice(lastColor + 1).indexOf("."),
      desc.slice(lastColor + 1).indexOf("\n"),
    );
    if (to !== -1) {
      return desc.slice(0, lastColor + to + 1);
    }
  }
  return "";
}

const sortedEntities = levelentityconfig.sort((a, b) => {
  const aHasMapMark = dbMapMark.mapmark.some(
    (m) => m.data.EntityConfigId === a.data.EntityId,
  );
  const bHasMapMark = dbMapMark.mapmark.some(
    (m) => m.data.EntityConfigId === b.data.EntityId,
  );
  if (aHasMapMark && !bHasMapMark) {
    return -1;
  }
  if (!aHasMapMark && bHasMapMark) {
    return 1;
  }
  return 0;
});
// const filterIds = filters.flatMap((f) => f.values.map((v) => v.id));
for (const levelEntity of sortedEntities) {
  if (
    levelEntity.data.MapId !== BIG_WORLD_MAP_ID &&
    levelEntity.data.MapId !== UNDERGROUND_MAP_ID
  ) {
    continue;
  }
  const mapName =
    levelEntity.data.MapId === BIG_WORLD_MAP_ID ? WORLD.id : UNDERGROUND.id;

  let id =
    levelEntity.data.BlueprintType ?? levelEntity.data.EntityId.toString();
  if (skipIDs.includes(id)) {
    continue;
  }

  if (overrides[id]) {
    id = overrides[id];
  }
  const isMonster = monsterFilterIds.includes(id);

  const x = levelEntity.data.Transform[0].X / levelEntity.data.Transform[2].X;
  const y = levelEntity.data.Transform[0].Y / levelEntity.data.Transform[2].Y;
  const z = levelEntity.data.Transform[0].Z / levelEntity.data.Transform[2].Z;
  const location = { x, y, z };
  const spawn: Node["spawns"][number] = {
    p: [+location.y, +location.x, +location.z],
  };

  let spawnId: string | null = null;
  let spawnIcon: {
    name: string;
    url: string;
  } | null = null;

  const mapMark = dbMapMark.mapmark.find(
    (m) => m.data.EntityConfigId === levelEntity.data.EntityId,
  );
  const template = dbTemplate.templateconfig.find(
    (c) => c.data.BlueprintType === levelEntity.data.BlueprintType,
  );
  const meshId =
    template?.data.ComponentsData.ModelComponent?.ModelType.ModelId;

  const tidName = template?.data.ComponentsData.BaseInfoComponent.TidName;
  const isAnimal =
    levelEntity.data.BlueprintType.startsWith("Animal") &&
    levelEntity.data.BlueprintType !== "Animal032";
  const isCollectible = levelEntity.data.BlueprintType.startsWith("Collect");
  if (isCollectible || isAnimal) {
    let nameTerm = MultiText.find((m) => m.Id === tidName)
      ?.Content.replace("Laternberry", "Lanternberry")
      .replace("Tetra", "Fish")
      .replace("Fowl", "Fowl Meat");
    if (!nameTerm) {
      switch (levelEntity.data.BlueprintType) {
        case "Collect001_1":
        case "Collect001":
          nameTerm = "Lotus Seeds";
          break;
        default:
          // console.warn(`Missing name term for ${id}`);
          continue;
      }
    }
    const existingId = Object.keys(enDict).find((k) => enDict[k] === nameTerm);
    if (existingId) {
      id = existingId;
    }
    if (!addedFilterIDs.includes(id)) {
      const baseId =
        MultiText.find(
          (m) => m.Id.startsWith("ItemInfo") && m.Content === nameTerm,
        )?.Id ||
        MultiText.find(
          (m) => m.Id.startsWith("AnimalHandBook") && m.Content === nameTerm,
        )?.Id;
      if (!baseId) {
        // console.warn(`Missing item info for ${nameTerm}`);
        continue;
      }
      const handbook = dbHandbook.animalhandbook.find(
        (a) => a.data.Name === baseId,
      );
      const itemInfo = dbItems.iteminfo.find((i) => i.data.Name === baseId);
      if (!itemInfo && !handbook) {
        console.warn(
          `Missing item/handbook info for ${nameTerm} (${id} | ${baseId})`,
        );
        continue;
      }
      enDict[id] = nameTerm;
      let iconName = "";
      let isAscension = false;
      let iconPath = "";

      if (itemInfo) {
        iconName = itemInfo.data.Name;
        isAscension = itemInfo.data.ShowTypes.includes(45);
        const desc = MultiText.find(
          (m) => m.Id === itemInfo.data.ObtainedShowDescription,
        )?.Content;
        if (desc) {
          enDict[`${id}_desc`] = desc;
        }
        iconPath =
          itemInfo.data.IconSmall.replace("/Game", "/Client/Content").split(
            ".",
          )[0] + ".png";
      } else if (handbook) {
        iconName = handbook.data.Name;
        isAscension = false;
        const desc = MultiText.find(
          (m) => m.Id === handbook.data.TypeDescrtption,
        )?.Content;
        if (desc) {
          enDict[`${id}_desc`] = desc;
        }
        iconPath =
          handbook.data.Icon.replace("/Game", "/Client/Content").split(".")[0] +
          ".png";
      }

      let group;
      if (isCollectible) {
        group = "collectibles";
        enDict[group] = "Collectibles";
      } else if (isAnimal) {
        group = "animals";
        enDict[group] = "Animals";
      } else {
        group = "ascensionMaterials";
        enDict[group] = "Ascension Materials";
      }
      if (!filters.find((f) => f.group === group)) {
        filters.push({
          group,
          defaultOpen: false,
          defaultOn: isAscension,
          values: [],
        });
      }

      const category = filters.find((f) => f.group === group)!;
      category.values.push({
        id,
        icon: await saveIcon(iconPath, iconName),
        size: 1,
      });
      addedFilterIDs.push(id);
      if (addedIcons.includes(iconPath)) {
        // console.warn(`Duplicate icon: ${iconPath}`);
      }
      addedIcons.push(iconPath);
    }
  }

  const GAMEPLAY_TREASURES: { [key: string]: number } = {
    Mingzi: 40040001, // Sonance Casket
    "Advanced Supply Chest": 50000167,
    "Basic Supply Chest": 50000164,
    "Premium Supply Chest": 50000168,
    Treasure017: 50000201, // Scattered Supply Chest
    "Standard Supply Chest": 50000165,
    Gameplay_CXS_4: 40040002, // Windchimer
    Gameplay_CXS_14: 40040002, // Windchimer
  };
  const nameTerm =
    !GAMEPLAY_TREASURES[levelEntity.data.BlueprintType] &&
    template &&
    MultiText.find(
      (m) => m.Id === template.data.ComponentsData.BaseInfoComponent.TidName,
    )?.Content;

  const TREASURE_TYPES = [
    "Animal032",
    "Treasure005",
    "Treasure011",
    "Treasure008",
    "Monster139",
    "Gameplay111",
  ];
  if (
    TREASURE_TYPES.includes(id) &&
    template?.data.ComponentsData.ModelComponent?.ModelType.ModelId &&
    !addedFilterIDs.includes(id)
  ) {
    if (!template) {
      throw new Error(`Missing template for ${id}`);
    }
    const iconName = id;
    let icon;
    switch (id) {
      case "Animal032":
        {
          enDict[id] = "Bobfly";
          icon = await saveIcon(
            String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\flying-target_delapouite.webp`,
            iconName,
          );
        }
        break;
      case "Treasure005":
        {
          enDict[id] = "Blue Tidal Heritage";
          icon = await saveIcon(
            String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\polar-star_delapouite.webp`,
            iconName,
            { color: "#76ffff" },
          );
        }
        break;
      case "Treasure011":
        {
          enDict[id] = "Golden Tidal Heritage";
          icon = await saveIcon(
            String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\polar-star_delapouite.webp`,
            iconName,
            { color: "#d0b72c" },
          );
        }
        break;
      case "Treasure008":
        {
          enDict[id] = "Purple Tidal Heritage";
          icon = await saveIcon(
            String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\polar-star_delapouite.webp`,
            iconName,
            { color: "#cfafdc" },
          );
        }
        break;
      case "Monster139":
        {
          enDict[id] = "Frostbug";
          icon = await saveIcon(
            String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\sea-serpent_lorc.webp`,
            iconName,
            { color: "#a3cffd" },
          );
        }
        break;
      case "Gameplay111":
        {
          enDict[id] = "Mutterfly";
          icon = await saveIcon(
            String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\butterfly_lorc.webp`,
            iconName,
            { color: "#fff77a" },
          );
        }
        break;
      default: {
        throw new Error(`Missing icon for ${id}`);
      }
    }

    const group = "treasures";
    if (!filters.find((f) => f.group === group)) {
      filters.push({
        group,
        defaultOpen: false,
        defaultOn: false,
        values: [],
      });
      enDict[group] = "Treasures";
    }
    const category = filters.find((f) => f.group === group)!;
    category.values.push({
      id,
      icon: icon,
      size: 1.5,
    });
    addedFilterIDs.push(id);
  }

  const gamePlayItemId =
    GAMEPLAY_TREASURES[levelEntity.data.BlueprintType] ||
    (nameTerm && GAMEPLAY_TREASURES[nameTerm]);
  if (gamePlayItemId) {
    id = `Gameplay${gamePlayItemId}`;
    if (!addedFilterIDs.includes(id)) {
      const itemInfo = dbItems.iteminfo.find(
        (i) => i.data.Id === gamePlayItemId,
      );
      if (!itemInfo) {
        console.warn(`Missing item info for ${gamePlayItemId}`);
        continue;
      }
      if (!template) {
        throw new Error(`Missing template for ${id}`);
      }
      // const mesh = Object.values(dtModelConfig[0].Rows).find(
      //   (m) =>
      //     m.ID_3_6A014D4F486091DDAF9D4D9D32B8C4FF ===
      //     template.data.ComponentsData.ModelComponent!.ModelType.ModelId!,
      // );
      // if (!mesh) {
      //   throw new Error(
      //     `Missing mesh for ${id} with ModelID ${template.data.ComponentsData.ModelComponent!.ModelType.ModelId}`,
      //   );
      // }
      // const bpName =
      //   mesh.蓝图_164_769F290B4EFC164B65A1599B535666B6.AssetPathName.split(
      //     "/",
      //   )[6];
      // if (bpName) {
      //   typesIDs[`BP_${bpName}_C`] = id;
      //     }

      enDict[id] = (
        nameTerm || MultiText.find((m) => m.Id === itemInfo.data.Name)?.Content!
      )
        .replace("Mingzi", "Sonance Casket")
        .replace("Originite Weapon Supply Chest", "Scattered Supply Chest");
      const desc = MultiText.find(
        (m) => m.Id === itemInfo.data.ObtainedShowDescription,
      )?.Content;
      if (desc) {
        enDict[`${id}_desc`] = desc;
      }
      const iconPath =
        itemInfo.data.IconSmall.replace("/Game", "/Client/Content").split(
          ".",
        )[0] + ".png";

      const iconName = itemInfo.data.Name;
      const group = "treasures";
      if (!filters.find((f) => f.group === group)) {
        filters.push({
          group,
          defaultOpen: false,
          defaultOn: false,
          values: [],
        });
        enDict[group] = "Treasures";
      }

      const category = filters.find((f) => f.group === group)!;
      category.values.push({
        id,
        icon: await saveIcon(iconPath, iconName),
        size: 1.1,
      });
      addedFilterIDs.push(id);
      if (addedIcons.includes(iconPath)) {
        // console.warn(`Duplicate icon: ${iconPath}`);
      }
      addedIcons.push(iconPath);
    }
  }

  if (mapMark) {
    let group = id.startsWith("Gameplay") ? "gameplay" : "locations";
    if (eventIDs.includes(id)) {
      group = "events";
    }
    if (id === "Gameplay333") {
      group = "locations";
    }
    const iconIndex = worldMapIconSprite[0].Properties.Sprites.indexOf(
      mapMark.data.UnlockMarkPic,
    );
    if (iconIndex === -1) {
      console.log(`Icon not found: ${mapMark.data.LockMarkPic}`);
      continue;
    }
    const title =
      MultiText.find((m) => m.Id === mapMark.data.MarkTitle)?.Content ??
      mapMark.data.MarkTitle;
    const isForgeryChallenge = iconIndex === 29;
    const isBossChallenge = id.startsWith("Monster");
    const isTacticalHologram = title.startsWith("Tactical Hologram");
    if (isBossChallenge) {
      id = "BossChallenge_" + id;
      group = "gameplay";
    } else if (isForgeryChallenge) {
      id = "forgery_challenge";
    } else if (isTacticalHologram) {
      id = "tactical_hologram";
      group = "locations";
    } else {
      id =
        Object.keys(enDict).find((key) => enDict[key] === title) ??
        `${mapMark.data.MarkId}_${id}`;
      if (enDict[id] && enDict[id] !== title) {
        console.log(`New: ${enDict[id]} -> ${title} (${id})`);
      }
    }

    if (!filters.find((f) => f.group === group)) {
      filters.push({
        group,
        defaultOpen: group === "events",
        defaultOn: true,
        values: [],
      });
    }
    const category = filters.find((f) => f.group === group)!;
    if (
      !mapMark.data.UnlockMarkPic.startsWith(
        "/Game/Aki/UI/UIResources/Common/Atlas/WorldMapIcon/",
      )
    ) {
      console.warn(`Invalid icon: ${mapMark.data.UnlockMarkPic}`);
      continue;
    }

    if (!addedFilterIDs.includes(id)) {
      const spriteInfo =
        worldMapIconSprite[0].Properties.SpriteInfoMap[iconIndex];
      category.values.push({
        id,
        icon: await extractCanvasFromSprite(
          workMapIconPath,
          mapMark.data.UnlockMarkPic.split(".")[1],
          spriteInfo,
        ),
        size: 1.5,
      });
      addedFilterIDs.push(id);
      if (addedIcons.includes(mapMark.data.UnlockMarkPic)) {
        // console.warn(`Duplicate icon: ${mapMark.data.UnlockMarkPic}`);
      }
      addedIcons.push(mapMark.data.UnlockMarkPic);
    }

    if (isForgeryChallenge) {
      enDict[id] = "Forgery Challenge";
      spawnId = levelEntity.data.EntityId.toString();
      enDict[spawnId] =
        MultiText.find((m) => m.Id === mapMark.data.MarkTitle)?.Content ??
        mapMark.data.MarkTitle;
      if (mapMark.data.MarkDesc) {
        enDict[spawnId + "_desc"] = extractResFromDesc(
          MultiText.find((m) => m.Id === mapMark.data.MarkDesc)?.Content ??
            mapMark.data.MarkDesc,
        );
      }
    } else if (isTacticalHologram) {
      enDict[id] = "Tactical Hologram";
      spawnId = levelEntity.data.EntityId.toString();
      enDict[spawnId] =
        MultiText.find((m) => m.Id === mapMark.data.MarkTitle)?.Content ??
        mapMark.data.MarkTitle;
      if (mapMark.data.MarkDesc) {
        enDict[spawnId + "_desc"] = extractResFromDesc(
          MultiText.find((m) => m.Id === mapMark.data.MarkDesc)?.Content ??
            mapMark.data.MarkDesc,
        );
      }
    } else {
      enDict[id] =
        MultiText.find((m) => m.Id === mapMark.data.MarkTitle)?.Content ??
        mapMark.data.MarkTitle;
      if (isBossChallenge) {
        enDict[id] += " Boss Challenge";
      }
      if (mapMark.data.MarkDesc) {
        enDict[id + "_desc"] = extractResFromDesc(
          MultiText.find((m) => m.Id === mapMark.data.MarkDesc)?.Content ??
            mapMark.data.MarkDesc,
        );
      }
    }
    let oldNodes = nodes.find((n) => n.type === id && n.mapName === mapName);
    if (!oldNodes) {
      oldNodes = { type: id, mapName, spawns: [] };
      nodes.push(oldNodes);
      oldNodes = nodes.find((n) => n.type === id && n.mapName === mapName);
      // console.log("New type", id);
    }

    if (
      oldNodes!.spawns.some(
        (s) => s.p[0] === location.y && s.p[1] === location.x,
      )
    ) {
      continue;
    }

    const baseName =
      levelEntity.data.ComponentsData?.BaseInfoComponent?.TidName?.TidContent ||
      levelEntity.data.ComponentsData?.BaseInfoComponent?.TidName;
    const interactName =
      levelEntity.data.ComponentsData?.InteractComponent?.Options?.[0]
        ?.TidContent;
    if (baseName || interactName) {
      const baseTerm =
        baseName && MultiText.find((m) => m.Id === baseName)?.Content;
      const interactTerm =
        interactName && MultiText.find((m) => m.Id === interactName)?.Content;
      spawnId = levelEntity.data.EntityId.toString();
      if (baseTerm) {
        enDict[spawnId] = baseTerm;
      }
      if (interactTerm) {
        enDict[`${spawnId}_desc`] = interactTerm;
      }
    }

    if (spawnId) {
      spawn.id = spawnId;
      if (spawnIcon) {
        spawn.icon = spawnIcon;
      }
      oldNodes!.spawns.push(spawn);
    } else {
      oldNodes!.spawns.push(spawn);
      if (mapMark && isMonster) {
        id = id.replace("BossChallenge_", "");
        let oldNodes = nodes.find(
          (n) => n.type === id && n.mapName === mapName,
        );
        if (!oldNodes) {
          oldNodes = { type: id, mapName, spawns: [] };
          nodes.push(oldNodes);
          oldNodes = nodes.find((n) => n.type === id && n.mapName === mapName);
        }

        oldNodes!.spawns.push(spawn);
      }
    }
  }
  if (isMonster) {
    const level = levelEntity.data.ComponentsData?.AttributeComponent?.Level;
    if (level) {
      let name: string | null;
      const monsterMatchType =
        levelEntity.data.ComponentsData?.BaseInfoComponent?.Category
          ?.MonsterMatchType;
      if (monsterMatchType) {
        name = levelEntity.data.ComponentsData?.BaseInfoComponent?.TidName;
        if (!name) {
          name = monsterInfo.monsterinfo.find(
            (m) => m.data.MonsterEntityID === levelEntity.data.BlueprintType,
          )!.data.Name;
        }
        id = `Monster_Glowing_${levelEntity.data.BlueprintType}`;
      } else {
        const spawner = sortedEntities.find((e) =>
          e.data.ComponentsData?.SpawnMonsterComponent?.SpawnMonsterConfigs?.find(
            (c: any) => c.TargetsToAwake?.includes(levelEntity.data.EntityId),
          ),
        );
        if (!spawner) {
          // console.warn(`Missing spawner for ${id}`);
          continue;
        }

        const nodeData = dbLevelPlayNodeData.levelplaynodedata.find((d) =>
          d.data.Data.Condition?.MonsterCreatorEntityIds?.includes(
            spawner.EntityId,
          ),
        );
        if (!nodeData) {
          //console.warn(`Missing node data for ${id}`);
          continue;
        }

        name = nodeData.data.Data.Condition?.TidMonsterGroupName ?? null;
        if (!name) {
          // console.warn(`Missing Monster Group name: ${id}`);
          continue;
        }

        id = `Monster_Glowing_${nodeData.data.Key.split("_")[0]}`;
      }

      const group = "Monster_Glowing";
      if (!filters.find((f) => f.group === group)) {
        filters.push({
          group,
          defaultOpen: true,
          defaultOn: true,
          values: [],
        });
        enDict[group] = "Elite Glowing Enemies";
      }

      if (!addedFilterIDs.includes(id)) {
        const nameTerm = MultiText.find((m) => m.Id === name)?.Content;
        enDict[id] = nameTerm ?? name;
        enDict[`${id}_desc`] = `Level ${level}`;
        const iconPath =
          monsterInfo.monsterinfo
            .find(
              (m) => m.data.MonsterEntityID === levelEntity.data.BlueprintType,
            )
            ?.data.Icon.replace("/Game", "/Client/Content")
            .split(".")[0] + ".png";

        const iconName = `Glowing ${levelEntity.data.BlueprintType}`;

        const category = filters.find((f) => f.group === group)!;
        category.values.push({
          id,
          icon: await saveIcon(iconPath, iconName, {
            border: true,
            color: "#ff5670",
          }),
          size: 2,
        });
        addedFilterIDs.push(id);
        if (addedIcons.includes(iconPath)) {
          // console.warn(`Duplicate icon: ${iconPath}`);
        }
        addedIcons.push(iconPath);
      }

      // const group = "Monster_Glowing";
      // const category = filters.find((f) => f.group === group)!;
      // console.log("Glowing", enDict[id], id);
    }

    let spawnType = "normal";
    let spawnTypeLabel = "Normal";
    if (levelEntity.data.InSleep) {
      let owner = dbEntityOwnerData.entityownerdata.find(
        (d) =>
          d.data.Guid.split("_")[1] === levelEntity.data.EntityId.toString(),
      );
      if (owner) {
        let ownerEntityId = owner.data.Owner.find(
          (o) => o.Type === "Entity",
        )?.EntityId;
        if (ownerEntityId) {
          const ownerEntity = sortedEntities.find(
            (e) => e.data.EntityId === ownerEntityId,
          );
          if (!ownerEntity) {
            throw new Error(
              `Missing owner entity for ${levelEntity.data.EntityId}`,
            );
          }
          if (ownerEntity.data.InSleep) {
            owner = dbEntityOwnerData.entityownerdata.find(
              (d) =>
                d.data.Guid.split("_")[1] ===
                ownerEntity.data.EntityId.toString(),
            );
            if (!owner) {
              throw new Error(`Missing owner for ${ownerEntity.data.EntityId}`);
            }
          }
          // spawnId = `${id}_${levelEntity.data.EntityId}`;
          // enDict[`${spawnId}_desc`] =
          //   `<p style="color:#f68c46">Quest Related</p>` + enDict[`${id}_desc`];
        }

        const ownerQuestId = owner.data.Owner.find(
          (o) => o.Type === "Quest",
        )?.QuestId;
        const ownerLevelPlayId = owner.data.Owner.find(
          (o) => o.Type === "LevelPlay",
        )?.LevelPlayId;

        if (ownerQuestId) {
          const ownerQuest = dbQuestData.questdata.find(
            (d) => d.data.QuestId === ownerQuestId,
          );
          if (!ownerQuest) {
            throw new Error(
              `Missing owner quest for ${levelEntity.data.EntityId}`,
            );
          }
          const questName = MultiText.find(
            (m) => m.Id === ownerQuest.data.Data.TidName,
          )?.Content;
          spawnId = `${id}_${levelEntity.data.EntityId}`;
          let fullQuestName = "Quest";
          if (questName) {
            fullQuestName += ` ${questName}`;
          }
          enDict[`${spawnId}_desc`] =
            `<p style="color:#17a0a4">${fullQuestName}</p>`;
          if (enDict[`${id}_desc`]) {
            enDict[`${spawnId}_desc`] += enDict[`${id}_desc`];
          }
          enDict[`${spawnId}_tags`] = `${fullQuestName}`;
          if (enDict[`${id}_tags`]) {
            enDict[`${spawnId}_tags`] += " " + enDict[`${id}_tags`];
          }
          spawnType = "quest";
          spawnTypeLabel = "Quest";
        } else if (ownerLevelPlayId) {
          const ownerLevelPlay = dbLevelPlayData.levelplaydata.find(
            (d) => d.data.LevelPlayId === ownerLevelPlayId,
          );
          if (!ownerLevelPlay) {
            throw new Error(
              `Missing owner level play for ${levelEntity.data.EntityId}`,
            );
          }
          const dataType = ownerLevelPlay.data.Data.Type.replace(
            "MonsterTreasure",
            "Monster Treasure",
          )
            .replace("SilentArea", "Tacet Field")
            .replace("Riddle", "Breakable Rock/Riddle")
            .replace("RebornBoss", "Normal");
          spawnId = `${id}_${levelEntity.data.EntityId}`;

          const levelPlayRefreshConfig =
            ownerLevelPlay.data.Data.LevelPlayRefreshConfig;
          if (!levelPlayRefreshConfig) {
            throw new Error(
              `Missing refresh config for ${levelEntity.data.EntityId}`,
            );
          }
          spawnType = toCamelCase(dataType);
          spawnTypeLabel = dataType;
          if (levelPlayRefreshConfig.Type !== "None") {
            if (
              spawnType !== "quest" &&
              spawnType !== "tacetField" &&
              spawnType !== "normal" &&
              spawnType !== "challenge"
            ) {
              spawnType += "_respawns";
              spawnTypeLabel += " (Respawns)";
            }
            enDict[`${spawnId}_desc`] =
              `<p style="color:#17a0a4">${spawnTypeLabel}</p>`;
            let text = "";
            if (levelPlayRefreshConfig.Type === "Completed") {
              if (
                levelPlayRefreshConfig.MinRefreshCd !==
                levelPlayRefreshConfig.MaxRefreshCd
              ) {
                text = `Spawns in ${formatTimer(levelPlayRefreshConfig.MinRefreshCd!)} to ${formatTimer(levelPlayRefreshConfig.MaxRefreshCd!)} after completed`;
              } else {
                text = `Spawns in ${formatTimer(levelPlayRefreshConfig.MinRefreshCd!)} after completed`;
              }
            } else if (levelPlayRefreshConfig.Type === "FixedDateTime") {
              text = `Spawns ${levelPlayRefreshConfig.UpdateType}`;
            } else if (levelPlayRefreshConfig.Type === "CustomRefresh") {
              text = `Spawns ${formatTimer(levelPlayRefreshConfig.CompletedRefreshTime!)}after completed or ${formatTimer(levelPlayRefreshConfig.AwardedRefreshTime!)} after awarded`;
            } else if (
              levelPlayRefreshConfig.Type === "ChildDestroyOrAwarded"
            ) {
              if (
                levelPlayRefreshConfig.ChildDestroyRefreshCd!.MinRefreshCd !==
                levelPlayRefreshConfig.ChildDestroyRefreshCd!.MaxRefreshCd
              ) {
                text = `Spawns ${formatTimer(levelPlayRefreshConfig.ChildDestroyRefreshCd!.MinRefreshCd!)} to ${formatTimer(levelPlayRefreshConfig.ChildDestroyRefreshCd!.MaxRefreshCd!)} after completed`;
              } else {
                text = `Spawns ${formatTimer(levelPlayRefreshConfig.ChildDestroyRefreshCd!.MinRefreshCd!)} after completed`;
              }
              if (
                levelPlayRefreshConfig.AwardedRefreshCd!.MinRefreshCd !==
                levelPlayRefreshConfig.AwardedRefreshCd!.MaxRefreshCd
              ) {
                text += ` or ${formatTimer(levelPlayRefreshConfig.AwardedRefreshCd!.MinRefreshCd!)} to ${formatTimer(levelPlayRefreshConfig.AwardedRefreshCd!.MaxRefreshCd!)} after awarded`;
              } else {
                text += ` or ${formatTimer(levelPlayRefreshConfig.AwardedRefreshCd!.MinRefreshCd!)} after awarded`;
              }
            } else if (levelPlayRefreshConfig.Type === "CustomOnlineRefresh") {
              text = `Spawns on custom online refresh`;
            } else {
              throw new Error(
                `Unknown refresh type: ${levelPlayRefreshConfig.Type}`,
              );
            }
            enDict[`${spawnId}_desc`] += `<p class="italic">${text}</p>`;
          } else {
            if (
              spawnType !== "quest" &&
              spawnType !== "tacetField" &&
              spawnType !== "normal" &&
              spawnType !== "challenge"
            ) {
              spawnType += "_once";
              spawnTypeLabel += " (Once)";
            }
            enDict[`${spawnId}_desc`] =
              `<p style="color:#17a0a4">${spawnTypeLabel}</p>`;
          }
          if (enDict[`${id}_desc`]) {
            enDict[`${spawnId}_desc`] += enDict[`${id}_desc`];
          }
          enDict[`${spawnId}_tags`] = dataType;
          if (enDict[`${id}_tags`]) {
            enDict[`${spawnId}_tags`] += " " + enDict[`${id}_tags`];
          }
        }
      } else {
        throw new Error(`Missing owner for ${levelEntity.data.EntityId}`);
      }
    }
    if (!globalFilters.some((f) => f.group === "spawnType")) {
      globalFilters.push({
        group: "spawnType",
        values: [],
      });
      enDict.spawnType = "Spawn Type";
    }
    const globalFilter = globalFilters.find((f) => f.group === "spawnType")!;
    if (!globalFilter.values.some((v) => v.id === spawnType)) {
      if (
        spawnType === "normal" ||
        spawnType === "monsterTreasure_respawns" ||
        spawnType === "breakableRock/riddle_respawns"
      ) {
        globalFilter.values.push({ id: spawnType, defaultOn: true });
      } else {
        globalFilter.values.push({ id: spawnType });
      }
      enDict[spawnType] = spawnTypeLabel;
    }
    const fetterGroup = fetterGroupIds[id];
    if (fetterGroup) {
      spawn.data = { spawnType: [spawnType], echoSet: fetterGroup };
    } else {
      spawn.data = { spawnType: [spawnType] };
    }
  } else {
    if (id === "Gameplay102") {
      continue;
    }
    if (id === "Gameplay422") {
      continue;
    }
    const template = dbTemplate.templateconfig.find(
      (c) => c.data.BlueprintType === levelEntity.data.BlueprintType,
    );
    if (!template) {
      console.warn(`Missing template: ${levelEntity.data.BlueprintType}`);
      continue;
    }
    if (
      template.data.ComponentsData?.BaseInfoComponent.Category.MainType ===
      "SceneObj"
    ) {
      continue;
    }
    let iconPath: string | null = null;
    let iconName: string | null = null;
    // const drop = dbDrop.dropgroup.find(
    //   (d) => d.data.UnitId === levelEntity.data.Id
    // );
    // if (drop) {
    //   const item = dbItems.iteminfo.find(
    //     (i) => i.data.Id === drop.data.GroupId
    //   );
    //   if (item) {
    //     iconPath =
    //       item.data.IconSmall.replace("/Game", "/Client/Content").split(
    //         "."
    //       )[0] + ".png";
    //     iconName = item.data.IconSmall.split(".")[1];

    //     enDict[id] =
    //       MultiText.find((m) => m.Id === item.data.Name)?.Content ??
    //       item.data.Name;
    //   }
    // } else
    if (template.data.BlueprintType.startsWith("NPC")) {
      iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\character_delapouite.webp`;
      iconName = "npc";
    }
    if (!iconPath || !iconName) {
      iconPath = `C:\\dev\\the-hidden-gaming-lair\\static\\global\\icons\\game-icons\\uncertainty_lorc.webp`;
      iconName = "unknown";
    }
    if (!enDict[id]) {
      continue; // for now
    }

    if (!addedFilterIDs.includes(id)) {
      const group = "others";
      if (!filters.find((f) => f.group === group)) {
        filters.push({
          group,
          defaultOpen: false,
          defaultOn: false,
          values: [],
        });
      }
      const category = filters.find((f) => f.group === group)!;
      category.values.push({
        id,
        icon: await saveIcon(iconPath, iconName),
        size: 1.5,
      });
      addedFilterIDs.push(id);
      if (addedIcons.includes(iconPath)) {
        // console.warn(`Duplicate icon: ${iconPath}`);
      }
      addedIcons.push(iconPath);
    }
  }
  let oldNodes = nodes.find((n) => n.type === id && n.mapName === mapName);
  if (!oldNodes) {
    oldNodes = { type: id, mapName, spawns: [] };
    if (!Object.values(typesIDs).includes(id)) {
      if (!id.startsWith("Monster") || id.startsWith("Monster_Glowing")) {
        oldNodes.static = true;
      }
    }
    nodes.push(oldNodes);
    oldNodes = nodes.find((n) => n.type === id && n.mapName === mapName);
    // console.log("New type", id);
  }

  if (
    oldNodes!.spawns.some((s) => s.p[0] === location.y && s.p[1] === location.x)
  ) {
    continue;
  }

  const baseName =
    levelEntity.data.ComponentsData?.BaseInfoComponent?.TidName?.TidContent ||
    levelEntity.data.ComponentsData?.BaseInfoComponent?.TidName;
  const interactName =
    levelEntity.data.ComponentsData?.InteractComponent?.Options?.[0]
      ?.TidContent;
  if (baseName || interactName) {
    const baseTerm =
      baseName && MultiText.find((m) => m.Id === baseName)?.Content;
    const interactTerm =
      interactName && MultiText.find((m) => m.Id === interactName)?.Content;
    if (!spawnId) {
      spawnId = levelEntity.data.EntityId.toString();
    }
    if (baseTerm) {
      enDict[spawnId] = baseTerm;
    }
    if (interactTerm) {
      enDict[`${spawnId}_desc`] = interactTerm;
    }
  }

  if (spawnId) {
    spawn.id = spawnId;
    if (spawnIcon) {
      spawn.icon = spawnIcon;
    }
    oldNodes!.spawns.push(spawn);
  } else {
    oldNodes!.spawns.push(spawn);
    if (mapMark && isMonster) {
      id = id.replace("BossChallenge_", "");
      let oldNodes = nodes.find((n) => n.type === id && n.mapName === mapName);
      if (!oldNodes) {
        oldNodes = { type: id, mapName, spawns: [] };
        nodes.push(oldNodes);
        oldNodes = nodes.find((n) => n.type === id && n.mapName === mapName);
      }

      oldNodes!.spawns.push(spawn);
    }
  }

  if (meshId) {
    const modelConfig = dbModelConfigPreload.modelconfigpreload.find(
      (m) => m.Id === meshId,
    );
    const bpNamesSet = new Set<string>();
    const meshBpName = modelConfig?.data.Meshes[0]?.split(".").at(-1);
    if (meshBpName) {
      bpNamesSet.add(meshBpName);
    }
    const actorBpName = modelConfig?.data.ActorClassPath.split(".").at(-1);
    if (actorBpName) {
      bpNamesSet.add(actorBpName);
    }
    const modelName = Object.values(dtModelConfig[0].Rows)
      .find((m) => m.ID_3_6A014D4F486091DDAF9D4D9D32B8C4FF === meshId)
      ?.网格体_168_BEB7464046E518BA05D4C799C3CC4633.AssetPathName.split("/")[6];
    if (modelName) {
      bpNamesSet.add(`BP_${modelName}_C`);
    }

    const bpNames = Array.from(bpNamesSet).filter(
      (bp) => bp !== "BP_BaseItem_C",
    );

    if (bpNames.length === 0 && !isCollectible) {
      // console.warn(`Missing bpName for ${id}`);
    }
    bpNames.forEach((bpName) => {
      if (typesIDs[bpName] && typesIDs[bpName] !== id) {
        // console.warn(
        //   `Duplicate BP: ${bpName} with ${id} and ${typesIDs[bpName]}`,
        // );
      } else {
        typesIDs[bpName] = id;
      }
    });
  }
}

nodes.forEach((n) => {
  n.static = !Object.values(typesIDs).includes(n.type);
});
writeNodes(nodes);

const sortPriority = [
  "events",
  "Monster_Glowing",
  "locations",
  "ascensionMaterials",
  "gameplay",
  "MonsterRarity_4",
  "MonsterRarity_3",
  "MonsterRarity_2",
  "MonsterRarity_1",
  "exile",
  "treasures",
  "collectibles",
  "animals",
  "others",
];
const sortedFilters = filters
  .map((f) => {
    return {
      ...f,
      values: f.values.filter((v) => nodes.some((n) => n.type === v.id)),
    };
  })
  .sort((a, b) => {
    if (a.group === b.group) {
      return 0;
    }
    const priorityA = sortPriority.findIndex((p) =>
      a.group.toLowerCase().startsWith(p.toLowerCase()),
    );
    const priorityB = sortPriority.findIndex((p) =>
      b.group.toLowerCase().startsWith(p.toLowerCase()),
    );
    if (priorityA === priorityB) {
      return a.group.localeCompare(b.group);
    }
    return priorityA - priorityB;
  });
writeFilters(sortedFilters);
writeGlobalFilters(
  globalFilters.map((f) => ({
    ...f,
    values: f.values.sort((a, b) => a.id.localeCompare(b.id)),
  })),
);
writeDict(enDict, "en");

writeTypesIDs(typesIDs);
