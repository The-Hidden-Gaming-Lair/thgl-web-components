import { sqliteToJSON } from "./lib/db.js";
import { initDict, writeDict } from "./lib/dicts.js";
import { CONTENT_DIR, TEMP_DIR, TEXTURE_DIR, initDirs } from "./lib/dirs.js";
import { initFilters, writeFilters } from "./lib/filters.js";
import { readDirSync, readJSON, saveImage } from "./lib/fs.js";
import { extractCanvasFromSprite, mergeImages, saveIcon } from "./lib/image.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { capitalizeWords, toCamelCase } from "./lib/utils.js";
import { Node } from "./types.js";

initDirs(
  "/mnt/c/dev/Wuthering Waves/Extracted/Data",
  "/mnt/c/dev/Wuthering Waves/Extracted/Texture",
  "/home/devleon/the-hidden-gaming-lair/static/wuthering-waves"
);

const nodes = initNodes();
const filters = initFilters();
const regions = initRegions();

const enDict = initDict({
  events: "Temporary Events",
  gameplay: "Waveplate Activities",
  locations: "Locations",
  others: "Others",
});

const ORTHOGRAPHIC_WIDTH = 1360000;
const WORLD = {
  id: "AkiWorld_WP",
  ORTHOGRAPHIC_WIDTH: ORTHOGRAPHIC_WIDTH,
  OFFSET_X: -96,
  OFFSET_Y: -96,
  CAMERA_ANGLE: 0,
};
const BIG_WORLD_MAP_ID = 8;

if (Bun.env.DB === "true") {
  sqliteToJSON(
    "/Client/Content/Aki/ConfigDB",
    "/Client/Content/Aki/JavaScript"
  );
}

if (Bun.env.TILES === "true") {
  const mapTiles = await readDirSync(
    TEXTURE_DIR + "/Client/Content/Aki/UI/UIResources/UiWorldMap/Image/MapTiles"
  )
    .filter((f) => f.endsWith(".png"))
    .map(
      (f) =>
        TEXTURE_DIR +
        "/Client/Content/Aki/UI/UIResources/UiWorldMap/Image/MapTiles/" +
        f
    );
  const bigMap = await mergeImages(mapTiles, "#000");
  saveImage(TEMP_DIR + "/bigmap.png", bigMap.toBuffer("image/png"));
}

const tiles = initTiles(
  await generateTiles(
    WORLD.id,
    TEMP_DIR + "/bigmap.png",
    WORLD.ORTHOGRAPHIC_WIDTH,
    512,
    [WORLD.OFFSET_X, WORLD.OFFSET_Y],
    [
      [0, -150000],
      [200000, 50000],
    ]
  )
);

writeTiles(tiles);

const monsterInfo = readJSON<MonsterInfo>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_monster_Info.json"
);
const { MultiText } = readJSON<{
  MultiText: Array<{
    Id: string;
    Content: string;
  }>;
}>(CONTENT_DIR + "/Client/Content/Aki/ConfigDB/en/lang_multi_text.json");
const { levelentityconfig } = readJSON<{
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
const dbMapMark = readJSON<DBMapMark>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_map_mark.json"
);
const dbTemplate = readJSON<DBTemplate>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_template.json"
);
const dbDrop = readJSON<DBDrop>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_drop.json"
);
const dbItems = readJSON<DBItems>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_item.json"
);
const dbLevelPlayNodeData = readJSON<DBLevelPlayNodeData>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_LevelPlayNodeData.json"
);
const worldMapIconSprite = readJSON<WorldMapIconSprite>(
  CONTENT_DIR +
    "/Client/Content/Aki/UI/UIResources/Common/Atlas/WorldMapIcon/TPI_Common_WorldMapIcon.json"
);

const workMapIconPath =
  TEXTURE_DIR +
  "/" +
  worldMapIconSprite[0].Properties.AtlasTextures[0].ObjectPath.split(".")[0] +
  ".png";

for (const mapMark of dbMapMark.mapmark) {
  if (mapMark.data.MapId !== BIG_WORLD_MAP_ID) {
    continue;
  }
  const mapName = "AkiWorld_WP";
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

const addedFilterIDs: string[] = [];
const addedIcons: string[] = [];
const skipIDs: string[] = ["AudioBoxTrigger"];
const eventIDs: string[] = ["Gameplay200", "Gameplay124"];
const overrides: Record<string, string> = {
  Teleport003: "Teleport003",
  Teleport008: "Teleport003",
};
const monsterFilterIds: string[] = [];
for (const monster of monsterInfo.monsterinfo) {
  const rarityDesc = monsterInfo.monsterrarity.find(
    (mr) => mr.Id === monster.data.RarityId
  )?.data.RarityDesc!;
  const name =
    MultiText.find((m) => m.Id === monster.data.Name)?.Content ??
    monster.data.Name;
  const isExile = name.includes("Exile") || name.includes("Fractsidus");
  const group = isExile ? "exile" : rarityDesc;
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
  let id = monster.data.MonsterEntityID || monster.data.Name;
  if (isExile) {
    overrides[id] = toCamelCase(name);
    id = overrides[id];
  }
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
        }
      ),
      size: 1.3,
    });
    addedFilterIDs.push(id);
    if (addedIcons.includes(monster.data.Icon)) {
      console.warn(`Duplicate icon: ${monster.data.Icon}`);
    }
    addedIcons.push(monster.data.Icon);
  }
  enDict[id] = name;
  const desc = MultiText.find(
    (m) => m.Id === monster.data.DiscoveredDes
  )?.Content;
  if (desc) {
    enDict[id + "_desc"] = desc;
  }
  if (enDict[id].startsWith("Phantom")) {
    enDict[id] = enDict[id].replace("Phantom: ", "");
  }

  monsterFilterIds.push(id);
}

const sortedEntities = levelentityconfig.sort((a, b) => {
  const aHasMapMark = dbMapMark.mapmark.some(
    (m) => m.data.EntityConfigId === a.data.EntityId
  );
  const bHasMapMark = dbMapMark.mapmark.some(
    (m) => m.data.EntityConfigId === b.data.EntityId
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
  let id =
    levelEntity.data.BlueprintType ?? levelEntity.data.EntityId.toString();
  if (skipIDs.includes(id)) {
    continue;
  }

  if (overrides[id]) {
    id = overrides[id];
  }
  const isMonster = monsterFilterIds.includes(id);

  if (levelEntity.data.MapId !== BIG_WORLD_MAP_ID) {
    continue;
  }

  let spawnId: string | null = null;
  let spawnIcon: {
    name: string;
    url: string;
  } | null = null;
  const mapMark = dbMapMark.mapmark.find(
    (m) => m.data.EntityConfigId === levelEntity.data.EntityId
  );
  if (mapMark) {
    let group = id.startsWith("Gameplay") ? "gameplay" : "locations";
    if (eventIDs.includes(id)) {
      group = "events";
    }
    if (id === "Gameplay333") {
      group = "locations";
    }
    const iconIndex = worldMapIconSprite[0].Properties.Sprites.indexOf(
      mapMark.data.UnlockMarkPic
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
        "/Game/Aki/UI/UIResources/Common/Atlas/WorldMapIcon/"
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
          spriteInfo
        ),
        size: 1.5,
      });
      addedFilterIDs.push(id);
      if (addedIcons.includes(mapMark.data.UnlockMarkPic)) {
        console.warn(`Duplicate icon: ${mapMark.data.UnlockMarkPic}`);
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
        enDict[spawnId + "_desc"] =
          MultiText.find((m) => m.Id === mapMark.data.MarkDesc)?.Content ??
          mapMark.data.MarkDesc;
      }
    } else if (isTacticalHologram) {
      enDict[id] = "Tactical Hologram";
      spawnId = levelEntity.data.EntityId.toString();
      enDict[spawnId] =
        MultiText.find((m) => m.Id === mapMark.data.MarkTitle)?.Content ??
        mapMark.data.MarkTitle;
      if (mapMark.data.MarkDesc) {
        enDict[spawnId + "_desc"] =
          MultiText.find((m) => m.Id === mapMark.data.MarkDesc)?.Content ??
          mapMark.data.MarkDesc;
      }
    } else {
      enDict[id] =
        MultiText.find((m) => m.Id === mapMark.data.MarkTitle)?.Content ??
        mapMark.data.MarkTitle;
      if (isBossChallenge) {
        enDict[id] += " Boss Challenge";
      }
      if (mapMark.data.MarkDesc) {
        enDict[id + "_desc"] =
          MultiText.find((m) => m.Id === mapMark.data.MarkDesc)?.Content ??
          mapMark.data.MarkDesc;
      }
    }
  } else if (isMonster) {
    const level = levelEntity.data.ComponentsData?.AttributeComponent?.Level;
    if (level) {
      let name: string | null;
      const monsterMatchType =
        levelEntity.data.ComponentsData?.BaseInfoComponent?.Category
          ?.MonsterMatchType;
      if (monsterMatchType) {
        name = levelEntity.data.ComponentsData?.BaseInfoComponent?.TidName;
        if (!name) {
          console.warn(`Missing Monster Glowing name: ${id}`);
          continue;
        }
        id = `Monster_Glowing_${levelEntity.data.BlueprintType}`;
      } else {
        const spawner = sortedEntities.find((e) =>
          e.data.ComponentsData?.SpawnMonsterComponent?.SpawnMonsterConfigs?.find(
            (c: any) => c.TargetsToAwake?.includes(levelEntity.data.EntityId)
          )
        );
        if (!spawner) {
          // console.warn(`Missing spawner for ${id}`);
          continue;
        }

        const nodeData = dbLevelPlayNodeData.levelplaynodedata.find((d) =>
          d.data.Data.Condition?.MonsterCreatorEntityIds?.includes(
            spawner.EntityId
          )
        );
        if (!nodeData) {
          console.warn(`Missing node data for ${id}`);
          continue;
        }

        name = nodeData.data.Data.Condition?.TidMonsterGroupName ?? null;
        if (!name) {
          console.warn(`Missing Monster Group name: ${id}`);
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
              (m) => m.data.MonsterEntityID === levelEntity.data.BlueprintType
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
          console.warn(`Duplicate icon: ${iconPath}`);
        }
        addedIcons.push(iconPath);
      }

      // const group = "Monster_Glowing";
      // const category = filters.find((f) => f.group === group)!;
      console.log("Glowing", enDict[id], id);
    }
    if (enDict[id].startsWith("Phantom")) {
      continue;
    }
  } else {
    if (id === "Gameplay102") {
      continue;
    }
    if (id === "Gameplay422") {
      continue;
    }
    const template = dbTemplate.templateconfig.find(
      (c) => c.data.BlueprintType === levelEntity.data.BlueprintType
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
      iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/character_delapouite.webp`;
      iconName = "npc";
    }
    if (!iconPath || !iconName) {
      iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/uncertainty_lorc.webp`;
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
        console.warn(`Duplicate icon: ${iconPath}`);
      }
      addedIcons.push(iconPath);
    }
  }
  let oldNodes = nodes.find((n) => n.type === id);
  if (!oldNodes) {
    oldNodes = { type: id, spawns: [] };
    nodes.push(oldNodes);
    oldNodes = nodes.find((n) => n.type === id);
    // console.log("New type", id);
  }

  const x = levelEntity.data.Transform[0].X / levelEntity.data.Transform[2].X;
  const y = levelEntity.data.Transform[0].Y / levelEntity.data.Transform[2].Y;
  const mapName = WORLD.id;
  const location = { x, y };
  if (
    oldNodes!.spawns.some(
      (s) =>
        s.p[0] === location.y && s.p[1] === location.x && s.mapName === mapName
    )
  ) {
    continue;
  }

  const baseName =
    levelEntity.data.ComponentsData?.BaseInfoComponent?.TidName?.TidContent;
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
  const spawn: Node["spawns"][number] = {
    p: [+location.y, +location.x],
    mapName,
  };
  if (spawnId) {
    spawn.id = spawnId;
    if (spawnIcon) {
      spawn.icon = spawnIcon;
    }
    oldNodes!.spawns.push(spawn);
  } else {
    oldNodes!.spawns.push({
      p: [+location.y, +location.x],
      mapName,
    });
    if (mapMark && isMonster) {
      id = id.replace("BossChallenge_", "");
      let oldNodes = nodes.find((n) => n.type === id);
      if (!oldNodes) {
        oldNodes = { type: id, spawns: [] };
        nodes.push(oldNodes);
        oldNodes = nodes.find((n) => n.type === id);
      }

      oldNodes!.spawns.push({
        p: [+location.y, +location.x],
        mapName,
      });
    }
  }
}

writeNodes(nodes);

const sortPriority = [
  "events",
  "Monster_Glowing",
  "locations",
  "gameplay",
  "MonsterRarity_4",
  "MonsterRarity_3",
  "MonsterRarity_2",
  "MonsterRarity_1",
  "exile",
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
      a.group.toLowerCase().startsWith(p.toLowerCase())
    );
    const priorityB = sortPriority.findIndex((p) =>
      b.group.toLowerCase().startsWith(p.toLowerCase())
    );
    if (priorityA === priorityB) {
      return a.group.localeCompare(b.group);
    }
    return priorityA - priorityB;
  });
writeFilters(sortedFilters);
writeDict(enDict, "en");

type MonsterInfo = {
  monsterinfo: Array<{
    Id: number;
    data: {
      Id: number;
      Name: string;
      RarityId: number;
      Icon: string;
      BigIcon: string;
      Tachine: string;
      ElementId: number;
      MonsterEntityID: string;
      MonsterPose: string;
      UndiscoveredDes: string;
      DiscoveredDes: string;
      PerchId: Array<number>;
    };
  }>;
  monsterrarity: Array<{
    Id: number;
    data: {
      Id: number;
      RarityDesc: string;
    };
  }>;
  monsterperch: Array<{
    Id: number;
    data: {
      Id: number;
      PerchDes: string;
    };
  }>;
  monsterbattleconf: Array<{
    Id: number;
    data: {
      Id: number;
      ExecutionId: Array<number>;
      ExecutionRadius: number;
      ForceLockOnCoefficient: number;
      MonsterSizeId: number;
    };
  }>;
  executionconf: Array<{
    Id: number;
    data: {
      Id: number;
      ExecutionRoleId: number;
      ExecutionSkillId: number;
      LimitExecutionTags: Array<string>;
    };
  }>;
  monstersizeid: Array<{
    Id: number;
    data: {
      Id: number;
      MonsterSizeTag: Array<string>;
    };
  }>;
  monsterbodytypeconfig: Array<{
    Id: number;
    data: {
      Id: number;
      HandBookCameraId: string;
      MoveForwardDistance: number;
      MoveForwardDuration: number;
      MoveForwardCurvePath: string;
    };
  }>;
};

export type DBMapMark = {
  taskmark: Array<{
    MarkId: number;
    data: {
      MarkId: number;
      MarkPic: string;
      MarkAcceptablePic: string;
      NpcTaskIcon: string;
      IconDistant: number;
      TrackTextStartEffectColor: string;
      ShowRange: Array<number>;
      ShowPriority: number;
      Scale: number;
    };
  }>;
  custommark: Array<{
    MarkId: number;
    data: {
      MarkId: number;
      MarkPic: string;
      ShowRange: Array<number>;
      ShowPriority: number;
      Scale: number;
    };
  }>;
  temporaryteleportmark: Array<{
    MarkId: number;
    data: {
      MarkId: number;
      MarkPic: string;
      MarkTitle: string;
      MarkDesc: string;
      ShowPriority: number;
      ShowRange: Array<number>;
      Scale: number;
    };
  }>;
  soundboxmark: Array<{
    MarkId: number;
    data: {
      MarkId: number;
      MarkPic: string;
      MarkTitle: string;
      MarkDesc: string;
      ShowPriority: number;
      ShowRange: Array<number>;
      Scale: number;
    };
  }>;
  treasureboxmark: Array<{
    MarkId: number;
    data: {
      MarkId: number;
      MarkPic: string;
      MarkTitle: string;
      MarkDesc: string;
      ShowPriority: number;
      ShowRange: Array<number>;
      Scale: number;
    };
  }>;
  treasureboxdetectormark: Array<{
    MarkId: number;
    data: {
      MarkId: number;
      MarkPic: string;
      MarkTitle: string;
      MarkDesc: string;
      ShowPriority: number;
      ShowRange: Array<number>;
      Scale: number;
    };
  }>;
  dynamicmapmark: Array<{
    MarkId: number;
    MapId: number;
    RelativeSubType: number;
    FogHide: number;
    data: {
      MarkId: number;
      MapId: number;
      RelativeSubType: number;
      FogHide: number;
      RelativeType: number;
      RelativeId: number;
      MarkVector: {
        X: number;
        Y: number;
        Z: number;
      };
      EntityConfigId: number;
      ObjectType: number;
      MarkTitle: string;
      MarkDesc: string;
      ToBeDiscovered: number;
      IsMonster: number;
      ShowPriority: number;
      ShowRange: Array<number>;
      LockMarkPic: string;
      UnlockMarkPic: string;
      ShowCondition: number;
      FogShow: number;
      MapShow: number;
      Scale: number;
      FirstReward: number;
      Reward: number;
    };
  }>;
  relativesubtype: Array<{
    Id: number;
    FunctionId: number;
  }>;
  mapmarkrelativesubtype: Array<{
    Id: number;
    FunctionId: number;
    data: {
      Id: number;
      FunctionId: number;
      Position: {
        X: number;
        Y: number;
        Z: number;
      };
      Scale: number;
    };
  }>;
  mapmark: Array<{
    MarkId: number;
    MapId: number;
    RelativeType: number;
    RelativeSubType: number;
    EntityConfigId: number;
    FogHide: number;
    data: {
      MarkId: number;
      MapId: number;
      RelativeType: number;
      RelativeSubType: number;
      EntityConfigId: number;
      FogHide: number;
      RelativeId: number;
      MarkVector: {
        X: number;
        Y: number;
        Z: number;
      };
      ObjectType: number;
      MarkTitle: string;
      MarkDesc: string;
      ToBeDiscovered: number;
      IsMonster: number;
      ShowPriority: number;
      ShowRange: Array<number>;
      LockMarkPic: string;
      UnlockMarkPic: string;
      ShowCondition: number;
      FogShow: number;
      MapShow: number;
      Scale: number;
      FirstReward: number;
      Reward: number;
    };
  }>;
  mapmarkphantomgroup: Array<{
    MarkId: number;
    data: {
      MarkId: number;
      ShowRange: Array<number>;
    };
  }>;
  markeffect: Array<{
    MarkId: number;
    data: {
      MarkId: number;
      EffectResourcePath: string;
    };
  }>;
};

export type WorldMapIconSprite = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    Version: string;
    Sprites: Array<string>;
    AtlasTextures: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    SpriteAtlasTextureMap: Array<{
      Key: string;
      Value: number;
    }>;
    SpriteInfoMap: Array<{
      Key: string;
      Value: {
        width: number;
        height: number;
        borderLeft: number;
        borderRight: number;
        borderTop: number;
        borderBottom: number;
        paddingLeft: number;
        paddingRight: number;
        paddingTop: number;
        paddingBottom: number;
        uv0X: number;
        uv0Y: number;
        uv3X: number;
        uv3Y: number;
        buv0X: number;
        buv0Y: number;
        buv3X: number;
        buv3Y: number;
      };
    }>;
  };
}>;

export type DBTemplate = {
  templateconfig: Array<{
    Id: number;
    BlueprintType: string;
    data: {
      Id: number;
      BlueprintType: string;
      Name: string;
      ComponentsData: {
        BaseInfoComponent: {
          TidName: string;
          Category: {
            MainType?: string;
            CollectType?: string;
            DestructibleType?: string;
            ExploratoryDegree?: number;
            MonsterMatchType?: number;
            ControlMatchType?: string;
            ItemFoundation?: string;
            EntityPlotBindingType?: string;
            NpcType?: number;
            BulletPenetrationType?: string;
          };
          Camp: number;
          AoiLayer: number;
          OnlineInteractType: number;
          EntityPropertyId: number;
          AoiZRadius: number;
          IsOnlineStandalone?: boolean;
          IsShowNameOnHead?: boolean;
          ScanFunction?: {
            ScanId: number;
            IsConcealed: boolean;
          };
          HeadStateViewConfig?: {
            HeadStateViewType: number;
            ZOffset: number;
            ForwardOffset: number;
          };
          NotAllowHidedByTargetRange?: boolean;
          FocusPriority?: number;
          Occupation?: string;
          Disabled?: boolean;
          HeadInfo?: number;
          MapIcon?: number;
        };
        RangeComponent?: {
          Shape: {
            Type: string;
            Center: {
              X: number;
              Y: number;
              Z: number;
            };
            Size?: {
              X: number;
              Y: number;
              Z: number;
            };
            Radius?: number;
            Height?: number;
          };
          Disabled?: boolean;
        };
        ModelComponent?: {
          HalfHeight?: number;
          Disabled?: boolean;
          ModelType: {
            Type: string;
            ModelId?: number;
            BlueprintPath?: string;
            PrefabPath?: string;
            PrefabStateList?: Array<{
              SceneInteractionState: number;
              LevelTag: number;
            }>;
            EffectStateList?: Array<any>;
          };
          TrackHeight?: number;
        };
        SceneBulletComponent?: {
          BulletGroups: Array<{
            EntityState: string;
            BulletId: number;
            Range?: {
              X: number;
              Y?: number;
              Z: number;
            };
            Offset?: {
              Z: number;
            };
          }>;
          Disabled?: boolean;
        };
        EntityStateComponent?: {
          Type: string;
          State: string;
          LockConfig: {
            LockType: string;
            IsInitLock: boolean;
          };
          Disabled?: boolean;
          StateChangeBehaviors?: Array<{
            State: string;
            Action?: Array<{
              Name: string;
              Params: {
                ResetFocus?: {
                  FadeInTime: number;
                  FadeInCurve: {
                    Type: number;
                    N: number;
                  };
                };
                Type?: {
                  Type: string;
                  BulletId: number;
                  Launcher: {
                    Type: string;
                  };
                  Target?: {
                    Type: string;
                  };
                };
                EntityIds?: Array<any>;
                IsSelf?: boolean;
                Location?: number;
                CameraShakeBp?: string;
                CameraShakeConfig?: {
                  Type: string;
                };
                Level?: string;
                Content?: string;
                BuffIds?: Array<number>;
                Time?: number;
                IsEnable?: boolean;
                TeleportId?: number;
                Pos?: {};
                FadeInTime?: number;
                StayTime?: number;
                FadeOutTime?: number;
                LockCamera?: boolean;
                EntityState?: string;
              };
              ActionGuid: string;
              ActionId: number;
              Async?: boolean;
            }>;
            DelayChangeState?: {
              Time: number;
              NewState: string;
            };
          }>;
          StateConfigs?: Array<{
            State: string;
            Duration: number;
          }>;
          PrefabPerformanceType?: string;
          StateChangeCondition?: {
            Type: number;
            Conditions: Array<{
              Type: string;
              State: string;
              Compare: string;
            }>;
          };
        };
        InteractComponent?: {
          Range: number;
          DoIntactType: string;
          Options: Array<{
            TidContent?: string;
            Type: {
              Type: string;
              Actions?: Array<{
                Name: string;
                Params: {
                  EntityState?: string;
                  SystemType?: string;
                  BoardId?: number;
                  TelePortConfig?: {
                    Type: number;
                    TargetPos: {
                      X: number;
                      Y: number;
                      Z: number;
                      A: number;
                    };
                  };
                  EventType?: string;
                  IsSelf?: boolean;
                  Location?: number;
                  Option?: {
                    Type: string;
                  };
                  TeleportId?: number;
                  DungeonId?: number;
                  IsRegroup?: boolean;
                  FlowListName?: string;
                  FlowId?: number;
                  StateId?: number;
                  IsNeedSecondaryConfirmation?: boolean;
                  ActionMontage?: string;
                  GameplayConfig?: {
                    Type: string;
                    Config: Array<{
                      Color: string;
                    }>;
                  };
                  FinishSendSelfEvent?: string;
                  Level?: string;
                  Content?: string;
                  Type: any;
                  IsEnable?: boolean;
                  DisplayMode?: string;
                  Time?: number;
                  Pos?: {
                    X: number;
                    Y: number;
                    Z: number;
                  };
                  FadeInTime?: number;
                  StayTime?: number;
                  FadeOutTime?: number;
                  LockCamera?: boolean;
                  BuffIds?: Array<number>;
                  Path?: string;
                  Pos2?: {
                    Type: number;
                    Offset: {
                      X: number;
                      Y: number;
                      Z: number;
                    };
                  };
                  SystemOption?: {
                    Type: string;
                    UnlockOption: {
                      Type: string;
                      Id: number;
                    };
                  };
                  EventConfig?: {
                    Type: string;
                    AkEvent: string;
                  };
                  EntityIds?: Array<any>;
                  GeneralTextId?: number;
                };
                ActionId: number;
                ActionGuid: string;
                Async?: boolean;
              }>;
              Flow?: {
                FlowListName: string;
                FlowId: number;
                StateId: number;
              };
            };
            Condition?: {
              Type: number;
              Conditions: Array<{
                Type: string;
                State?: string;
                Compare?: string;
                StateType?: string;
                SystemId?: number;
                InCombat?: boolean;
                IsSelf?: boolean;
                Location?: number;
                BuffId?: number;
                RestrictionId?: number;
              }>;
            };
            Guid?: string;
            UniquenessTest?: string;
            Icon?: string;
          }>;
          TurnAroundType?: string;
          Disabled?: boolean;
          InteractDefaultIcon?: string;
          TidContent?: string;
          MatchRoleOption?: Array<{
            Type: string;
            Id: number;
          }>;
          InteractIcon?: string;
          SectorRange?: {
            Begin: number;
            End: number;
          };
          InteractPointOffset?: {
            X?: number;
            Y?: number;
            Z?: number;
          };
          RandomInteract?: {
            RandomCount: number;
            Options: Array<{
              Weight: number;
              Option: {
                TidContent: string;
                Guid: string;
                Type: {
                  Type: string;
                  Flow: {
                    FlowListName: string;
                    FlowId: number;
                    StateId: number;
                  };
                };
              };
            }>;
          };
          ExitRange?: number;
          PreFlow?: {
            FlowListName: string;
            FlowId: number;
            StateId: number;
          };
        };
        AdsorbComponent?: {
          Range: number;
          StartVelocity: number;
          Acceleration: number;
          AdsorbLimitedTime: number;
          Disabled?: boolean;
        };
        RewardComponent?: {
          RewardId: number;
          RewardType: number;
          Disabled?: boolean;
          DropOnEvent?: number;
        };
        AiComponent?: {
          AiId: number;
          Disabled?: boolean;
          WeaponId?: string;
          InitState?: {
            Type: number;
            BirthTag: string;
          };
          AiTeamLevelId?: number;
          Patrol?: {
            SplineEntityId?: number;
            IsCircle: boolean;
            Spline?: string;
          };
        };
        AttributeComponent?: {
          PropertyId: number;
          Level: number;
          WorldLevelBonusId: number;
          RageModeId: number;
          HardnessModeId: number;
          WorldLevelBonusType: {
            Type: number;
            WorldLevelBonusId?: number;
          };
          MonsterPropExtraRateId: number;
          FightMusic?: string;
          AppendBuffIds?: Array<number>;
          Disabled?: boolean;
        };
        CombatComponent?: {};
        VisionComponent?: {
          VisionId: number;
        };
        VarComponent?: {
          Vars: Array<any>;
          Disabled?: boolean;
        };
        NpcPerformComponent?: {
          IsStare: boolean;
          IsShowStrike: boolean;
          ShowOnStandby?: {
            Type: string;
            Montage?: string;
            PlayMode?: string;
            Montages?: Array<{
              Montage: string;
              Time: number;
            }>;
          };
          NpcHitShow?: {
            HitMontage: string;
            HitBubble: {
              FlowListName: string;
              FlowId: number;
              StateId?: number;
            };
            BubbleRate: number;
          };
          Disabled?: boolean;
          ShowOnUiInteract?: {
            Type: string;
            EnterMontage: string;
            StandByMontage: string;
            ShopSuccessMontage: string;
            EnterFlow?: {
              FlowListName: string;
              FlowId: number;
              StateId: number;
            };
            ShopSuccessFlow?: {
              FlowListName: string;
              FlowId: number;
              StateId: number;
            };
            ShopFailedFlow?: {
              FlowListName: string;
              FlowId: number;
              StateId: number;
            };
            UpgradeSequence?: string;
          };
        };
        BubbleComponent?: {
          NpcIds: Array<any>;
          Flows: Array<{
            Flow: {
              FlowIndex: {
                FlowListName: string;
                FlowId: number;
              };
              WaitTime: number;
            };
          }>;
          EnterRange: number;
          LeaveRange: number;
          Disabled?: boolean;
        };
        EntityVisibleComponent?: {
          DelayChange: boolean;
          UseFadeEffect: boolean;
          VisibleConditions: Array<{
            Conditions: Array<{
              Type: string;
              Compare: string;
              PreQuestId?: number;
              Start?: number;
              End?: number;
              TimePeriod?: string;
            }>;
          }>;
          Disabled?: boolean;
          UseCutEffect?: boolean;
          UseHolographicEffect?: boolean;
        };
        LevelAiComponent?: {
          Disabled: boolean;
          States: Array<any>;
        };
        RefreshComponent?: {
          RefreshRule: {
            Type: string;
            Cd?: number;
            Hours?: number;
            Minutes?: number;
            Seconds?: number;
            RefreshRate?: number;
          };
          Disabled?: boolean;
          IsDisableRefreshAfterDroppingReward?: boolean;
        };
        CollectComponent?: {
          Disabled?: boolean;
        };
        AnimalComponent?: {
          IsStare: boolean;
          Disabled?: boolean;
          AnimalAttackRange?: number;
        };
        InteractAudioComponent?: {
          CollisionMaterial?: string;
          Disabled?: boolean;
          InteractEventConfig?: {
            CollectAkEvent: string;
          };
        };
        SceneItemLifeCycleComponent?: {
          CreateStageConfig: {
            PerformDuration?: number;
            Actions?: Array<{
              Name: string;
              Params: {
                EntityIds: Array<any>;
              };
              ActionGuid: string;
              ActionId: number;
            }>;
            BulletConfig?: {
              BulletId: number;
              Delay: number;
            };
          };
          DestroyStageConfig: {
            PerformDuration?: number;
            BulletId?: number;
          };
          Disabled?: boolean;
        };
        AttachTargetComponent?: {
          Disabled: boolean;
        };
        DestructibleItem?: {
          DurabilityId: number;
          Durability: number;
          HitPoint: {
            Z?: number;
          };
          HitBullet?: {
            Type: string;
            BulletId: Array<number>;
          };
          Disabled?: boolean;
          DurabilityStateConfig?: {
            NonDestructable: boolean;
            DurabilityStates: Array<{
              State: string;
              Durability: number;
            }>;
          };
          WeaponDamage?: {
            DefaultValue: number;
            GreatSword: number;
            Dagger?: number;
            Pugilism?: number;
            Pistol?: number;
            Ring?: number;
          };
          SkillDamage?: {
            DefaultValue: number;
            ExploreVersion?: number;
            QteAttack?: number;
            SuperSkill?: number;
            NormalSkill?: number;
            FightVersion?: number;
          };
          AttackerHitTimeScaleRatio?: {
            TimeRatio: number;
            ValueRatio: number;
          };
          VictimHitTimeScaleRatio?: {
            TimeRatio: number;
            ValueRatio: number;
          };
        };
        FightInteractComponent?: {
          LockRange: number;
          Disabled?: boolean;
          LockOffset: {
            X: number;
            Y: number;
            Z: number;
          };
        };
        TeleportComponent?: {
          TeleporterId?: number;
          TeleportPos: {
            X: number;
            Y: number;
            Z: number;
            A: number;
          };
          Disabled?: boolean;
        };
        NearbyTrackingComponent?: {
          IsEnable: boolean;
          TrackingType: {
            Type: string;
            ShowRange?: number;
            HideRange?: number;
            TexturePath?: string;
            UiOffset?: {
              Z?: number;
              X?: number;
            };
            Duration?: number;
            NearRadius?: number;
            MiddleRadius?: number;
            FarRadius?: number;
          };
          Disabled?: boolean;
          IsEnbaleWhileHoming?: boolean;
          IsEnableWhileUnlock?: boolean;
        };
        VisionCaptureComponent?: {
          VisionCaptureId: number;
          Disabled?: boolean;
        };
        MonsterComponent?: {
          FightConfigId: number;
          BossViewConfig?: {
            BossStateViewType: number;
            BossStateInfoShowType?: number;
            TidBossSubTitle: string;
          };
          Disabled?: boolean;
          InitGasTag?: Array<string>;
          SpecialHateAndSenseConfig?: number;
        };
        TreasureBoxComponent?: {
          TypeId: number;
        };
        TriggerComponent?: {
          ExitConfig?: {
            Actions: Array<{
              Name: string;
              Params: {
                BuffIds?: Array<number>;
                EntityState?: string;
                Visible?: boolean;
                EntityIds?: Array<any>;
                Type?: string;
                EntityId?: number;
                State?: string;
                Level?: string;
                Content?: string;
                ResetFocus?: {
                  FadeInTime: number;
                  FadeInCurve: {
                    Type: number;
                    N: number;
                  };
                };
              };
              ActionGuid: string;
              ActionId: number;
            }>;
            Condition?: {
              Type: number;
              Conditions: Array<{
                Type: string;
                Compare: string;
                State?: string;
                EntityId?: number;
                BuffId?: number;
              }>;
            };
          };
          Match: {
            OnlyPlayer?: boolean;
            Categories?: Array<{
              ControlMatchType: string;
            }>;
            States?: Array<any>;
          };
          Actions: Array<{
            Name: string;
            Params: {
              Level?: string;
              Content?: string;
              EntityState?: string;
              BuffIds?: Array<number>;
              Id?: number;
              X?: number;
              Y?: number;
              Z?: number;
              Option?: {
                Type: string;
                Priority?: number;
                FadeInTime?: number;
                FadeOutTime?: number;
                ArmLength?: number;
                MinumArmLength?: number;
                MaxiumArmLength?: number;
                Offset?: {
                  X: number;
                  Y: number;
                  Z: number;
                };
                Fov?: number;
                AxisRotate?: {
                  Y: number;
                };
                ScreenConfig?: {
                  TriggerAngle: number;
                  FadeInTime: number;
                  FadeOutTime: number;
                };
                IsDisableResetFocus?: boolean;
                FadeOutCurve?: {
                  Type: number;
                  N: number;
                };
                FadeInCurve?: {
                  Type: number;
                  N: number;
                };
                Height?: number;
                Time?: number;
                MotionCurve?: string;
                Param?: {
                  P1: {
                    X: number;
                    Y: number;
                    Z: number;
                  };
                  P2: {
                    X: number;
                    Y: number;
                    Z: number;
                  };
                };
                TargetPosition?: {};
                OverlayArmLength?: number;
              };
              GeneralTextId?: number;
              TipOption?: {
                Type: number;
                TidMainText: string;
              };
              Time?: number;
              Type: any;
              EntityId?: number;
              State?: string;
              Visible?: boolean;
              EntityIds?: Array<any>;
              CameraShakeBp?: string;
              CameraShakeConfig?: {
                Type: string;
              };
            };
            ActionGuid: string;
            ActionId: number;
          }>;
          Condition?: {
            Type: number;
            Conditions: Array<{
              Type: string;
              Compare?: string;
              State?: string;
              RestrictionId?: number;
              EntityId?: number;
              Option?: {
                Type: string;
                Option: string;
                AttributeTypes: Array<{
                  Type: string;
                  Compare: string;
                  Value: number;
                }>;
              };
              BuffId?: number;
              RoleId?: number;
            }>;
          };
          Disabled?: boolean;
          MatchRoleOption?: Array<{
            Type: string;
            Id: number;
          }>;
          MaxTriggerTimes?: number;
          ChangeRoleTrigger?: boolean;
        };
        HookLockPoint?: {
          Range: {
            Center: {
              X: number;
              Y: number;
              Z: number;
            };
            Radius: number;
          };
          InheritSpeed: boolean;
          NormalEffect: string;
          IsClimb: boolean;
          HookLockCd?: number;
        };
        TeleControl2?: {
          BaseCfg: {
            CommonConfig: string;
            CanRotate?: boolean;
          };
          ThrowCfg: {
            MotionConfig: {
              Type: string;
              Velocity: number;
              AngularVelocity: number;
              MatchSpeedCurve?: {
                SpeedCurve: string;
              };
              CameraShake?: string;
              VelocityCurve?: string;
            };
          };
          Disabled?: boolean;
          BulletCfg?: {
            CreateConditions: Array<{
              Type: string;
              BulletId: number;
              TriggerTime?: number;
            }>;
          };
          DestroyCfg?: {
            Conditions: Array<{
              Type: string;
            }>;
          };
          SearchTargetCfg?: {
            AngleWeight: Array<{
              Angle: number;
              Weight: number;
            }>;
            LockConditions: Array<{
              EntitiyMatch: {
                CategoryType?: string;
                Category?: {
                  MainType?: string;
                  ItemFoundation?: string;
                  DestructibleType?: string;
                };
              };
              Weight: number;
            }>;
          };
        };
        ResetSelfPosComponent?: {
          Disabled: boolean;
          ResetRadius: number;
          IsResetPosAfterThrow?: boolean;
          ResetPosDelayTime?: number;
          IsDisableResetPosAfterThrow?: boolean;
        };
        ItemFoundation2?: {
          Config: {
            Type: string;
            MatchingConfigs?: Array<{
              Condition: {
                EntityMatch: {
                  Category: {
                    ControlMatchType: string;
                  };
                  State?: {
                    Type: string;
                    State: string;
                  };
                };
                SelfState?: string;
              };
              Animation: {
                MatchPos: {
                  X: number;
                  Y: number;
                  Z: number;
                };
                MatchRot: {
                  X: number;
                  Y: number;
                  Z: number;
                };
                MatchSequence?: string;
                MatchSequenceOffset?: {
                  Y: number;
                };
              };
              Callback: {
                ChangeSelfState?: string;
                IsDestroy?: boolean;
                ChangeAdsorbateState?: {};
                DischargeSequence?: string;
                IsSilent?: boolean;
              };
            }>;
          };
          Disabled?: boolean;
        };
        ResetEntitiesPosComponent?: {
          Range: {
            Type: string;
            Center: {
              X: number;
              Y: number;
              Z: number;
            };
            Size?: {
              X: number;
              Y: number;
              Z: number;
            };
            Radius?: number;
          };
          EntityIds: Array<any>;
          Disabled?: boolean;
        };
        EntityGroupComponent?: {
          EntityIds: Array<any>;
          StateTriggers: Array<{
            GroupCondition: {
              Conditions: Array<any>;
            };
          }>;
          FinishState: {
            GroupCondition: {
              Conditions: Array<any>;
            };
            IsSilenceEntities: boolean;
          };
          Disabled?: boolean;
        };
        TrampleComponent?: {
          Match: {
            OnlyPlayer: boolean;
            Categories: Array<{
              ControlMatchType: string;
            }>;
            States?: Array<any>;
          };
          DownTime: number;
          StayTime: number;
          IsResetGear: boolean;
          MatchRoleOption?: Array<{
            Type: string;
            Id?: number;
          }>;
          ShowLandTipRadius?: {
            EnterRadius: number;
            LeaveRadius: number;
          };
        };
        InteractGearComponent?: {
          NormalPrepareTime: number;
          ActivePrepareTime: number;
          Disabled?: boolean;
        };
        SceneItemMovementComponent?: {
          Disabled?: boolean;
        };
        LiftComponent?: {
          InitialFloor: number;
          StayPositions: Array<{
            Z?: number;
          }>;
          MaxSpeed: number;
          UniformMovement: boolean;
          TurnTime: number;
          Disabled?: boolean;
        };
        WeaponComponent?: {
          WeaponId: number;
        };
        DropComponent?: {};
        TargetGearComponent?: {
          IsCycle: boolean;
          CycleInterval: number;
          HitLogicType: {
            Type: string;
            TargetState?: string;
          };
          CycleStates: Array<string>;
          Type: string;
          Disabled?: boolean;
          HitCd?: number;
          HitBullet?: {
            Type: string;
            BulletId?: Array<number>;
          };
        };
        SceneActorRefComponent?: {
          ActorRefGroups: Array<{
            EntityState: string;
            Actions: Array<{
              Name: string;
              Params: {
                LevelSequencePath?: string;
                Mark?: string;
                Option?: {
                  Type: string;
                  AirWallEffectData?: string;
                  AirWallEffectHeight?: number;
                  CollisionPreset?: number;
                  AirWallEffectThickness?: number;
                };
                ActorRefs?: Array<any>;
              };
              ActionGuid: string;
              ActionId: number;
            }>;
          }>;
          Disabled?: boolean;
          VolumesRef?: Array<any>;
        };
        RefreshGroupComponent?: {
          EntityIds: Array<any>;
          RefreshRule: {
            Type: string;
            Hours?: number;
            Minutes?: number;
            Seconds?: number;
            Cd?: number;
          };
          Disabled?: boolean;
          RefreshContent: {
            Type: string;
            EntityIds: Array<number>;
          };
          StateChangeConfig?: {
            RefreshState: string;
            SubDestroyState: string;
          };
        };
        EntityPackageComponent?: {
          BindTemplate: boolean;
          PackageData?: {
            PackagedLevelId: number;
            PackageEntityId: number;
            PackageTree: Array<{
              EntityId: number;
              Children?: Array<{
                EntityId: number;
              }>;
            }>;
          };
        };
        TargetGearGroupComponent?: {
          Type: string;
          GroupConfigs: Array<{
            SuccessCondition: {
              Type: string;
              State: string;
            };
            Entitys: Array<any>;
            FailureConditions: Array<any>;
          }>;
        };
        StateHintComponent?: {
          ActiveConditions: Array<any>;
        };
        BuffProducerComponent?: {
          BuffId: number;
          AddBuffMode: {
            Type: string;
            BulletOffset: {
              Z: number;
              X?: number;
              Y?: number;
            };
            BulletId: number;
          };
        };
        BuffConsumerComponent?: {
          BuffId: number;
          BulletId: number;
        };
        VisionItemComponent?: {};
        FollowTrackComponent?: {
          Range: number;
          EndType: {
            Type: number;
            FoundationId: number;
            FinalOffset: {
              X: number;
              Y: number;
              Z: number;
            };
          };
          SplineEntityId: number;
        };
        ConditionListenerComponent?: {
          Listeners: Array<{
            Condition: {
              Type: number;
              Conditions: Array<{
                Type: string;
                EventKey?: string;
                Start?: {
                  Hour: number;
                  Min: number;
                };
                End?: {
                  Hour: number;
                  Min: number;
                };
                Compare?: string;
                State?: string;
                TimePeriod?: string;
              }>;
            };
            Actions: Array<{
              Name: string;
              Params: {
                EntityState: string;
              };
              ActionGuid: string;
              ActionId: number;
            }>;
          }>;
          Disabled?: boolean;
        };
        SkyboxComponent?: {
          FadeTime: number;
        };
        DungeonEntryComponent?: {};
        SpawnMonsterComponent?: {
          ActiveType: {
            Type: number;
          };
          SpawnMonsterConfigs: Array<any>;
        };
        LevelPlayComponent?: {
          LevelPlayId: number;
        };
        EntityStateAudioComponent?: {
          Config: Array<{
            State: string;
            AkEvent: string;
            LeaveAkEvent?: string;
          }>;
          AudioRangeType: string;
          AkEventType: {
            Type: string;
            AudioType?: string;
            Priority?: number;
          };
        };
        EntityListComponent?: {};
        AdviseItemComponent?: {};
        ResurrectionComponent?: {
          TeleportPos: {
            X: number;
            Y: number;
            Z: number;
            A: number;
          };
        };
        GuideLineCreatorComponent?: {
          SplineEntityId: number;
          ColorChangeOption?: {
            Type: string;
            RedState: string;
            YellowState: string;
            BlueState: string;
          };
        };
        SplineComponent?: {
          Option: {
            Type: string;
            Points: Array<any>;
          };
        };
        CombinedVisibleGroupComponent?: {
          AreaIds: Array<any>;
          IncludeSubArea: boolean;
          EntityIds: Array<any>;
        };
        EditCustomAoiComponent?: {
          Entities: Array<any>;
        };
        TurntableControlComponent?: {
          Config: {
            Type: string;
            ItemConfig: Array<{
              InitAngle: number;
              TargetAngle: number;
              RotateAngle: number;
            }>;
            RotationSpeed: number;
          };
        };
        JigsawItem?: {
          FillCfg: {
            Type: string;
            Centre?: {
              RowIndex: number;
              ColumnIndex: number;
            };
            Config?: {
              Row: number;
              Column: number;
              Size: number;
              Pieces: Array<{
                Index: {
                  RowIndex: number;
                  ColumnIndex: number;
                };
                Active: boolean;
                IsCorrect: boolean;
                InitState: string;
              }>;
            };
            ModelId?: number;
            W?: boolean;
            S?: boolean;
            A?: boolean;
            D?: boolean;
          };
          Disabled?: boolean;
        };
        JigsawFoundation?: {
          PlaceOffset: {
            X?: number;
            Y?: number;
            Z: number;
          };
          CompleteCondition: {
            Config?: Array<{
              Jigsaw: {
                Row: number;
                Column: number;
                Size: number;
                Pieces: Array<{
                  Index: {
                    RowIndex: number;
                    ColumnIndex: number;
                  };
                  Active: boolean;
                  IsCorrect: boolean;
                  InitState: string;
                }>;
              };
              SelfState: string;
            }>;
            Type: string;
          };
          JigsawConfig: {
            Row: number;
            Column: number;
            Size: number;
            Pieces: Array<{
              Index: {
                RowIndex: number;
                ColumnIndex: number;
              };
              Active: boolean;
              IsCorrect: boolean;
              InitState: string;
            }>;
          };
          ModelId?: number;
          CompletedConfig?: {
            IsSilentPiece: boolean;
            IsSilentFoundation: boolean;
          };
          InitMatchList?: Array<any>;
        };
        ReboundComponent?: {
          BulletId: number;
          Option: {
            Type: string;
            ReboundPoint: {
              X: number;
              Y: number;
              Z: number;
            };
          };
          Disabled: boolean;
        };
        FanComponent?: {
          EffectConfig: {
            EffectPath: string;
            DefaultEffectLength: number;
          };
          CirclePerRound: number;
          InitCircle: number;
        };
        MonsterGachaItemComponent?: {
          MonsterEntityIds: Array<any>;
          MonsterType: number;
          MaterialDataPath: string;
        };
        LevitateMagnetComponent?: {
          MoveSpeed: number;
        };
        PhotoTargetComponent?: {
          RequiredPoints: Array<any>;
        };
        MonsterGachaBaseComponent?: {
          Config: Array<{
            Pos: {
              X: number;
              Y: number;
              Z: number;
            };
          }>;
          Formation: Array<{
            FormationPosConfig: Array<number>;
          }>;
          MonsterEntityIds: Array<any>;
        };
        AiAlertNotifyComponent?: {
          ExtraAiAlert: {};
        };
        ConveyorBeltComponent?: {
          StateGroups: Array<{
            EntityState: string;
            FieldType: {
              Type: string;
              Direction: {
                X: number;
                Y: number;
                Z: number;
              };
            };
            MoveType: {
              Type: string;
              Speed: number;
            };
          }>;
        };
        ProgressBarControlComponent?: {
          Control: {
            Type: string;
            MaxValue: number;
            InitValue: number;
            IncreaseSpeed: number;
            DecreaseSpeed: number;
            EntitiyMatch: {
              CategoryType: string;
            };
            EnemyEntitiyMatch: {
              CategoryType: string;
              Category: {
                DestructibleType: string;
              };
            };
          };
        };
        ExploreSkillInteractComponent?: {
          Option: {
            Type: string;
            PullTime: number;
            Actions: Array<any>;
          };
        };
        DynamicTeleportComponent?: {
          Offset: {
            X: number;
            Y: number;
            Z: number;
            A: number;
          };
          PhantomSkillId: number;
        };
        RotatorComponent2?: {
          Config: Array<{
            State: string;
            IsLoop: boolean;
            RotationConfig: Array<{
              Axis: {
                Y: number;
              };
              Angle: number;
              Type: string;
              Time: number;
              Cd?: number;
            }>;
            RotatePoint: string;
          }>;
          Disabled: boolean;
        };
        PasserbyNpcSpawnComponent?: {
          MoveConfig: {
            Type: string;
            Routes: Array<any>;
          };
          SpawnConfig: {
            Type: string;
            Interval: number;
            MaxSpawnCount: number;
          };
          SourceConfig: {
            Type: string;
            TemplateIds: Array<any>;
          };
        };
      };
    };
  }>;
};

export type DBDrop = {
  dropunit: Array<{
    Id: number;
  }>;
  droppackage: Array<{
    Id: number;
    data: {
      Id: number;
      ShowBg: boolean;
      Title: string;
      DropPlan: number;
      DropPreview: {};
    };
  }>;
  dropgroup: Array<{
    UnitId: number;
    data: {
      UnitId: number;
      GroupId: number;
      MinNum: number;
      MaxNum: number;
      Interval: number;
      DropShowPlan: number;
    };
  }>;
  dropshowplan: Array<{
    Id: number;
    data: {
      Id: number;
      Force: Array<number>;
      Angle: Array<number>;
      VerticalAngle: Array<number>;
      ShowBg: number;
      ShowTime: number;
      ShowCout: number;
      Adsorption: number;
    };
  }>;
  dropplan: Array<{
    Id: number;
    data: {
      Id: number;
    };
  }>;
};

export type DBItems = {
  iteminfo: Array<{
    Id: number;
    ItemType: number;
    data: {
      Id: number;
      ItemType: number;
      Name: string;
      ShowTypes: Array<number>;
      AttributesDescription: string;
      BgDescription: string;
      Icon: string;
      IconMiddle: string;
      IconSmall: string;
      Mesh: string;
      QualityId: number;
      MainTypeId: number;
      RedDotDisableRule: number;
      UseCountLimit: number;
      SortIndex: number;
      MaxCapcity: number;
      MaxStackableNum: number;
      DecomposeInfo: {};
      UseLevel: number;
      BeginTimeStamp: number;
      DurationStamp: number;
      ItemAccess: Array<number>;
      Parameters: {};
      ShowUseButton: boolean;
      ObtainedShow: number;
      ObtainedShowDescription: string;
      CompositeItem: Array<number>;
      EntityConfig: number;
      NumLimit: number;
      ShowInBag: boolean;
      Destructible: boolean;
      ItemBuffType: number;
      SpecialItem: boolean;
      UiPlayItem: boolean;
      IsBuffItem: boolean;
    };
  }>;
  typeinfo: Array<{
    Id: number;
    data: {
      Id: number;
      TypeDescription: string;
      Lock: boolean;
      SortIndex: number;
      ItemInfoDisplayType: number;
    };
  }>;
  qualityinfo: Array<{
    Id: number;
    data: {
      Id: number;
      Name: string;
      TextColor: string;
      DropColor: string;
      FrameIconColor: string;
      BackgroundColor: any;
      PhantomColor: string;
      GachaQualityNiagara: string;
      TipQualityTexture: string;
      GachaQualityTexture: string;
      GachaBgTexture: string;
      BackgroundSprite: string;
      VerticalGradientSprite: string;
      TipsSprite: string;
      SpecialEffects: string;
      DissipateEffects: string;
      NewItemGetEffects: string;
      ConsumeFilterText: string;
      PayShopTexture: string;
      NewPayShopTexture: string;
      PayShopQualitySprite: string;
      PhantomSprite: string;
      DropItemQualityNiagaraPath: string;
      MediumItemGridQualitySpritePath: string;
      QualityColor: string;
      RouletteTipsQualityTexPath: string;
      AcquireQualityTexPath: string;
      AcquireNewItemQualityTexPath: string;
      AcquireQualitySpritePath: string;
      FilterIconPath: string;
      CalabashLevelUpViewShowText: string;
      UnlockVisionQuality: string;
      UnlockVisionQualityColor: string;
      TrainingWeight: number;
    };
  }>;
  playerinterface: Array<{
    Id: number;
    data: {
      Id: number;
      Name: string;
      MainName: string;
    };
  }>;
  itemshowtype: Array<{
    Id: number;
    data: {
      Id: number;
      Name: string;
    };
  }>;
  previewitem: Array<{
    Id: number;
    data: {
      Id: number;
      Name: string;
      ShowTypes: Array<number>;
      AttributesDescription: string;
      BgDescription: string;
      Icon: string;
      IconMiddle: string;
      IconSmall: string;
      PreviewCornerMarker: number;
      QualityId: number;
      PreviewItemAccess: Array<any>;
    };
  }>;
};

export type DBLevelPlayNodeData = {
  levelplaynodedata: Array<{
    Key: string;
    data: {
      Key: string;
      Data: {
        Type: string;
        Id: number;
        Desc: string;
        Condition?: {
          Type: any;
          Conditions?: Array<{
            EntityId?: number;
            State: any;
            Var1?: {
              Type: string;
              Source: string;
              Value?: number;
              Name?: string;
            };
            Compare?: string;
            Var2?: {
              Type: string;
              Source: string;
              Value: any;
              Name?: string;
            };
            Type?: string;
            LevelId?: number;
            InCombat?: boolean;
            SkillOption?: {
              Type: string;
            };
            MonsterId?: number;
            Develop?: number;
            LordGymId?: number;
            CalabashLevel?: number;
            QuestId?: number;
            RoleId?: number;
            DungeonId?: number;
            MotionState?: string;
          }>;
          GuideGroupId?: number;
          Count?: number;
          Time?: number;
          TimerType?: string;
          AddOptions?: Array<{
            EntityId: number;
            Option: {
              Guid: string;
              Type: {
                Type: string;
                Flow?: {
                  FlowListName: string;
                  FlowId: number;
                  StateId: number;
                };
                Actions?: Array<{
                  Name: string;
                  Params: {
                    Level?: string;
                    Content?: string;
                    TipOption?: {
                      TidMainText: string;
                      Type: number;
                    };
                    FlowListName?: string;
                    FlowId?: number;
                    StateId?: number;
                    SystemType?: string;
                    BoardId?: number;
                    EntityIds?: Array<number>;
                    Type?: string;
                    EntityId?: number;
                    State?: string;
                    VarLeft?: {
                      Type: string;
                      Source: string;
                      Name: string;
                    };
                    VarRight?: {
                      Type: string;
                      Source: string;
                      Value: number;
                    };
                    LoadLevels?: Array<string>;
                    UnloadLevels?: Array<string>;
                    DisplayMode?: string;
                    TeleportEntityId?: number;
                    ScreenType?: string;
                    Hour?: number;
                    Min?: number;
                    ShowUi?: boolean;
                    Pos?: {
                      X: number;
                      Y: number;
                      Z: number;
                    };
                    FadeInTime?: number;
                    StayTime?: number;
                    FadeOutTime?: number;
                    LockCamera?: boolean;
                    BuffIds?: Array<number>;
                    Var1?: {
                      Type: string;
                      Source: string;
                      Name: string;
                    };
                    Var2?: {
                      Type: string;
                      Source: string;
                      Value: number;
                    };
                    Op?: string;
                    Result?: {
                      Type: string;
                      Source: string;
                      Name: string;
                    };
                    Path?: string;
                    Pos2?: {
                      Type: number;
                      Pos: {};
                    };
                    Option?: {
                      Type: string;
                      Priority: number;
                      FadeInTime: number;
                      FadeOutTime: number;
                      ArmLength: number;
                      MinumArmLength: number;
                      MaxiumArmLength: number;
                      Offset: {
                        X: number;
                        Y: number;
                        Z: number;
                      };
                      Fov: number;
                      CenterPos: {
                        X: number;
                        Y: number;
                        Z: number;
                      };
                      CenterRot: {
                        Y: number;
                        Z: number;
                      };
                    };
                  };
                  ActionGuid?: string;
                  ActionId: number;
                  Async?: boolean;
                }>;
              };
              DoIntactType?: string;
              TidContent?: string;
              Condition?: {
                Type: number;
                Conditions: Array<{
                  Type: string;
                  EntityId?: number;
                  Compare: string;
                  State: any;
                  QuestId?: number;
                  BuffId?: number;
                }>;
              };
              Range?: number;
              Icon?: string;
            };
            IsManualFinish?: boolean;
            IsManualDelete?: boolean;
          }>;
          Pos?: {
            X?: number;
            Y?: number;
            Z?: number;
          };
          Range?: number;
          RangeEntityId?: number;
          ExistTargets?: Array<number>;
          TargetsToAwake?: Array<number>;
          TidMonsterGroupName?: string;
          MonsterCreatorEntityIds?: Array<number>;
          UiType?: {
            Type: string;
            AbilityType?: number;
            BindId?: number;
          };
          EntityId?: number;
          State?: string;
          Flow?: {
            FlowListName: string;
            FlowId: number;
            StateId: number;
          };
          MatchRoleOption?: Array<{
            Type: string;
            Id: number;
          }>;
          EffectPath?: string;
          PreConditions?: {
            Type: number;
            Conditions: Array<{
              Type: string;
              BuffId: number;
              Compare: string;
            }>;
          };
          Option?: Array<{
            Type: string;
            Option?: {
              Type: string;
              Min: number;
              Max: number;
            };
            EntityId?: number;
            TagConfigId?: number;
            EntityIds?: Array<number>;
          }>;
          ShowMonsterMergedHpBar?: boolean;
          Check?: {
            Type: string;
            SkillGenre?: number;
            SkillId?: number;
          };
          PhotoTargets?: Array<{
            EntityId: number;
            TidDescription: string;
          }>;
          PosCondition?: {
            RangeEntity: number;
            TidDescription: string;
          };
          Days?: number;
          Hours?: number;
          Minutes?: number;
          Seconds?: number;
          Config?: string;
          SplineEntityId?: number;
          PrefabVar?: {
            Type: string;
            Source: string;
            Name: string;
          };
          LevelPlayIds?: Array<number>;
          CompleteNumber?: number;
          GameplayConfigs?: Array<{
            Type: string;
            CipherId: string;
          }>;
          HandInItems?: {
            Items: Array<{
              HandInType: string;
              ItemIds: Array<number>;
              Count: number;
            }>;
            RepeatItems: boolean;
            TidDescText: string;
          };
          AddOption?: {
            EntityId: number;
            Option: {
              TidContent: string;
              Guid: string;
              Type: {
                Type: string;
                Actions: Array<any>;
              };
              DoIntactType: string;
            };
          };
          StartTime?: {
            Hour: number;
            Minute: number;
          };
          Day?: number;
          EndTime?: {
            Hour: number;
            Minute: number;
          };
          IsWaitFinish?: boolean;
          SkillType?: string;
          SkillId?: number;
          InformationViewId?: number;
          KeepUiOpen?: boolean;
        };
        TidTip?: string;
        TrackTarget?: {
          TrackType: {
            Type: string;
            Locations?: Array<{
              X: number;
              Y: number;
              Z: number;
              A?: number;
            }>;
            EntityIds?: Array<number>;
          };
          Range?: number;
          EffectOption?: {
            Type: string;
            EnterRange: number;
            LeaveRange: number;
          };
          ViewRange?: number;
          Effect?: string;
        };
        EnterActions?: Array<{
          Name: string;
          Params: {
            GuideId?: number;
            Type?: string;
            EntityIds?: Array<number>;
            TipOption?: {
              Type: number;
              TidMainText?: string;
              TidSubText?: string;
            };
            EntityId?: number;
            State: any;
            BattleOption?: {
              Type: string;
              Configs?: Array<{
                EntityId: number;
                TagConfigId: number;
              }>;
              TargetEntityId?: number;
              MoveEvent?: string;
              MonsterEntityIds?: Array<number>;
            };
            FlowListName?: string;
            FlowId?: number;
            StateId?: number;
            IsSuccess?: boolean;
            Visible?: boolean;
            Configs?: Array<{
              LevelPlayId: number;
              Enable: boolean;
            }>;
            Time?: number;
            Conditions?: Array<any>;
            BuffIds?: Array<number>;
            LoadLevels?: Array<string>;
            UnloadLevels?: Array<any>;
            PosEntityId?: number;
            Config?: {
              Type: any;
              PrefabId?: number;
              Target?: {
                Type: string;
              };
              SplineEntityId?: number;
              Pattern?: {
                Type: string;
              };
              Index?: number;
            };
            VarName?: {
              Type: string;
              Source: string;
              Name: string;
            };
            Option?: {
              TidContent?: string;
              Guid?: string;
              Type: any;
              DoIntactType?: string;
              Condition?: {
                Type: number;
                Conditions: Array<{
                  Type: string;
                  EntityId: number;
                  Compare: string;
                  State: string;
                }>;
              };
              Priority?: number;
              FadeInTime?: number;
              FadeOutTime?: number;
              ArmLength?: number;
              MinumArmLength?: number;
              MaxiumArmLength?: number;
              Offset?: {
                X: number;
                Y: number;
                Z: number;
              };
              Fov?: number;
              CenterPos?: {
                X: number;
                Y: number;
                Z: number;
              };
              CenterRot?: {
                Y: number;
                Z: number;
              };
              LevelSequence?: string;
              BlendInTime?: number;
              BlendOutTime?: number;
              BegEntity?: number;
              EndEntity?: number;
            };
            Pos?: {
              X: number;
              Y: number;
              Z?: number;
            };
            FadeInTime?: number;
            StayTime?: number;
            FadeOutTime?: number;
            LockCamera?: boolean;
            CharacterId?: number;
            CharacterGroup?: Array<number>;
            AutoChange?: boolean;
            CreateTempTeam?: boolean;
            RangeEntity?: number;
            HideConfig?: {
              Type: string;
            };
            SystemType: any;
            IsEnable?: boolean;
            SkillType?: number;
            Duration?: number;
            FormationId?: number;
            Level?: string;
            Content?: string;
            SceneInteractionOption?: {
              Type: string;
            };
            Ease?: {
              Type: number;
              Duration: number;
            };
            ScreenType?: string;
            PositionId?: number;
            MoveOption?: {
              Type: string;
              Forward?: boolean;
              Back?: boolean;
              Left?: boolean;
              Right?: boolean;
              ForbidSprint?: boolean;
              ForceJog?: boolean;
              ForceWalk?: boolean;
            };
            SkillOption?: {
              Type: string;
              DisplayMode?: string;
            };
            CameraOption?: {
              Type: string;
            };
            UiOption?: {
              Type: string;
              ShowScreenEffect?: boolean;
              ShowEsc?: boolean;
              ShowMiniMap?: boolean;
              ShowQuestTrack?: boolean;
              ShowSystem?: boolean;
            };
            DisplayMode?: string;
            AreaId?: number;
            MoveTarget?: {
              Type: string;
              EntityId?: number;
            };
            SplineEntityId?: number;
            StateOption?: {
              Type: string;
              SetTags: Array<{
                EntityId: number;
                SetType: string;
                GameplayTag: string;
                BeforeHide?: boolean;
              }>;
            };
            IsSelf?: boolean;
            Location?: number;
            PreloadLevels?: Array<string>;
            EventConfig?: {
              Type: string;
              AkEvent: string;
              EntityId?: number;
            };
            TelePortConfig?: {
              Type: number;
              TargetPos: {
                X: number;
                Y: number;
                Z: number;
                A: number;
              };
            };
            CameraMove?: boolean;
            GeneralTextId?: number;
            MoveState?: number;
            CameraPos?: {
              X: number;
              Y: number;
              Z: number;
            };
            VarLeft?: {
              Type: string;
              Source: string;
              Name: string;
            };
            VarRight?: {
              Type: string;
              Source: string;
              Value: any;
            };
            SystemOption?: {
              Type: string;
              UnlockOption: {
                Type: string;
                Id: number;
              };
            };
            BoardId?: number;
            IsLocked?: boolean;
            ActionMontage?: {
              Path: string;
              MontageType: string;
            };
            SetReviveType?: string;
            ReviveId?: number;
            TransitionOption?: {
              Type: string;
              EffectDaPath: string;
            };
          };
          ActionGuid?: string;
          Async?: boolean;
          ActionId: number;
        }>;
        FinishActions?: Array<{
          Name: string;
          Params: {
            Time?: number;
            EntityIds?: Array<number>;
            VarLeft?: {
              Type: string;
              Source: string;
              Name: string;
            };
            VarRight?: {
              Type: string;
              Source: string;
              Value: any;
            };
            Visible?: boolean;
            TipOption?: {
              TidMainText?: string;
              Type: number;
              TidSubText?: string;
              TidText?: string;
            };
            Type?: string;
            EntityId?: number;
            State: any;
            FlowListName?: string;
            FlowId?: number;
            StateId?: number;
            GuideId?: number;
            DynamicSettlementConfig?: {
              Type: string;
            };
            ActionMontage?: {
              Path: string;
              MontageType: string;
            };
            BuffIds?: Array<number>;
            EventConfig?: {
              Type: string;
              AkEvent: string;
              EntityId?: number;
            };
            MoveOption?: {
              Type: string;
              Forward?: boolean;
              Back?: boolean;
              Left?: boolean;
              Right?: boolean;
              ForbidSprint?: boolean;
            };
            SkillOption?: {
              Type: string;
              DisplayMode?: string;
            };
            CameraOption?: {
              Type: string;
            };
            SceneInteractionOption?: {
              Type: string;
            };
            UiOption?: {
              Type: string;
              ShowEsc?: boolean;
              ShowScreenEffect?: boolean;
              ShowMiniMap?: boolean;
              ShowQuestTrack?: boolean;
              ShowSystem?: boolean;
            };
            BattleOption?: {
              Type: string;
              Configs?: Array<{
                EntityId: number;
                TagConfigId: number;
                DelayTime?: number;
              }>;
              TargetEntityId?: number;
              MonsterEntityIds?: Array<number>;
            };
            SystemType: any;
            BoardId?: number;
            IsEnable?: boolean;
            DelayDestroy?: boolean;
            Ease?: {
              Type: number;
              Duration: number;
            };
            ScreenType?: string;
            Level?: string;
            Content?: string;
            DelayShow?: boolean;
            RangeEntities?: Array<number>;
            RangeEntity?: number;
            HideConfig?: {
              Type: string;
              ExcludeEntities?: Array<number>;
            };
            Option?: {
              TidContent?: string;
              Guid?: string;
              Type: any;
              DoIntactType?: string;
              Priority?: number;
              FadeInTime?: number;
              FadeOutTime?: number;
              ArmLength?: number;
              MinumArmLength?: number;
              MaxiumArmLength?: number;
              Offset?: {
                X: number;
                Y: number;
                Z: number;
              };
              Fov?: number;
              OverlayArmLength?: number;
              Range?: number;
              CenterPos?: {
                X: number;
                Y: number;
                Z: number;
              };
              CenterRot?: {
                X?: number;
                Y: number;
                Z: number;
              };
            };
            Pos?: {
              X: number;
              Y: number;
              Z?: number;
            };
            CameraShakeBp?: string;
            CameraShakeConfig?: {
              Type: string;
            };
            FadeInTime?: number;
            StayTime?: number;
            FadeOutTime?: number;
            LockCamera?: boolean;
            Conditions?: Array<{
              Type: string;
              GameplayTag: string;
              Compare: string;
              Target: {
                Type: string;
                EntityId: number;
              };
            }>;
            Var1?: {
              Type: string;
              Source: string;
              Name: string;
            };
            Var2?: {
              Type: string;
              Source: string;
              Value: number;
            };
            Op?: string;
            Result?: {
              Type: string;
              Source: string;
              Name: string;
            };
            IsSuccess?: boolean;
            CameraMove?: boolean;
            DisplayMode?: string;
            FormationId?: number;
            GeneralTextId?: number;
            Flow?: {
              FlowListName: string;
              FlowId: number;
            };
            Path?: string;
            Pos2?: {
              Type: number;
              EntityId?: number;
              Offset: {
                X: number;
                Y: number;
                Z: number;
              };
            };
            MontageId?: number;
            IsAbpMontage?: boolean;
            CharacterId?: number;
            CharacterGroup?: Array<number>;
            SystemOption?: {
              Type: string;
              UnlockOption: {
                Type: string;
                Id: number;
              };
            };
            GameplayConfig?: {
              Type: string;
              CipherId: string;
            };
            Hour?: number;
            Min?: number;
            ShowUi?: boolean;
            Items?: Array<{
              ItemId: number;
              Count: number;
            }>;
            AutoChange?: boolean;
            TeleportEntityId?: number;
            RetainPhantom?: boolean;
            RetainRole?: boolean;
            LoadLevels?: Array<string>;
            UnloadLevels?: Array<string>;
            TelePortConfig?: {
              Type: number;
              EntityIds?: Array<number>;
              TargetPos?: {
                X: number;
                Y: number;
                Z: number;
                A: number;
              };
            };
            LeftVar?: {
              Type: string;
              Source: string;
              Value: number;
            };
            RightVar?: {
              Type: string;
              Source: string;
              Value: number;
            };
            MoveTarget?: {
              Type: string;
              EntityId: number;
            };
            SplineEntityId?: number;
            SkillType?: string;
            Config?: {
              Type: string;
              Target: {
                Type: string;
              };
              SplineEntityId: number;
              Pattern?: {
                Type: string;
              };
            };
            RegionMpcId?: number;
            StateOption?: {
              Type: string;
              EntityId?: number;
              TagOption?: {
                Type: string;
              };
              MaxWaitTime?: number;
              SetTags?: Array<{
                EntityId: number;
                SetType: string;
                GameplayTag: string;
                DelayTime?: number;
              }>;
            };
            AreaId?: number;
            ChangeType?: {
              Type: string;
              Time: number;
            };
            TimerType?: string;
            IsSelf?: boolean;
            Location?: number;
            DungeonId?: number;
            IsRegroup?: boolean;
            LocationEntityId?: number;
            TransitionOption?: {
              Type: string;
              Mp4Path?: string;
              CenterTextFlow?: {
                FlowListName: string;
                FlowId: number;
                StateId: number;
              };
            };
            KeepFadeAfterTreeEnd?: boolean;
            BanInput?: boolean;
            HideUi?: boolean;
            PositionId?: number;
            MoveConfig?: {
              Type: string;
              Point: {
                X: number;
                Y: number;
                Z: number;
              };
              Time: number;
              MoveMotion?: {
                Type: string;
                Time: number;
              };
            };
            Configs?: Array<{
              LevelPlayId: number;
              Enable: boolean;
            }>;
            MoveState?: number;
            CreateTempTeam?: boolean;
            SetReviveType?: string;
            ReviveId?: number;
            ActiveRange?: {
              CheckPoint: {};
              CheckEnterRange: number;
              CheckLeaveRange: number;
            };
            IsLocked?: boolean;
            Duration?: number;
          };
          ActionGuid?: string;
          Async?: boolean;
          ActionId: number;
        }>;
        SaveConfig?: {
          EnterActions?: Array<{
            Name: string;
            Params: {
              Visible?: boolean;
              EntityIds?: Array<number>;
              Type?: string;
              EntityId?: number;
              State?: string;
              EventConfig?: {
                Type: string;
                AkEvent: string;
              };
              BuffIds?: Array<number>;
              DelayShow?: boolean;
              RangeEntities?: Array<number>;
              SystemType?: number;
              IsEnable?: boolean;
              Ease?: {
                Type: number;
                Duration: number;
              };
              SetReviveType?: string;
              ReviveId?: number;
              PositionId?: number;
              CharacterId?: number;
              CharacterGroup?: Array<number>;
              AutoChange?: boolean;
              ActiveRange?: {
                CheckPoint: {};
                CheckEnterRange: number;
                CheckLeaveRange: number;
              };
            };
            ActionGuid: string;
            ActionId: number;
          }>;
          DisableRollbackWhileReconnect?: boolean;
          PosRollbackCfg?: {
            RangeEntityId: number;
            PositionEntityId: number;
          };
        };
        Count?: number;
        UIConfig?: {
          UiType: string;
          MainTitle: {
            TidTitle: string;
            QuestScheduleType: {
              Type: string;
              EntityId?: number;
              Var?: {
                Type: string;
                Source: string;
                Name: string;
              };
              ChildQuestId?: number;
              ShowComplete?: boolean;
              AssociatedChildQuestIds?: Array<number>;
            };
          };
          SubTitles: Array<{
            TidTitle: string;
            QuestScheduleType: {
              Type: string;
              ChildQuestId?: number;
              ShowComplete?: boolean;
              Condition?: {
                Type: number;
                Conditions: Array<{
                  Type: string;
                  EntityId?: number;
                  Compare: string;
                  State?: string;
                  MotionState?: string;
                }>;
              };
              IconType?: number;
              Var?: {
                Type: string;
                Source: string;
                Name: string;
              };
              EntityId?: number;
              TimeLeft?: number;
              TimerType?: string;
            };
          }>;
          TrackTarget?: {
            TrackType: {
              Type: string;
              Locations: Array<{
                X: number;
                Y: number;
                Z: number;
                A?: number;
              }>;
            };
            ViewRange?: number;
            Range?: number;
          };
          TrackRadius?: {
            TrackRadius: number;
          };
        };
        FailedCondition?: {
          IsTransferFailure?: boolean;
          RangeLimiting?: {
            Point: {
              X: number;
              Y: number;
              Z?: number;
            };
            Range: number;
            OverRangeCountdown?: number;
          };
          EntityStateCondition?: {
            Conditions: Array<{
              EntityId: number;
              State: string;
            }>;
          };
          IsTeamDeathFailure?: boolean;
          CanGiveUp?: boolean;
          Timer?: {
            Time: number;
            TimerType: string;
          };
          FailedTeleport?: {
            Position: {
              X: number;
              Y: number;
              Z: number;
              A: number;
            };
            IsConfirm: boolean;
            ConfirmId: number;
          };
          PlayerMotionStateCondition?: {
            Compare: string;
            MotionState: string;
          };
          TidGiveUpText?: string;
          EntityDeathCondition?: {
            EntityIds: Array<number>;
          };
          EntityAlert?: {
            EntityIds: Array<number>;
          };
          SneakPlayCondition?: {
            Time: number;
          };
          AddTimeConfig?: {
            StateConfig?: Array<{
              Condition: {
                EntityId: number;
                State: string;
              };
              AddTime: number;
            }>;
            MonsterConfig?: {
              NormalAddTime: number;
              SpecialTime?: Array<{
                EntityId: number;
                AddTime: number;
              }>;
            };
          };
          EntityDistanceLimiting?: {
            EntityId: number;
            MaxDistance: number;
            OverMaxCountdown: number;
          };
          CheckDataLayer?: {
            DataLayerId: number;
            IsLoad: boolean;
          };
          IsLeaveDungeonFailure?: boolean;
          TimeRange?: {
            StartTime: {
              Hours: number;
              Minutes: number;
            };
            EndTime: {
              Hours: number;
              Minutes: number;
            };
          };
          CheckDungeonFailure?: Array<number>;
        };
        Slots?: Array<{
          Condition: {
            Type: number;
            Conditions: Array<{
              Type: string;
              Var1?: {
                Type: string;
                Source: string;
                Name?: string;
                Value?: number;
              };
              Compare?: string;
              Var2?: {
                Type: string;
                Source: string;
                Value: any;
                Name?: string;
              };
              DungeonId?: number;
              IsSelf?: boolean;
              Location?: number;
              EntityId?: number;
              SystemId?: number;
              Start?: {
                Hour: number;
                Min: number;
              };
              End?: {
                Hour: number;
                Min: number;
              };
              QuestId?: number;
              State: any;
              LevelId?: number;
              Weather?: string;
              WeatherId?: number;
              TimePeriod?: string;
              Number?: number;
              DataLayerId?: number;
              IsLoad?: boolean;
              Gender?: string;
            }>;
          };
          Node: {
            Type: string;
            Id: number;
            Desc: string;
            Actions?: Array<{
              Name: string;
              Params: {
                TipOption?: {
                  TidMainText: string;
                  Type: number;
                };
                EntityIds?: Array<number>;
                VarLeft?: {
                  Type: string;
                  Source: string;
                  Name: string;
                };
                VarRight?: {
                  Type: string;
                  Source: string;
                  Name: string;
                };
                Level?: string;
                Content?: string;
                Time?: number;
                Ease?: {
                  Type: number;
                  Duration: number;
                };
              };
              ActionGuid: string;
              ActionId: number;
            }>;
            Condition?: {
              Type: string;
              AddOptions?: Array<{
                EntityId: number;
                Option: {
                  TidContent: string;
                  Guid: string;
                  Type: {
                    Type: string;
                    Actions: Array<any>;
                  };
                  DoIntactType: string;
                };
              }>;
              Count?: number;
              Conditions?: Array<{
                Var1: {
                  Type: string;
                  Source: string;
                  Name: string;
                };
                Compare: string;
                Var2: {
                  Type: string;
                  Source: string;
                  Value: boolean;
                };
              }>;
            };
            TidTip?: string;
            TrackTarget?: {
              TrackType: {
                Type: string;
                Locations: Array<{
                  X: number;
                  Y: number;
                  Z: number;
                }>;
              };
            };
            EnterActions?: Array<{
              Name: string;
              Params: {
                EntityIds?: Array<number>;
                Level?: string;
                Content?: string;
              };
              ActionGuid: string;
              ActionId: number;
            }>;
            FinishActions?: Array<{
              Name: string;
              Params: {
                EntityIds: Array<number>;
              };
              ActionGuid: string;
              ActionId: number;
            }>;
            Children?: Array<{
              Type: string;
              Id: number;
              Desc: string;
              FinishActions?: Array<{
                Name: string;
                Params: {
                  Type?: string;
                  EntityId?: number;
                  State: any;
                  DynamicSettlementConfig?: {
                    Type: string;
                  };
                  EntityIds?: Array<number>;
                  Ease?: {
                    Type: number;
                    Duration: number;
                  };
                  ScreenType?: string;
                  ActionMontage?: {
                    Path: string;
                    MontageType: string;
                  };
                  Duration?: number;
                  TipOption?: {
                    TidMainText: string;
                    Type: number;
                    TidSubText?: string;
                  };
                  BuffIds?: Array<number>;
                  Pos?: {
                    X: number;
                    Y: number;
                    Z: number;
                  };
                  FadeInTime?: number;
                  StayTime?: number;
                  FadeOutTime?: number;
                  LockCamera?: boolean;
                  CameraShakeBp?: string;
                  CameraShakeConfig?: {
                    Type: string;
                  };
                  Path?: string;
                  Pos2?: {
                    Type: number;
                    Offset: {
                      X: number;
                      Y: number;
                      Z: number;
                    };
                  };
                  EventConfig?: {
                    Type: string;
                    AkEvent: string;
                  };
                  SystemType?: number;
                  IsEnable?: boolean;
                  AreaId?: number;
                  VarLeft?: {
                    Type: string;
                    Source: string;
                    Name: string;
                  };
                  VarRight?: {
                    Type: string;
                    Source: string;
                    Value: boolean;
                  };
                  Visible?: boolean;
                  FlowListName?: string;
                  FlowId?: number;
                  StateId?: number;
                  CharacterId?: number;
                  CharacterGroup?: Array<number>;
                  AutoChange?: boolean;
                  CreateTempTeam?: boolean;
                  DisplayMode?: string;
                  SkillType?: string;
                  TelePortConfig?: {
                    Type: number;
                    TargetPos: {
                      X: number;
                      Y: number;
                      Z: number;
                      A: number;
                    };
                  };
                  Time?: number;
                  FormationId?: number;
                  RangeEntity?: number;
                  HideConfig?: {
                    Type: string;
                  };
                  GeneralTextId?: number;
                  Configs?: Array<{
                    LevelPlayId: number;
                    Enable: boolean;
                  }>;
                };
                ActionGuid?: string;
                ActionId: number;
                Async?: boolean;
              }>;
              Condition?: {
                Type: any;
                AddOptions?: Array<{
                  EntityId: number;
                  Option: {
                    Guid: string;
                    Type: {
                      Type: string;
                      Flow: {
                        FlowListName: string;
                        FlowId: number;
                        StateId: number;
                      };
                    };
                    DoIntactType: string;
                    TidContent?: string;
                  };
                  IsManualFinish?: boolean;
                }>;
                ExistTargets?: Array<number>;
                TargetsToAwake?: Array<number>;
                MonsterCreatorEntityIds?: Array<number>;
                TidMonsterGroupName?: string;
                ShowMonsterMergedHpBar?: boolean;
                UiType?: {
                  Type: string;
                  AbilityType: number;
                  BindId: number;
                };
                Conditions?: Array<{
                  EntityId?: number;
                  State?: string;
                  Var1?: {
                    Type: string;
                    Source: string;
                    Value?: number;
                    Name?: string;
                  };
                  Compare?: string;
                  Var2?: {
                    Type: string;
                    Source: string;
                    Value: any;
                  };
                  Type?: string;
                }>;
                StartTime?: {
                  Hour: number;
                  Minute: number;
                };
                Day?: number;
                EndTime?: {
                  Hour: number;
                  Minute: number;
                };
                Count?: number;
                Pos?: {
                  X: number;
                  Y: number;
                  Z: number;
                };
                Range?: number;
                Time?: number;
                TimerType?: string;
                Flow?: {
                  FlowListName: string;
                  FlowId: number;
                  StateId: number;
                };
              };
              TidTip?: string;
              TrackTarget?: {
                TrackType: {
                  Type: string;
                  Locations?: Array<{
                    X: number;
                    Y: number;
                    Z: number;
                    A: number;
                  }>;
                  EntityIds?: Array<number>;
                };
                Range?: number;
              };
              EnterActions?: Array<{
                Name: string;
                Params: {
                  EntityIds?: Array<number>;
                  FlowListName?: string;
                  FlowId?: number;
                  StateId?: number;
                  Type?: string;
                  EntityId?: number;
                  State: any;
                  Level?: string;
                  Content?: string;
                  Ease?: {
                    Type: number;
                    Duration: number;
                  };
                  ScreenType?: string;
                  DisplayMode?: string;
                  MoveTarget?: {
                    Type: string;
                  };
                  SplineEntityId?: number;
                  MoveState?: number;
                  AreaId?: number;
                  BuffIds?: Array<number>;
                  ActionMontage?: {
                    Path: string;
                    MontageType: string;
                  };
                  Duration?: number;
                };
                ActionGuid: string;
                ActionId: number;
                Async?: boolean;
              }>;
              Count?: number;
              Children?: Array<{
                Type: string;
                Id: number;
                Desc: string;
                Actions?: Array<{
                  Name: string;
                  Params: {
                    Visible: boolean;
                    EntityIds: Array<number>;
                  };
                  ActionGuid: string;
                  ActionId: number;
                }>;
                FailedCondition?: {
                  IsTransferFailure: boolean;
                  IsTeamDeathFailure: boolean;
                  CanGiveUp: boolean;
                  SneakPlayCondition: {
                    Time: number;
                  };
                };
                FinishActions?: Array<{
                  Name: string;
                  Params: {
                    VarLeft?: {
                      Type: string;
                      Source: string;
                      Name: string;
                    };
                    VarRight?: {
                      Type: string;
                      Source: string;
                      Value: number;
                    };
                    Type?: string;
                    EntityId?: number;
                    State?: string;
                    EntityIds?: Array<number>;
                    ActionMontage?: {
                      Path: string;
                      MontageType: string;
                    };
                    Duration?: number;
                  };
                  ActionGuid: string;
                  ActionId: number;
                }>;
                Condition?: {
                  Type: string;
                  ExistTargets?: Array<any>;
                  TargetsToAwake?: Array<number>;
                  UiType?: {
                    Type: string;
                    AbilityType: number;
                    BindId: number;
                  };
                  Conditions?: Array<{
                    EntityId: number;
                    State: string;
                  }>;
                };
                TidTip?: string;
                TrackTarget?: {
                  TrackType: {
                    Type: string;
                    Locations?: Array<{
                      X: number;
                      Y: number;
                      Z: number;
                    }>;
                    EntityIds?: Array<number>;
                  };
                  Range?: number;
                };
                EnterActions?: Array<{
                  Name: string;
                  Params: {
                    EntityIds?: Array<number>;
                    EntityId?: number;
                    ActionMontage?: {
                      Path: string;
                      MontageType: string;
                    };
                    Duration?: number;
                  };
                  ActionGuid: string;
                  ActionId: number;
                }>;
                Children?: Array<{
                  Type: string;
                  Id: number;
                  Desc: string;
                  Condition?: {
                    Type: any;
                    Conditions?: Array<{
                      Type?: string;
                      Var1?: {
                        Type: string;
                        Source: string;
                        Name: string;
                      };
                      Compare?: string;
                      Var2?: {
                        Type: string;
                        Source: string;
                        Value: number;
                      };
                      EntityId?: number;
                      State?: string;
                    }>;
                    ExistTargets?: Array<any>;
                    TargetsToAwake?: Array<number>;
                    HandInItems?: {
                      Items: Array<{
                        HandInType: string;
                        ItemIds: Array<number>;
                        Count: number;
                      }>;
                      RepeatItems: boolean;
                      TidDescText: string;
                    };
                    AddOption?: {
                      EntityId: number;
                      Option: {
                        TidContent: string;
                        Guid: string;
                        Type: {
                          Type: string;
                          Actions: Array<any>;
                        };
                        DoIntactType: string;
                      };
                    };
                  };
                  WaitUntilTrue?: boolean;
                  Actions?: Array<{
                    Name: string;
                    Params: {
                      EntityId?: number;
                      Option?: {
                        TidContent: string;
                        Guid: string;
                        Type: {
                          Type: string;
                          Flow: {
                            FlowListName: string;
                            FlowId: number;
                            StateId: number;
                          };
                        };
                        DoIntactType: string;
                      };
                      Type?: string;
                      State?: string;
                      Time?: number;
                    };
                    ActionGuid: string;
                    ActionId: number;
                  }>;
                  TidTip?: string;
                  TrackTarget?: {
                    TrackType: {
                      Type: string;
                      Locations: Array<any>;
                    };
                  };
                  EnterActions?: Array<any>;
                  FinishActions?: Array<{
                    Name: string;
                    Params: {
                      Visible?: boolean;
                      EntityIds?: Array<number>;
                      Type?: string;
                      EntityId?: number;
                      State?: string;
                      FlowListName?: string;
                      FlowId?: number;
                      StateId?: number;
                    };
                    ActionGuid: string;
                    ActionId: number;
                    Async?: boolean;
                  }>;
                  Count?: number;
                  Children?: Array<{
                    Type: string;
                    Id: number;
                    Desc: string;
                    Children: Array<{
                      Type: string;
                      Id: number;
                      Desc: string;
                      Count?: number;
                      Children?: Array<{
                        Type: string;
                        Id: number;
                        Desc: string;
                        Condition: {
                          Type: string;
                          Conditions: Array<{
                            EntityId: number;
                            State: string;
                          }>;
                        };
                        TidTip: string;
                        TrackTarget: {
                          TrackType: {
                            Type: string;
                            Locations: Array<any>;
                          };
                        };
                        EnterActions: Array<any>;
                      }>;
                      Actions?: Array<{
                        Name: string;
                        Params: {
                          EntityIds?: Array<number>;
                          Ease?: {
                            Type: number;
                            Duration: number;
                          };
                          ScreenType?: string;
                          Type?: string;
                          DisplayMode?: string;
                          Var1?: {
                            Type: string;
                            Source: string;
                            Name: string;
                          };
                          Var2?: {
                            Type: string;
                            Source: string;
                            Value: number;
                          };
                          Op?: string;
                          Result?: {
                            Type: string;
                            Source: string;
                            Name: string;
                          };
                          EntityId?: number;
                          State?: string;
                          Time?: number;
                          FlowListName?: string;
                          FlowId?: number;
                          StateId?: number;
                          Option?: {
                            TidContent: string;
                            Guid: string;
                            Type: {
                              Type: string;
                              Flow: {
                                FlowListName: string;
                                FlowId: number;
                                StateId: number;
                              };
                            };
                            DoIntactType: string;
                          };
                        };
                        ActionGuid: string;
                        ActionId: number;
                      }>;
                      Slots?: Array<{
                        Condition: {
                          Type: number;
                          Conditions: Array<{
                            Type: string;
                            Var1: {
                              Type: string;
                              Source: string;
                              Name: string;
                            };
                            Compare: string;
                            Var2: {
                              Type: string;
                              Source: string;
                              Value: number;
                            };
                          }>;
                        };
                        Node: {
                          Type: string;
                          Id: number;
                          Desc: string;
                          Children: Array<{
                            Type: string;
                            Id: number;
                            Desc: string;
                            Actions?: Array<{
                              Name: string;
                              Params: {
                                FlowListName?: string;
                                FlowId?: number;
                                StateId?: number;
                                Ease?: {
                                  Type: number;
                                  Duration: number;
                                };
                                ScreenType?: string;
                                Type?: string;
                                DisplayMode?: string;
                                EntityIds?: Array<number>;
                                Configs?: Array<{
                                  LevelPlayId: number;
                                  Enable: boolean;
                                }>;
                              };
                              ActionGuid: string;
                              ActionId: number;
                            }>;
                            FailedCondition?: {
                              IsTransferFailure: boolean;
                              IsTeamDeathFailure: boolean;
                              CanGiveUp: boolean;
                            };
                            FinishActions?: Array<any>;
                            AutoFailed?: boolean;
                          }>;
                        };
                      }>;
                      FailedCondition?: {
                        IsTransferFailure: boolean;
                        IsTeamDeathFailure: boolean;
                        CanGiveUp: boolean;
                      };
                      FinishActions?: Array<any>;
                      AutoFailed?: boolean;
                      Condition?: {
                        Type: string;
                        Conditions: Array<{
                          EntityId: number;
                          State: string;
                        }>;
                      };
                      TidTip?: string;
                      TrackTarget?: {
                        TrackType: {
                          Type: string;
                          Locations: Array<any>;
                        };
                      };
                      EnterActions?: Array<any>;
                    }>;
                  }>;
                }>;
              }>;
              Actions?: Array<{
                Name: string;
                Params: {
                  TelePortConfig?: {
                    Type: number;
                    TargetPos: {
                      X: number;
                      Y: number;
                      Z: number;
                      A: number;
                    };
                  };
                  Level?: string;
                  Content?: string;
                  IsSuccess?: boolean;
                  VarLeft?: {
                    Type: string;
                    Source: string;
                    Name: string;
                  };
                  VarRight?: {
                    Type: string;
                    Source: string;
                    Value: boolean;
                  };
                  FlowListName?: string;
                  FlowId?: number;
                  StateId?: number;
                  Configs?: Array<{
                    LevelPlayId: number;
                    Enable: boolean;
                  }>;
                  Type?: string;
                  EntityId?: number;
                  State?: string;
                  PositionId?: number;
                  CharacterId?: number;
                  CharacterGroup?: Array<number>;
                  Ease?: {
                    Type: number;
                    Duration: number;
                  };
                  ScreenType?: string;
                  Visible?: boolean;
                  EntityIds?: Array<number>;
                  AutoChange?: boolean;
                  CreateTempTeam?: boolean;
                  Option?: {
                    TidContent: string;
                    Guid: string;
                    Type: {
                      Type: string;
                      Flow: {
                        FlowListName: string;
                        FlowId: number;
                        StateId: number;
                      };
                    };
                    DoIntactType: string;
                  };
                  DisplayMode?: string;
                };
                ActionGuid: string;
                ActionId: number;
              }>;
              FailedCondition?: {
                Timer?: {
                  Time: number;
                  TimerType: string;
                };
                IsTransferFailure: boolean;
                IsTeamDeathFailure: boolean;
                CanGiveUp: boolean;
                FailedTeleport?: {
                  Position: {
                    X: number;
                    Y: number;
                    Z: number;
                    A: number;
                  };
                  IsConfirm: boolean;
                  ConfirmId: number;
                };
                CheckDataLayer?: {
                  DataLayerId: number;
                  IsLoad: boolean;
                };
              };
              AutoFailed?: boolean;
              SaveConfig?: {};
              Slots?: Array<{
                Condition: {
                  Type: number;
                  Conditions: Array<{
                    Type: string;
                    EntityId?: number;
                    Compare: string;
                    State?: string;
                    Var1?: {
                      Type: string;
                      Source: string;
                      Name: string;
                    };
                    Var2?: {
                      Type: string;
                      Source: string;
                      Value: number;
                    };
                  }>;
                };
                Node: {
                  Type: string;
                  Id: number;
                  Desc: string;
                  Children: Array<{
                    Type: string;
                    Id: number;
                    Desc: string;
                    Actions?: Array<{
                      Name: string;
                      Params: {
                        FlowListName?: string;
                        FlowId?: number;
                        StateId?: number;
                        Ease?: {
                          Type: number;
                          Duration: number;
                        };
                        ScreenType?: string;
                        Visible?: boolean;
                        EntityIds?: Array<number>;
                        Type?: string;
                        EntityId?: number;
                        State?: string;
                      };
                      ActionGuid: string;
                      ActionId: number;
                    }>;
                    Slots?: Array<{
                      Condition: {
                        Type: number;
                        Conditions: Array<{
                          Type: string;
                          EntityId: number;
                          Compare: string;
                          State: string;
                        }>;
                      };
                      Node: {
                        Type: string;
                        Id: number;
                        Desc: string;
                        Children: Array<{
                          Type: string;
                          Id: number;
                          Desc: string;
                          Actions?: Array<{
                            Name: string;
                            Params: {
                              FlowListName?: string;
                              FlowId?: number;
                              StateId?: number;
                              Ease?: {
                                Type: number;
                                Duration: number;
                              };
                              ScreenType?: string;
                              Visible?: boolean;
                              EntityIds?: Array<number>;
                              Type?: string;
                              EntityId?: number;
                              State?: string;
                            };
                            ActionGuid: string;
                            ActionId: number;
                          }>;
                          AutoFailed?: boolean;
                          FinishActions?: Array<{
                            Name: string;
                            Params: {
                              Ease?: {
                                Type: number;
                                Duration: number;
                              };
                              ScreenType?: string;
                              EntityIds?: Array<number>;
                            };
                            ActionGuid: string;
                            ActionId: number;
                          }>;
                        }>;
                      };
                    }>;
                    FinishActions?: Array<{
                      Name: string;
                      Params: {
                        Ease?: {
                          Type: number;
                          Duration: number;
                        };
                        ScreenType?: string;
                        EntityIds?: Array<number>;
                        GeneralTextId?: number;
                      };
                      ActionGuid: string;
                      ActionId: number;
                    }>;
                    Condition?: {
                      Type: string;
                      AddOptions: Array<{
                        EntityId: number;
                        Option: {
                          Guid: string;
                          Type: {
                            Type: string;
                            Flow: {
                              FlowListName: string;
                              FlowId: number;
                              StateId: number;
                            };
                          };
                          DoIntactType: string;
                        };
                        IsManualFinish: boolean;
                      }>;
                    };
                    TidTip?: string;
                    EnterActions?: Array<any>;
                    TrackTarget?: {
                      TrackType: {
                        Type: string;
                        EntityIds: Array<number>;
                      };
                    };
                    AutoFailed?: boolean;
                  }>;
                };
              }>;
              Child?: {
                Type: string;
                Id: number;
                Desc: string;
                Condition: {
                  Type: string;
                  ExistTargets?: Array<any>;
                  TargetsToAwake?: Array<number>;
                  Count?: number;
                  Option?: Array<{
                    Type: string;
                    Option: {
                      Type: string;
                      Min: number;
                      Max: number;
                    };
                  }>;
                };
                TidTip: string;
                TrackTarget: {
                  TrackType: {
                    Type: string;
                    Locations: Array<{
                      X: number;
                      Y: number;
                      Z: number;
                    }>;
                  };
                  Range?: number;
                };
                EnterActions: Array<any>;
                FinishActions: Array<{
                  Name: string;
                  Params: {
                    Level: string;
                    Content: string;
                  };
                  ActionGuid: string;
                  ActionId: number;
                }>;
              };
              HideUi?: boolean;
            }>;
            Count?: number;
            Slots?: Array<{
              Condition: {
                Type: number;
                Conditions: Array<{
                  Type: string;
                  EntityId: number;
                  Compare: string;
                  State: string;
                }>;
              };
              Node: {
                Type: string;
                Id: number;
                Desc: string;
                Children: Array<{
                  Type: string;
                  Id: number;
                  Desc: string;
                  FinishActions: Array<{
                    Name: string;
                    Params: {
                      Visible?: boolean;
                      EntityIds?: Array<number>;
                      EntityId?: number;
                      State?: {
                        FlowListName: string;
                        FlowId: number;
                        StateId: number;
                      };
                    };
                    ActionGuid: string;
                    ActionId: number;
                  }>;
                }>;
              };
            }>;
          };
        }>;
        MaxRepeatTimes?: number;
        ExitCondition?: {
          Type: number;
          Conditions: Array<{
            Type: string;
            LevelId?: number;
            Compare: string;
            State?: number;
            Var1?: {
              Type: string;
              Source: string;
              Name?: string;
              Value?: number;
            };
            Var2?: {
              Type: string;
              Source: string;
              Value: any;
              Name?: string;
            };
          }>;
        };
        AutoFailed?: boolean;
        Statistics?: {
          StatisticsConfig: Array<{
            Type: string;
            Var: {
              Type: string;
              Source: string;
              Name?: string;
              Value?: number;
            };
            MotionType?: string;
            TypeConfigs?: Array<{
              MonsterType: number;
              Point: number;
            }>;
            EntityConfigs?: Array<{
              EntityId: number;
              Point: number;
            }>;
            EntitiyMatch?: {
              Category: {
                CollectType: string;
              };
            };
            TimerType?: string;
            SkillId?: number;
            IsWaitFinish?: boolean;
          }>;
          CalculationOnTriggeringStatistics?: Array<{
            Var1: {
              Type: string;
              Source: string;
              Name: string;
            };
            Var2: {
              Type: string;
              Source: string;
              Name?: string;
              Value?: number;
            };
            Op: string;
            Result: {
              Type: string;
              Source: string;
              Name: string;
            };
          }>;
        };
        HideUi?: boolean;
        HideTip?: boolean;
        BudgetCameraType?: string;
        DisableOnline?: boolean;
        RewardId?: number;
        OccupationConfig?: {
          TidDesc: string;
          Occupations: Array<string>;
        };
        WaitUntilTrue?: boolean;
        Actions?: Array<{
          Name: string;
          Params: {
            VarLeft?: {
              Type: string;
              Source: string;
              Name: string;
            };
            VarRight?: {
              Type: string;
              Source: string;
              Value?: boolean;
              Name?: string;
            };
            EntityIds?: Array<number>;
            TelePortConfig?: {
              Type: number;
              TargetPos?: {
                X: number;
                Y: number;
                Z?: number;
                A: number;
              };
              EntityIds?: Array<number>;
            };
            BuffIds?: Array<number>;
            FlowListName?: string;
            FlowId?: number;
            StateId?: number;
            TipOption?: {
              Type: number;
              TidMainText?: string;
            };
            Time?: number;
            Level?: string;
            Content?: string;
            Visible?: boolean;
            EntityId?: number;
            Option?: {
              TidContent?: string;
              Guid?: string;
              Type: any;
              DoIntactType?: string;
              Priority?: number;
              FadeInTime?: number;
              FadeOutTime?: number;
              ArmLength?: number;
              MinumArmLength?: number;
              MaxiumArmLength?: number;
              Offset?: {
                X: number;
                Y: number;
                Z: number;
              };
              Fov?: number;
              CenterPos?: {
                X: number;
                Y: number;
                Z: number;
              };
              CenterRot?: {
                Y: number;
                Z: number;
              };
            };
            Type?: string;
            State?: string;
            PositionId?: number;
            CharacterId?: number;
            CharacterGroup?: Array<number>;
            AutoChange?: boolean;
            GuideId?: number;
            Conditions?: Array<{
              Type: string;
              GameplayTag: string;
              Compare: string;
              Target: {
                Type: string;
              };
            }>;
            MoveOption?: {
              Type: string;
              Forward: boolean;
              Back: boolean;
              Left: boolean;
              Right: boolean;
            };
            SkillOption?: {
              Type: string;
              DisplayMode: string;
            };
            CameraOption?: {
              Type: string;
            };
            SceneInteractionOption?: {
              Type: string;
            };
            Ease?: {
              Type: number;
              Duration: number;
            };
            ScreenType?: string;
            Var1?: {
              Type: string;
              Source: string;
              Name: string;
            };
            Var2?: {
              Type: string;
              Source: string;
              Value?: number;
              Name?: string;
            };
            Op?: string;
            Result?: {
              Type: string;
              Source: string;
              Name: string;
            };
            IsEnable?: boolean;
            RangeEntity?: number;
            HideConfig?: {
              Type: string;
            };
            EventConfig?: {
              Type: string;
              AkEvent: string;
            };
            FormationId?: number;
            CreateTempTeam?: boolean;
            LeftVar?: {
              Type: string;
              Source: string;
              Value: number;
            };
            RightVar?: {
              Type: string;
              Source: string;
              Value: number;
            };
            Configs?: Array<{
              LevelPlayId: number;
              Enable: boolean;
            }>;
            DisplayMode?: string;
            IsSuccess?: boolean;
            LoadLevels?: Array<string>;
            UnloadLevels?: Array<string>;
            TeleportEntityId?: number;
            SystemType?: number;
          };
          ActionGuid?: string;
          ActionId: number;
          Async?: boolean;
        }>;
        Children?: Array<{
          Type: string;
          Id: number;
          Desc: string;
          Children: Array<{
            Type: string;
            Id: number;
            Desc: string;
            Condition: {
              Type: string;
              Count?: number;
              Conditions?: Array<{
                Var1: {
                  Type: string;
                  Source: string;
                  Value: number;
                };
                Compare: string;
                Var2: {
                  Type: string;
                  Source: string;
                  Value: number;
                };
              }>;
              ExistTargets?: Array<any>;
              TargetsToAwake?: Array<number>;
            };
            TidTip: string;
            TrackTarget: {
              TrackType: {
                Type: string;
                Locations: Array<any>;
              };
            };
            EnterActions: Array<{
              Name: string;
              Params: {
                Level: string;
                Content: string;
              };
              ActionGuid: string;
              ActionId: number;
            }>;
            FinishActions: Array<any>;
          }>;
        }>;
        VarBindingConfigs?: Array<{
          Type: string;
          Var: {
            Type: string;
            Source: string;
            Name: string;
          };
          TimerType: string;
        }>;
        InformationView?: {
          InformationView: {
            Type: string;
            InformationConfig: Array<{
              TidMainTitle: string;
              SubTitles: Array<{
                TidTitle: string;
                TidContent: string;
              }>;
            }>;
          };
        };
        RewardGetUiType?: number;
      };
    };
  }>;
};
