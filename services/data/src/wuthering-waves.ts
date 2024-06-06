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
const dbLevelPlayData = readJSON<DBLevelPlayData>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_LevelPlayData.json"
);
const dbLevelPlayNodeData = readJSON<DBLevelPlayNodeData>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_LevelPlayNodeData.json"
);
const worldMapIconSprite = readJSON<WorldMapIconSprite>(
  CONTENT_DIR +
    "/Client/Content/Aki/UI/UIResources/Common/Atlas/WorldMapIcon/TPI_Common_WorldMapIcon.json"
);
const dbPhantom = readJSON<DBPhantom>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_phantom.json"
);
const dbQuestNodeData = readJSON<DBQuestNodeData>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_QuestNodeData.json"
);
const dbEntityOwnerData = readJSON<DBEntityOwnerData>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_EntityOwnerData.json"
);
const dbQuestData = readJSON<DBQuestData>(
  CONTENT_DIR + "/Client/Content/Aki/ConfigDB/db_QuestData.json"
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
  const discoveredDesc =
    MultiText.find((m) => m.Id === monster.data.DiscoveredDes)?.Content ?? "";

  const desc = extractResFromDesc(discoveredDesc);
  const phantomItem = dbPhantom.phantomitem.find(
    (p) => p.data.MonsterName === monster.data.Name
  );
  const fetterGroups = phantomItem?.data.FetterGroup.map(
    (f) => dbPhantom.phantomfettergroup.find((g) => g.data.Id === f)!
  );
  if (fetterGroups) {
    enDict[id + "_desc"] =
      fetterGroups
        .map(
          (g) =>
            `<p style="color:#${g.data.FetterElementColor}">${MultiText.find((m) => m.Id === g.data.FetterGroupName)?.Content}</p>`
        )
        .join("") ?? "";

    enDict[id + "_tags"] = fetterGroups
      .map(
        (g) => MultiText.find((m) => m.Id === g.data.FetterGroupName)?.Content
      )
      .join(" ");
    if (desc) {
      enDict[id + "_desc"] += desc;
    }
  } else if (desc) {
    enDict[id + "_desc"] = desc;
  }

  if (enDict[id].startsWith("Phantom")) {
    enDict[id] = enDict[id].replace("Phantom: ", "");
  }

  monsterFilterIds.push(id);
}

function extractResFromDesc(desc: string) {
  const lastColor = desc.lastIndexOf("</color>");
  if (lastColor !== -1) {
    const to = Math.min(
      desc.slice(lastColor + 1).indexOf("."),
      desc.slice(lastColor + 1).indexOf("\n")
    );
    if (to !== -1) {
      return desc.slice(0, lastColor + to + 1);
    }
  }
  return "";
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
        enDict[spawnId + "_desc"] = extractResFromDesc(
          MultiText.find((m) => m.Id === mapMark.data.MarkDesc)?.Content ??
            mapMark.data.MarkDesc
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
            mapMark.data.MarkDesc
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
            mapMark.data.MarkDesc
        );
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

    if (levelEntity.data.InSleep) {
      let owner = dbEntityOwnerData.entityownerdata.find(
        (d) =>
          d.data.Guid.split("_")[1] === levelEntity.data.EntityId.toString()
      );
      if (owner) {
        let ownerEntityId = owner.data.Owner.find(
          (o) => o.Type === "Entity"
        )?.EntityId;
        if (ownerEntityId) {
          const ownerEntity = sortedEntities.find(
            (e) => e.data.EntityId === ownerEntityId
          );
          if (!ownerEntity) {
            throw new Error(
              `Missing owner entity for ${levelEntity.data.EntityId}`
            );
          }
          if (ownerEntity.data.InSleep) {
            owner = dbEntityOwnerData.entityownerdata.find(
              (d) =>
                d.data.Guid.split("_")[1] ===
                ownerEntity.data.EntityId.toString()
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
          (o) => o.Type === "Quest"
        )?.QuestId;
        const ownerLevelPlayId = owner.data.Owner.find(
          (o) => o.Type === "LevelPlay"
        )?.LevelPlayId;

        if (ownerQuestId) {
          const ownerQuest = dbQuestData.questdata.find(
            (d) => d.data.QuestId === ownerQuestId
          );
          if (!ownerQuest) {
            throw new Error(
              `Missing owner quest for ${levelEntity.data.EntityId}`
            );
          }
          const questName = MultiText.find(
            (m) => m.Id === ownerQuest.data.Data.TidName
          )?.Content;
          spawnId = `${id}_${levelEntity.data.EntityId}`;
          enDict[`${spawnId}_desc`] =
            `<p style="color:#17a0a4">Quest: ${questName}</p>`;
          if (enDict[`${id}_desc`]) {
            enDict[`${spawnId}_desc`] += enDict[`${id}_desc`];
          }
          enDict[`${spawnId}_tags`] = `Quest ${questName}`;
          if (enDict[`${id}_tags`]) {
            enDict[`${spawnId}_tags`] += " " + enDict[`${id}_tags`];
          }
        }
        if (ownerLevelPlayId) {
          const ownerLevelPlay = dbLevelPlayData.levelplaydata.find(
            (d) => d.data.LevelPlayId === ownerLevelPlayId
          );
          if (!ownerLevelPlay) {
            throw new Error(
              `Missing owner level play for ${levelEntity.data.EntityId}`
            );
          }
          const dataType = ownerLevelPlay.data.Data.Type.replace(
            "MonsterTreasure",
            "Monster Treasure"
          );
          spawnId = `${id}_${levelEntity.data.EntityId}`;
          enDict[`${spawnId}_desc`] =
            `<p style="color:#17a0a4">${dataType}</p>`;
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

export type DBPhantom = {
  phantomtype: Array<{
    Id: number;
  }>;
  phantominfo: Array<{
    Id: number;
  }>;
  phantomlevelreward: Array<{
    Id: number;
    PhantomId: number;
  }>;
  phantomlevelconsume: Array<{
    Id: number;
    PhantomId: number;
    ItemId: number;
  }>;
  phantomskilltype: Array<{
    Id: number;
  }>;
  phantomskilllabel: Array<{
    Id: number;
  }>;
  phantomfetter: Array<{
    Id: number;
    data: {
      Id: number;
      Name: string;
      BuffIds: Array<string>;
      AddProp: Array<{
        j7: {
          bytes_: {
            "0": number;
            "1": number;
            "2": number;
            "3": number;
            "4": number;
            "5": number;
            "6": number;
            "7": number;
            "8": number;
            "9": number;
            "10": number;
            "11": number;
            "12": number;
            "13": number;
            "14": number;
            "15": number;
            "16": number;
            "17": number;
            "18": number;
            "19": number;
            "20": number;
            "21": number;
            "22": number;
            "23": number;
            "24": number;
            "25": number;
            "26": number;
            "27": number;
            "28": number;
            "29": number;
            "30": number;
            "31": number;
            "32": number;
            "33": number;
            "34": number;
            "35": number;
            "36": number;
            "37": number;
            "38": number;
            "39": number;
            "40": number;
            "41": number;
            "42": number;
            "43": number;
            "44": number;
            "45": number;
            "46": number;
            "47": number;
            "48": number;
            "49": number;
            "50": number;
            "51": number;
            "52": number;
            "53": number;
            "54": number;
            "55": number;
            "56": number;
            "57": number;
            "58": number;
            "59": number;
            "60": number;
            "61": number;
            "62": number;
            "63": number;
            "64": number;
            "65": number;
            "66": number;
            "67": number;
            "68": number;
            "69": number;
            "70": number;
            "71": number;
            "72": number;
            "73": number;
            "74": number;
            "75": number;
            "76": number;
            "77": number;
            "78": number;
            "79": number;
            "80": number;
            "81": number;
            "82": number;
            "83": number;
            "84": number;
            "85": number;
            "86": number;
            "87": number;
            "88": number;
            "89": number;
            "90": number;
            "91": number;
            "92": number;
            "93": number;
            "94": number;
            "95": number;
            "96": number;
            "97": number;
            "98": number;
            "99": number;
            "100": number;
            "101": number;
            "102": number;
            "103": number;
            "104": number;
            "105": number;
            "106": number;
            "107": number;
            "108": number;
            "109": number;
            "110": number;
            "111": number;
            "112": number;
            "113": number;
            "114": number;
            "115": number;
            "116": number;
            "117": number;
            "118": number;
            "119": number;
            "120": number;
            "121": number;
            "122": number;
            "123": number;
            "124": number;
            "125": number;
            "126": number;
            "127": number;
            "128": number;
            "129": number;
            "130": number;
            "131": number;
            "132": number;
            "133": number;
            "134": number;
            "135": number;
            "136": number;
            "137": number;
            "138": number;
            "139": number;
            "140": number;
            "141": number;
            "142": number;
            "143": number;
            "144": number;
            "145": number;
            "146": number;
            "147": number;
            "148": number;
            "149": number;
            "150": number;
            "151": number;
            "152": number;
            "153": number;
            "154": number;
            "155": number;
            "156": number;
            "157": number;
            "158": number;
            "159": number;
            "160": number;
            "161": number;
            "162": number;
            "163": number;
            "164": number;
            "165": number;
            "166": number;
            "167": number;
            "168": number;
            "169": number;
            "170": number;
            "171": number;
            "172": number;
            "173": number;
            "174": number;
            "175": number;
            "176": number;
            "177": number;
            "178": number;
            "179": number;
            "180": number;
            "181": number;
            "182": number;
            "183": number;
            "184": number;
            "185": number;
            "186": number;
            "187": number;
            "188": number;
            "189": number;
            "190": number;
            "191": number;
            "192": number;
            "193": number;
            "194": number;
            "195": number;
            "196": number;
            "197": number;
            "198": number;
            "199": number;
            "200": number;
            "201": number;
            "202": number;
            "203": number;
            "204": number;
            "205": number;
            "206": number;
            "207": number;
            "208": number;
            "209": number;
            "210": number;
            "211": number;
            "212": number;
            "213": number;
            "214": number;
            "215": number;
            "216": number;
            "217": number;
            "218": number;
            "219": number;
            "220": number;
            "221": number;
            "222": number;
            "223": number;
            "224": number;
            "225": number;
            "226": number;
            "227": number;
            "228": number;
            "229": number;
            "230": number;
            "231": number;
            "232": number;
            "233": number;
            "234": number;
            "235": number;
            "236": number;
            "237": number;
            "238": number;
            "239": number;
            "240": number;
            "241": number;
            "242": number;
            "243": number;
            "244": number;
            "245": number;
            "246": number;
            "247": number;
            "248": number;
            "249": number;
            "250": number;
            "251": number;
            "252": number;
            "253": number;
            "254": number;
            "255": number;
            "256": number;
            "257": number;
            "258": number;
            "259": number;
            "260": number;
            "261": number;
            "262": number;
            "263": number;
            "264": number;
            "265": number;
            "266": number;
            "267": number;
            "268": number;
            "269": number;
            "270": number;
            "271": number;
            "272": number;
            "273": number;
            "274": number;
            "275": number;
            "276": number;
            "277": number;
            "278": number;
            "279": number;
            "280": number;
            "281": number;
            "282": number;
            "283": number;
            "284": number;
            "285": number;
            "286": number;
            "287": number;
            "288": number;
            "289": number;
            "290": number;
            "291": number;
            "292": number;
            "293": number;
            "294": number;
            "295": number;
            "296": number;
            "297": number;
            "298": number;
            "299": number;
            "300": number;
            "301": number;
            "302": number;
            "303": number;
            "304": number;
            "305": number;
            "306": number;
            "307": number;
            "308": number;
            "309": number;
            "310": number;
            "311": number;
            "312": number;
            "313": number;
            "314": number;
            "315": number;
            "316": number;
            "317": number;
            "318": number;
            "319": number;
            "320": number;
            "321": number;
            "322": number;
            "323": number;
            "324": number;
            "325": number;
            "326": number;
            "327": number;
            "328": number;
            "329": number;
            "330": number;
            "331": number;
            "332": number;
            "333": number;
            "334": number;
            "335": number;
            "336": number;
            "337": number;
            "338": number;
            "339": number;
            "340": number;
            "341": number;
            "342": number;
            "343": number;
            "344": number;
            "345": number;
            "346": number;
            "347": number;
            "348": number;
            "349": number;
            "350": number;
            "351": number;
            "352": number;
            "353": number;
            "354": number;
            "355": number;
            "356"?: number;
            "357"?: number;
            "358"?: number;
            "359"?: number;
            "360"?: number;
            "361"?: number;
            "362"?: number;
            "363"?: number;
            "364"?: number;
            "365"?: number;
            "366"?: number;
            "367"?: number;
          };
          position_: number;
          text_decoder_: {
            _encoding: {
              labels: Array<string>;
              name: string;
            };
            _decoder: any;
            _ignoreBOM: boolean;
            _BOMseen: boolean;
            _error_mode: string;
            _do_not_flush: boolean;
          };
        };
        W7: number;
      }>;
      EffectDescription: string;
      FetterIcon: string;
      SimplyEffectDesc: string;
      EffectDescriptionParam: Array<string>;
      EffectDefineDescription: string;
      Priority: number;
    };
  }>;
  phantomsumleveleffect: Array<{
    Level: number;
  }>;
  phantomquality: Array<{
    Quality: number;
    data: {
      Quality: number;
      LevelLimit: number;
      SlotUnlockLevel: Array<number>;
      IdentifyCost: {};
      IdentifyCoin: number;
      QualitySprite: string;
    };
  }>;
  phantommainproperty: Array<{
    Id: number;
    data: {
      Id: number;
    };
  }>;
  phantomsubpropaction: Array<{
    Level: number;
  }>;
  phantomlevel: Array<{
    Id: number;
    GroupId: number;
    Level: number;
    data: {
      Id: number;
      GroupId: number;
      Level: number;
      Exp: number;
    };
  }>;
  phantombreach: Array<{
    BreachId: number;
  }>;
  phantomexpitem: Array<{
    ItemId: number;
    data: {
      ItemId: number;
      Exp: number;
    };
  }>;
  phantomitem: Array<{
    ItemId: number;
    MonsterId: number;
    data: {
      ItemId: number;
      MonsterId: number;
      MonsterName: string;
      ElementType: Array<number>;
      LevelUpGroupId: number;
      SkillId: number;
      CalabashBuffs: Array<string>;
      Rarity: number;
      MeshId: number;
      Zoom: Array<number>;
      Location: Array<number>;
      Rotator: Array<number>;
      StandAnim: string;
      TypeDescription: string;
      AttributesDescription: string;
      Icon: string;
      IconMiddle: string;
      IconSmall: string;
      Mesh: string;
      QualityId: number;
      MaxCapcity: number;
      ItemAccess: Array<number>;
      ObtainedShow: number;
      ObtainedShowDescription: string;
      NumLimit: number;
      ShowInBag: boolean;
      SortIndex: number;
      SkillIcon: string;
      Destructible: boolean;
      RedDotDisableRule: number;
      FetterGroup: Array<number>;
      ParentMonsterId: number;
    };
  }>;
  phantomgrowth: Array<{
    Id: number;
    GrowthId: number;
    Level: number;
    Value: number;
    data: {
      Id: number;
      GrowthId: number;
      Level: number;
      Value: number;
    };
  }>;
  phantommainpropitem: Array<{
    Id: number;
    data: {
      Id: number;
      PropId: number;
      AddType: number;
      StandardProperty: number;
      GrowthId: number;
    };
  }>;
  phantomrarity: Array<{
    Rare: number;
    data: {
      Rare: number;
      Cost: number;
      Desc: string;
    };
  }>;
  phantomwilditem: Array<{
    ItemId: number;
    data: {
      ItemId: number;
    };
  }>;
  phantomskill: Array<{
    Id: number;
    PhantomSkillId: number;
    data: {
      Id: number;
      PhantomSkillId: number;
      BuffIds: Array<string>;
      SettleIds: Array<string>;
      BuffEffects: Array<any>;
      ChargeEfficiency: number;
      SkillGroupId: number;
      SkillCD: number;
      DescriptionEx: string;
      SimplyDescription: string;
      IfCounterSkill: boolean;
      CurLevelDescriptionEx: Array<string>;
      LevelDescStrArray: Array<{
        j7: {
          bytes_: {
            "0": number;
            "1": number;
            "2": number;
            "3": number;
            "4": number;
            "5": number;
            "6": number;
            "7": number;
            "8": number;
            "9": number;
            "10": number;
            "11": number;
            "12": number;
            "13": number;
            "14": number;
            "15": number;
            "16": number;
            "17": number;
            "18": number;
            "19": number;
            "20": number;
            "21": number;
            "22": number;
            "23": number;
            "24": number;
            "25": number;
            "26": number;
            "27": number;
            "28": number;
            "29": number;
            "30": number;
            "31": number;
            "32": number;
            "33": number;
            "34": number;
            "35": number;
            "36": number;
            "37": number;
            "38": number;
            "39": number;
            "40": number;
            "41": number;
            "42": number;
            "43": number;
            "44": number;
            "45": number;
            "46": number;
            "47": number;
            "48": number;
            "49": number;
            "50": number;
            "51": number;
            "52": number;
            "53": number;
            "54": number;
            "55": number;
            "56": number;
            "57": number;
            "58": number;
            "59": number;
            "60": number;
            "61": number;
            "62": number;
            "63": number;
            "64": number;
            "65": number;
            "66": number;
            "67": number;
            "68": number;
            "69": number;
            "70": number;
            "71": number;
            "72": number;
            "73": number;
            "74": number;
            "75": number;
            "76": number;
            "77": number;
            "78": number;
            "79": number;
            "80": number;
            "81": number;
            "82": number;
            "83": number;
            "84": number;
            "85": number;
            "86": number;
            "87": number;
            "88": number;
            "89": number;
            "90": number;
            "91": number;
            "92": number;
            "93": number;
            "94": number;
            "95": number;
            "96": number;
            "97": number;
            "98": number;
            "99": number;
            "100": number;
            "101": number;
            "102": number;
            "103": number;
            "104": number;
            "105": number;
            "106": number;
            "107": number;
            "108": number;
            "109": number;
            "110": number;
            "111": number;
            "112": number;
            "113": number;
            "114": number;
            "115": number;
            "116": number;
            "117": number;
            "118": number;
            "119": number;
            "120": number;
            "121": number;
            "122": number;
            "123": number;
            "124": number;
            "125": number;
            "126": number;
            "127": number;
            "128": number;
            "129": number;
            "130": number;
            "131": number;
            "132": number;
            "133": number;
            "134": number;
            "135": number;
            "136": number;
            "137": number;
            "138": number;
            "139": number;
            "140": number;
            "141": number;
            "142": number;
            "143": number;
            "144": number;
            "145": number;
            "146": number;
            "147": number;
            "148": number;
            "149": number;
            "150": number;
            "151": number;
            "152": number;
            "153": number;
            "154": number;
            "155": number;
            "156": number;
            "157": number;
            "158": number;
            "159": number;
            "160": number;
            "161": number;
            "162": number;
            "163": number;
            "164": number;
            "165": number;
            "166": number;
            "167": number;
            "168": number;
            "169": number;
            "170": number;
            "171": number;
            "172": number;
            "173": number;
            "174": number;
            "175": number;
            "176": number;
            "177": number;
            "178": number;
            "179": number;
            "180": number;
            "181": number;
            "182": number;
            "183": number;
            "184": number;
            "185": number;
            "186": number;
            "187": number;
            "188": number;
            "189": number;
            "190": number;
            "191": number;
            "192": number;
            "193": number;
            "194": number;
            "195": number;
            "196": number;
            "197": number;
            "198": number;
            "199": number;
            "200": number;
            "201": number;
            "202": number;
            "203": number;
            "204": number;
            "205": number;
            "206": number;
            "207": number;
            "208": number;
            "209": number;
            "210": number;
            "211": number;
            "212": number;
            "213": number;
            "214": number;
            "215": number;
            "216": number;
            "217": number;
            "218": number;
            "219": number;
            "220": number;
            "221": number;
            "222": number;
            "223": number;
            "224": number;
            "225": number;
            "226": number;
            "227": number;
            "228": number;
            "229": number;
            "230": number;
            "231": number;
            "232": number;
            "233": number;
            "234": number;
            "235": number;
            "236": number;
            "237": number;
            "238": number;
            "239": number;
            "240": number;
            "241": number;
            "242": number;
            "243": number;
            "244": number;
            "245": number;
            "246": number;
            "247": number;
            "248": number;
            "249": number;
            "250": number;
            "251": number;
            "252": number;
            "253": number;
            "254": number;
            "255": number;
            "256": number;
            "257": number;
            "258": number;
            "259": number;
            "260": number;
            "261": number;
            "262": number;
            "263": number;
            "264": number;
            "265": number;
            "266": number;
            "267": number;
            "268": number;
            "269": number;
            "270": number;
            "271": number;
            "272": number;
            "273": number;
            "274": number;
            "275": number;
            "276": number;
            "277": number;
            "278": number;
            "279": number;
            "280": number;
            "281": number;
            "282": number;
            "283": number;
            "284": number;
            "285": number;
            "286": number;
            "287": number;
            "288": number;
            "289": number;
            "290": number;
            "291": number;
            "292": number;
            "293": number;
            "294": number;
            "295": number;
            "296": number;
            "297": number;
            "298": number;
            "299": number;
            "300": number;
            "301": number;
            "302": number;
            "303": number;
            "304": number;
            "305": number;
            "306": number;
            "307": number;
            "308": number;
            "309": number;
            "310": number;
            "311": number;
            "312": number;
            "313": number;
            "314": number;
            "315": number;
            "316": number;
            "317": number;
            "318": number;
            "319": number;
            "320": number;
            "321": number;
            "322": number;
            "323": number;
            "324": number;
            "325": number;
            "326": number;
            "327": number;
            "328": number;
            "329": number;
            "330": number;
            "331": number;
            "332": number;
            "333": number;
            "334": number;
            "335": number;
            "336": number;
            "337": number;
            "338": number;
            "339": number;
            "340": number;
            "341": number;
            "342": number;
            "343": number;
            "344": number;
            "345": number;
            "346": number;
            "347": number;
            "348": number;
            "349": number;
            "350": number;
            "351": number;
            "352": number;
            "353": number;
            "354": number;
            "355": number;
            "356": number;
            "357": number;
            "358": number;
            "359": number;
            "360": number;
            "361": number;
            "362": number;
            "363": number;
            "364": number;
            "365": number;
            "366": number;
            "367": number;
            "368": number;
            "369": number;
            "370": number;
            "371": number;
            "372": number;
            "373": number;
            "374": number;
            "375": number;
            "376": number;
            "377": number;
            "378": number;
            "379": number;
            "380": number;
            "381": number;
            "382": number;
            "383": number;
            "384": number;
            "385": number;
            "386": number;
            "387": number;
            "388": number;
            "389": number;
            "390": number;
            "391": number;
            "392": number;
            "393": number;
            "394": number;
            "395": number;
            "396": number;
            "397": number;
            "398": number;
            "399": number;
            "400": number;
            "401": number;
            "402": number;
            "403": number;
            "404": number;
            "405": number;
            "406": number;
            "407": number;
            "408"?: number;
            "409"?: number;
            "410"?: number;
            "411"?: number;
            "412"?: number;
            "413"?: number;
            "414"?: number;
            "415"?: number;
            "416"?: number;
            "417"?: number;
            "418"?: number;
            "419"?: number;
            "420"?: number;
            "421"?: number;
            "422"?: number;
            "423"?: number;
            "424"?: number;
            "425"?: number;
            "426"?: number;
            "427"?: number;
            "428"?: number;
            "429"?: number;
            "430"?: number;
            "431"?: number;
            "432"?: number;
            "433"?: number;
            "434"?: number;
            "435"?: number;
            "436"?: number;
            "437"?: number;
            "438"?: number;
            "439"?: number;
            "440"?: number;
            "441"?: number;
            "442"?: number;
            "443"?: number;
            "444"?: number;
            "445"?: number;
            "446"?: number;
            "447"?: number;
            "448"?: number;
            "449"?: number;
            "450"?: number;
            "451"?: number;
            "452"?: number;
            "453"?: number;
            "454"?: number;
            "455"?: number;
            "456"?: number;
            "457"?: number;
            "458"?: number;
            "459"?: number;
            "460"?: number;
            "461"?: number;
            "462"?: number;
            "463"?: number;
            "464"?: number;
            "465"?: number;
            "466"?: number;
            "467"?: number;
            "468"?: number;
            "469"?: number;
            "470"?: number;
            "471"?: number;
            "472"?: number;
            "473"?: number;
            "474"?: number;
            "475"?: number;
            "476"?: number;
            "477"?: number;
            "478"?: number;
            "479"?: number;
            "480"?: number;
            "481"?: number;
            "482"?: number;
            "483"?: number;
            "484"?: number;
            "485"?: number;
            "486"?: number;
            "487"?: number;
            "488"?: number;
            "489"?: number;
            "490"?: number;
            "491"?: number;
            "492"?: number;
            "493"?: number;
            "494"?: number;
            "495"?: number;
            "496"?: number;
            "497"?: number;
            "498"?: number;
            "499"?: number;
            "500"?: number;
            "501"?: number;
            "502"?: number;
            "503"?: number;
            "504"?: number;
            "505"?: number;
            "506"?: number;
            "507"?: number;
            "508"?: number;
            "509"?: number;
            "510"?: number;
            "511"?: number;
            "512"?: number;
            "513"?: number;
            "514"?: number;
            "515"?: number;
            "516"?: number;
            "517"?: number;
            "518"?: number;
            "519"?: number;
            "520"?: number;
            "521"?: number;
            "522"?: number;
            "523"?: number;
            "524"?: number;
            "525"?: number;
            "526"?: number;
            "527"?: number;
            "528"?: number;
            "529"?: number;
            "530"?: number;
            "531"?: number;
            "532"?: number;
            "533"?: number;
            "534"?: number;
            "535"?: number;
            "536"?: number;
            "537"?: number;
            "538"?: number;
            "539"?: number;
            "540"?: number;
            "541"?: number;
            "542"?: number;
            "543"?: number;
            "544"?: number;
            "545"?: number;
            "546"?: number;
            "547"?: number;
            "548"?: number;
            "549"?: number;
            "550"?: number;
            "551"?: number;
            "552"?: number;
            "553"?: number;
            "554"?: number;
            "555"?: number;
            "556"?: number;
            "557"?: number;
            "558"?: number;
            "559"?: number;
            "560"?: number;
            "561"?: number;
            "562"?: number;
            "563"?: number;
            "564"?: number;
            "565"?: number;
            "566"?: number;
            "567"?: number;
            "568"?: number;
            "569"?: number;
            "570"?: number;
            "571"?: number;
            "572"?: number;
            "573"?: number;
            "574"?: number;
            "575"?: number;
            "576"?: number;
            "577"?: number;
            "578"?: number;
            "579"?: number;
            "580"?: number;
            "581"?: number;
            "582"?: number;
            "583"?: number;
            "584"?: number;
            "585"?: number;
            "586"?: number;
            "587"?: number;
            "588"?: number;
            "589"?: number;
            "590"?: number;
            "591"?: number;
            "592"?: number;
            "593"?: number;
            "594"?: number;
            "595"?: number;
            "596"?: number;
            "597"?: number;
            "598"?: number;
            "599"?: number;
            "600"?: number;
            "601"?: number;
            "602"?: number;
            "603"?: number;
            "604"?: number;
            "605"?: number;
            "606"?: number;
            "607"?: number;
            "608"?: number;
            "609"?: number;
            "610"?: number;
            "611"?: number;
            "612"?: number;
            "613"?: number;
            "614"?: number;
            "615"?: number;
            "616"?: number;
            "617"?: number;
            "618"?: number;
            "619"?: number;
            "620"?: number;
            "621"?: number;
            "622"?: number;
            "623"?: number;
            "624"?: number;
            "625"?: number;
            "626"?: number;
            "627"?: number;
            "628"?: number;
            "629"?: number;
            "630"?: number;
            "631"?: number;
            "632"?: number;
            "633"?: number;
            "634"?: number;
            "635"?: number;
            "636"?: number;
            "637"?: number;
            "638"?: number;
            "639"?: number;
            "640"?: number;
            "641"?: number;
            "642"?: number;
            "643"?: number;
            "644"?: number;
            "645"?: number;
            "646"?: number;
            "647"?: number;
            "648"?: number;
            "649"?: number;
            "650"?: number;
            "651"?: number;
            "652"?: number;
            "653"?: number;
            "654"?: number;
            "655"?: number;
            "656"?: number;
            "657"?: number;
            "658"?: number;
            "659"?: number;
            "660"?: number;
            "661"?: number;
            "662"?: number;
            "663"?: number;
            "664"?: number;
            "665"?: number;
            "666"?: number;
            "667"?: number;
            "668"?: number;
            "669"?: number;
            "670"?: number;
            "671"?: number;
            "672"?: number;
            "673"?: number;
            "674"?: number;
            "675"?: number;
            "676"?: number;
            "677"?: number;
            "678"?: number;
            "679"?: number;
            "680"?: number;
            "681"?: number;
            "682"?: number;
            "683"?: number;
            "684"?: number;
            "685"?: number;
            "686"?: number;
            "687"?: number;
            "688"?: number;
            "689"?: number;
            "690"?: number;
            "691"?: number;
            "692"?: number;
            "693"?: number;
            "694"?: number;
            "695"?: number;
            "696"?: number;
            "697"?: number;
            "698"?: number;
            "699"?: number;
            "700"?: number;
            "701"?: number;
            "702"?: number;
            "703"?: number;
            "704"?: number;
            "705"?: number;
            "706"?: number;
            "707"?: number;
            "708"?: number;
            "709"?: number;
            "710"?: number;
            "711"?: number;
            "712"?: number;
            "713"?: number;
            "714"?: number;
            "715"?: number;
            "716"?: number;
            "717"?: number;
            "718"?: number;
            "719"?: number;
            "720"?: number;
            "721"?: number;
            "722"?: number;
            "723"?: number;
            "724"?: number;
            "725"?: number;
            "726"?: number;
            "727"?: number;
            "728"?: number;
            "729"?: number;
            "730"?: number;
            "731"?: number;
            "732"?: number;
            "733"?: number;
            "734"?: number;
            "735"?: number;
            "736"?: number;
            "737"?: number;
            "738"?: number;
            "739"?: number;
            "740"?: number;
            "741"?: number;
            "742"?: number;
            "743"?: number;
            "744"?: number;
            "745"?: number;
            "746"?: number;
            "747"?: number;
            "748"?: number;
            "749"?: number;
            "750"?: number;
            "751"?: number;
            "752"?: number;
            "753"?: number;
            "754"?: number;
            "755"?: number;
            "756"?: number;
            "757"?: number;
            "758"?: number;
            "759"?: number;
            "760"?: number;
            "761"?: number;
            "762"?: number;
            "763"?: number;
            "764"?: number;
            "765"?: number;
            "766"?: number;
            "767"?: number;
            "768"?: number;
            "769"?: number;
            "770"?: number;
            "771"?: number;
            "772"?: number;
            "773"?: number;
            "774"?: number;
            "775"?: number;
            "776"?: number;
            "777"?: number;
            "778"?: number;
            "779"?: number;
            "780"?: number;
            "781"?: number;
            "782"?: number;
            "783"?: number;
            "784"?: number;
            "785"?: number;
            "786"?: number;
            "787"?: number;
            "788"?: number;
            "789"?: number;
            "790"?: number;
            "791"?: number;
            "792"?: number;
            "793"?: number;
            "794"?: number;
            "795"?: number;
            "796"?: number;
            "797"?: number;
            "798"?: number;
            "799"?: number;
            "800"?: number;
            "801"?: number;
            "802"?: number;
            "803"?: number;
            "804"?: number;
            "805"?: number;
            "806"?: number;
            "807"?: number;
            "808"?: number;
            "809"?: number;
            "810"?: number;
            "811"?: number;
            "812"?: number;
            "813"?: number;
            "814"?: number;
            "815"?: number;
            "816"?: number;
            "817"?: number;
            "818"?: number;
            "819"?: number;
            "820"?: number;
            "821"?: number;
            "822"?: number;
            "823"?: number;
            "824"?: number;
            "825"?: number;
            "826"?: number;
            "827"?: number;
            "828"?: number;
            "829"?: number;
            "830"?: number;
            "831"?: number;
            "832"?: number;
            "833"?: number;
            "834"?: number;
            "835"?: number;
            "836"?: number;
            "837"?: number;
            "838"?: number;
            "839"?: number;
            "840"?: number;
            "841"?: number;
            "842"?: number;
            "843"?: number;
            "844"?: number;
            "845"?: number;
            "846"?: number;
            "847"?: number;
            "848"?: number;
            "849"?: number;
            "850"?: number;
            "851"?: number;
            "852"?: number;
            "853"?: number;
            "854"?: number;
            "855"?: number;
            "856"?: number;
            "857"?: number;
            "858"?: number;
            "859"?: number;
            "860"?: number;
            "861"?: number;
            "862"?: number;
            "863"?: number;
            "864"?: number;
            "865"?: number;
            "866"?: number;
            "867"?: number;
            "868"?: number;
            "869"?: number;
            "870"?: number;
            "871"?: number;
            "872"?: number;
            "873"?: number;
            "874"?: number;
            "875"?: number;
            "876"?: number;
            "877"?: number;
            "878"?: number;
            "879"?: number;
            "880"?: number;
            "881"?: number;
            "882"?: number;
            "883"?: number;
            "884"?: number;
            "885"?: number;
            "886"?: number;
            "887"?: number;
            "888"?: number;
            "889"?: number;
            "890"?: number;
            "891"?: number;
            "892"?: number;
            "893"?: number;
            "894"?: number;
            "895"?: number;
            "896"?: number;
            "897"?: number;
            "898"?: number;
            "899"?: number;
            "900"?: number;
            "901"?: number;
            "902"?: number;
            "903"?: number;
            "904"?: number;
            "905"?: number;
            "906"?: number;
            "907"?: number;
            "908"?: number;
            "909"?: number;
            "910"?: number;
            "911"?: number;
            "912"?: number;
            "913"?: number;
            "914"?: number;
            "915"?: number;
            "916"?: number;
            "917"?: number;
            "918"?: number;
            "919"?: number;
            "920"?: number;
            "921"?: number;
            "922"?: number;
            "923"?: number;
            "924"?: number;
            "925"?: number;
            "926"?: number;
            "927"?: number;
            "928"?: number;
            "929"?: number;
            "930"?: number;
            "931"?: number;
            "932"?: number;
            "933"?: number;
            "934"?: number;
            "935"?: number;
            "936"?: number;
            "937"?: number;
            "938"?: number;
            "939"?: number;
            "940"?: number;
            "941"?: number;
            "942"?: number;
            "943"?: number;
            "944"?: number;
            "945"?: number;
            "946"?: number;
            "947"?: number;
            "948"?: number;
            "949"?: number;
            "950"?: number;
            "951"?: number;
            "952"?: number;
            "953"?: number;
            "954"?: number;
            "955"?: number;
            "956"?: number;
            "957"?: number;
            "958"?: number;
            "959"?: number;
            "960"?: number;
            "961"?: number;
            "962"?: number;
            "963"?: number;
            "964"?: number;
            "965"?: number;
            "966"?: number;
            "967"?: number;
            "968"?: number;
            "969"?: number;
            "970"?: number;
            "971"?: number;
            "972"?: number;
            "973"?: number;
            "974"?: number;
            "975"?: number;
            "976"?: number;
            "977"?: number;
            "978"?: number;
            "979"?: number;
            "980"?: number;
            "981"?: number;
            "982"?: number;
            "983"?: number;
            "984"?: number;
            "985"?: number;
            "986"?: number;
            "987"?: number;
            "988"?: number;
            "989"?: number;
            "990"?: number;
            "991"?: number;
            "992"?: number;
            "993"?: number;
            "994"?: number;
            "995"?: number;
            "996"?: number;
            "997"?: number;
            "998"?: number;
            "999"?: number;
            "1000"?: number;
            "1001"?: number;
            "1002"?: number;
            "1003"?: number;
            "1004"?: number;
            "1005"?: number;
            "1006"?: number;
            "1007"?: number;
            "1008"?: number;
            "1009"?: number;
            "1010"?: number;
            "1011"?: number;
            "1012"?: number;
            "1013"?: number;
            "1014"?: number;
            "1015"?: number;
            "1016"?: number;
            "1017"?: number;
            "1018"?: number;
            "1019"?: number;
            "1020"?: number;
            "1021"?: number;
            "1022"?: number;
            "1023"?: number;
            "1024"?: number;
            "1025"?: number;
            "1026"?: number;
            "1027"?: number;
            "1028"?: number;
            "1029"?: number;
            "1030"?: number;
            "1031"?: number;
            "1032"?: number;
            "1033"?: number;
            "1034"?: number;
            "1035"?: number;
            "1036"?: number;
            "1037"?: number;
            "1038"?: number;
            "1039"?: number;
            "1040"?: number;
            "1041"?: number;
            "1042"?: number;
            "1043"?: number;
            "1044"?: number;
            "1045"?: number;
            "1046"?: number;
            "1047"?: number;
            "1048"?: number;
            "1049"?: number;
            "1050"?: number;
            "1051"?: number;
            "1052"?: number;
            "1053"?: number;
            "1054"?: number;
            "1055"?: number;
            "1056"?: number;
            "1057"?: number;
            "1058"?: number;
            "1059"?: number;
            "1060"?: number;
            "1061"?: number;
            "1062"?: number;
            "1063"?: number;
          };
          position_: number;
          text_decoder_: {
            _encoding: {
              labels: Array<string>;
              name: string;
            };
            _decoder: any;
            _ignoreBOM: boolean;
            _BOMseen: boolean;
            _error_mode: string;
            _do_not_flush: boolean;
          };
        };
        W7: number;
      }>;
      BattleViewIcon: string;
      SpecialBattleViewIcon: string;
    };
  }>;
  phantomsubproperty: Array<{
    Id: number;
    PropId: number;
    data: {
      Id: number;
      PropId: number;
      AddType: number;
      SubStandardProperty: number;
    };
  }>;
  phantomfettergroup: Array<{
    Id: number;
    data: {
      Id: number;
      FetterMap: {};
      FetterGroupName: string;
      FetterGroupDesc: string;
      FetterElementColor: string;
      FetterElementPath: string;
    };
  }>;
  phantomcustomizeitem: Array<{
    ItemId: number;
    data: {
      ItemId: number;
      PhantomId: number;
    };
  }>;
};

export type DBQuestNodeData = {
  questnodedata: Array<{
    Key: string;
    data: {
      Key: string;
      Data: {
        Type: string;
        Id: number;
        Desc: string;
        Condition?: {
          Type: any;
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
                    TipOption?: {
                      TidMainText: string;
                      Type: number;
                    };
                    FlowListName?: string;
                    FlowId?: number;
                    StateId?: number;
                    DungeonId?: number;
                    IsRegroup?: boolean;
                    Items?: Array<{
                      ItemId: number;
                      Count: number;
                    }>;
                    EntityIds?: Array<number>;
                    Level?: string;
                    Content?: string;
                    TelePortConfig?: {
                      Type: number;
                      TargetPos: {
                        X: number;
                        Y: number;
                        Z: number;
                        A: number;
                      };
                    };
                    DelayShow?: boolean;
                    RangeEntities?: Array<number>;
                    RangeEntity?: number;
                    HideConfig?: {
                      Type: string;
                    };
                    Configs?: Array<{
                      LevelPlayId: number;
                      Enable: boolean;
                    }>;
                    Visible?: boolean;
                    SystemType?: string;
                    BoardId?: number;
                    Ease?: {
                      Type: number;
                      Duration: number;
                    };
                    ScreenType?: string;
                    EventConfig?: {
                      Type: string;
                      AkEvent: string;
                    };
                    Type?: string;
                    EntityId?: number;
                    State?: string;
                    DisplayMode?: string;
                    Pos?: {
                      X: number;
                      Y: number;
                      Z: number;
                    };
                    CameraMove?: boolean;
                    IsSelf?: boolean;
                    Location?: number;
                    Time?: number;
                  };
                  ActionGuid: string;
                  ActionId: number;
                }>;
              };
              DoIntactType?: string;
              TidContent?: string;
              Range?: number;
              Condition?: {
                Type: number;
                Conditions: Array<{
                  Type: string;
                  EntityId: number;
                  Compare: string;
                  State?: string;
                  IsSelf?: boolean;
                  Location?: number;
                }>;
              };
            };
            IsManualFinish?: boolean;
            IsManualDelete?: boolean;
          }>;
          Time?: number;
          TimerType?: string;
          Pos?: {
            X: number;
            Y: number;
            Z?: number;
          };
          Range?: number;
          RangeEntityId?: number;
          Count?: number;
          Option?: Array<{
            Type: string;
            Option?: {
              Type: string;
              Min: number;
              Max: number;
            };
            EntityIds?: Array<number>;
            EntityId?: number;
            TagConfigId?: number;
          }>;
          LevelPlayIds?: Array<number>;
          CompleteNumber?: number;
          Flow?: {
            FlowListName: string;
            FlowId: number;
            StateId: number;
          };
          EntityId?: number;
          State?: string;
          Conditions?: Array<{
            Type?: string;
            Gender?: string;
            EntityId?: number;
            State: any;
            Var1?: {
              Type: string;
              Source: string;
              Value: any;
              Name?: string;
              Keyword?: string;
            };
            Compare?: string;
            Var2?: {
              Type: string;
              Source: string;
              Value: any;
            };
            QuestId?: number;
            ChildQuestId?: number;
            Items?: Array<{
              ItemId: number;
              Count: number;
            }>;
            SkillOption?: {
              Type: string;
            };
            MotionState?: string;
            LevelId?: number;
            Number?: number;
          }>;
          EnterType?: {
            Type: string;
            DungeonId?: number;
            DungeonSubType?: number;
          };
          ExistTargets?: Array<number>;
          TargetsToAwake?: Array<number>;
          PhotoTargets?: Array<{
            EntityId: number;
            TidDescription: string;
          }>;
          HandInItems?: {
            Items?: Array<{
              HandInType: string;
              ItemIds: Array<number>;
              Count: number;
            }>;
            RepeatItems: boolean;
            TidDescText: string;
            GroupConfig?: {
              HandInType: string;
              ItemIds: Array<number>;
              Count: number;
              Slot: number;
              ChoiceRange: {
                HandInType: string;
                ItemIds: Array<number>;
              };
            };
          };
          AddOption?: {
            EntityId: number;
            Option: {
              TidContent?: string;
              Guid: string;
              Type: {
                Type: string;
                Actions: Array<any>;
              };
              DoIntactType: string;
            };
          };
          SkillType?: string;
          SkillId?: number;
          TelecomId?: number;
          Check?: {
            Type: string;
            SkillGenre?: number;
            SkillId?: number;
            VisionId?: number;
          };
          UiType?: {
            Type: string;
            InformationViewId?: number;
          };
          Condition?: {
            Type: string;
            DungeonId?: number;
            Count: number;
            IsExitDungeon?: boolean;
            DungeonSubType?: number;
          };
          PreConditions?: {
            Type: number;
            Conditions: Array<{
              Type: string;
              Center?: {
                X: number;
                Y: number;
                Z: number;
                A?: number;
              };
              Radius?: number;
              Compare?: string;
              Start?: {
                Hour: number;
                Min: number;
              };
              End?: {
                Hour: number;
                Min: number;
              };
            }>;
          };
          GuideGroupId?: number;
          Items?: Array<{
            ItemId: number;
            Count: number;
          }>;
          PosCondition?: {
            RangeEntity: number;
            TidDescription: string;
          };
          GameplayConfigs?: Array<{
            Type: string;
            MorseCodeId?: string;
            CipherId?: string;
          }>;
          Quest?: {
            Type: string;
            TargetLevel?: number;
            SetType?: number;
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
          Days?: number;
          Hours?: number;
          Minutes?: number;
          Seconds?: number;
          MonsterCreatorEntityIds?: Array<number>;
          MailId?: number;
          ItemId?: number;
          ItemVars?: Array<{
            Type: string;
            ItemId: number;
            Var: {
              Type: string;
              Source: string;
              Name: string;
            };
          }>;
          TimeCondition?: {
            TimeRange: {
              Start: {
                Hour: number;
                Min: number;
              };
              End: {
                Hour: number;
                Min: number;
              };
            };
            TidDescription: string;
            Compare: string;
          };
        };
        TidTip?: string;
        TrackTarget?: {
          TrackType: {
            Type: string;
            EntityIds?: Array<number>;
            Locations?: Array<{
              X: number;
              Y: number;
              Z?: number;
              A?: number;
            }>;
            VisionDropEntities?: Array<number>;
          };
          EffectOption?: {
            Type: string;
            EnterRange: number;
            LeaveRange: number;
          };
          Range?: number;
          ViewRange?: number;
          TrackViewMode?: string;
          Effect?: string;
        };
        EnterActions?: Array<{
          Name: string;
          Params: {
            EntityIds?: Array<number>;
            Type?: string;
            EntityId?: number;
            State: any;
            SystemType: any;
            BoardId?: number;
            Visible?: boolean;
            RangeEntity?: number;
            HideConfig?: {
              Type: string;
              ExcludeEntities?: Array<number>;
            };
            Ease?: {
              Type: number;
              Duration: number;
            };
            ScreenType?: string;
            Conditions?: Array<{
              Type: string;
              InCombat?: boolean;
              Compare?: string;
              MotionState?: string;
            }>;
            GuideId?: number;
            Pos?: {
              X: number;
              Y: number;
              Z?: number;
            };
            FadeInTime?: number;
            StayTime?: number;
            FadeOutTime?: number;
            LockCamera?: boolean;
            IsEnable?: boolean;
            VarLeft?: {
              Type: string;
              Source: string;
              Name?: string;
              Keyword?: string;
            };
            VarRight?: {
              Type: string;
              Source: string;
              Value: any;
            };
            CharacterId?: number;
            CharacterGroup?: Array<number>;
            EventConfig?: {
              Type: string;
              AkEvent: string;
            };
            Flow?: {
              FlowListName: string;
              FlowId: number;
              StateId?: number;
            };
            EnterRadius?: number;
            LeaveRadius?: number;
            TipOption?: {
              Type: number;
              TidMainText: string;
              TidSubText: string;
            };
            GameplayConfig?: {
              Type: string;
              MorseCodeId?: string;
            };
            FlowListName?: string;
            FlowId?: number;
            StateId?: number;
            SplineEntityId?: number;
            Duration?: number;
            Configs?: Array<{
              LevelPlayId: number;
              Enable: boolean;
            }>;
            Time?: number;
            LockState?: string;
            Hour?: number;
            Min?: number;
            ShowUi?: boolean;
            LoadDataLayers?: Array<number>;
            UnloadDataLayers?: Array<number>;
            DelayShow?: boolean;
            RangeEntities?: Array<number>;
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
              DisplayMode: string;
            };
            CameraOption?: {
              Type: string;
            };
            UiOption?: {
              Type: string;
              ShowMiniMap?: boolean;
              ShowQuestTrack?: boolean;
              ShowEsc?: boolean;
              ShowSystem?: boolean;
              ShowScreenEffect?: boolean;
            };
            SceneInteractionOption?: {
              Type: string;
            };
            Level?: string;
            Content?: string;
            Items?: Array<{
              ItemId: number;
              Count: number;
            }>;
            RedDot?: boolean;
            BuffIds?: Array<number>;
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
              Condition?: {
                Type: number;
                Conditions: Array<{
                  Type: string;
                  QuestId?: number;
                  Compare: string;
                  State: any;
                  EntityId?: number;
                }>;
              };
            };
            FunctionId?: number;
            WeatherId?: number;
            TelePortConfig?: {
              Type: number;
              TargetPos: {
                X: number;
                Y: number;
                Z: number;
                A: number;
              };
            };
            ActionMontage?: {
              Path: string;
              MontageType: string;
            };
            MontageId?: number;
            IsAbpMontage?: boolean;
            LoopDuration?: number;
            OccupationType?: string;
            Occupations?: Array<string>;
            DisplayMode?: string;
            ActionList?: Array<{
              Name: string;
              Params: {
                EntityId?: number;
                ActionMontage?: {
                  Path: string;
                  MontageType: string;
                };
                Time?: number;
                Pos?: {
                  X: number;
                  Y: number;
                };
                Flow?: {
                  FlowListName: string;
                  FlowId: number;
                };
              };
              ActionId: number;
              ActionGuid: string;
            }>;
            AreaId?: number;
            ActiveRange?: {
              CheckPoint: {
                X: number;
                Y: number;
                Z: number;
              };
              CheckEnterRange: number;
              CheckLeaveRange: number;
            };
            IsHideSimpleNpc?: boolean;
            CameraMove?: boolean;
            AutoChange?: boolean;
            CreateTempTeam?: boolean;
            IsHidePasserByNpc?: boolean;
            Fov?: number;
            HideUi?: boolean;
            WaitTime?: number;
            SkillType?: number;
            SetReviveType?: string;
            ReviveId?: number;
            MailId?: number;
            TeleportId?: number;
            IsSelf?: boolean;
            Location?: number;
            CameraPos?: {
              X: number;
              Y: number;
              Z: number;
            };
            Enable?: boolean;
            DungeonId?: number;
            IsRegroup?: boolean;
            ItemId?: number;
            Count?: number;
            IsAll?: boolean;
          };
          ActionGuid?: string;
          ActionId: number;
          Async?: boolean;
          Disabled?: boolean;
        }>;
        FinishActions?: Array<{
          Name: string;
          Params: {
            EntityIds?: Array<number>;
            Type?: string;
            Conditions?: Array<{
              Type: string;
              InCombat?: boolean;
              Compare?: string;
              MotionState?: string;
              Option?: {
                Type: string;
                Option: any;
              };
            }>;
            GuideId?: number;
            Ease?: {
              Type: number;
              Duration: number;
            };
            ScreenType?: string;
            EntityId?: number;
            State: any;
            DelayChange?: boolean;
            SystemType: any;
            BoardId?: number;
            DelayShow?: boolean;
            RangeEntities?: Array<number>;
            FlowListName?: string;
            FlowId?: number;
            StateId?: number;
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
            BuffIds?: Array<number>;
            DelayDestroy?: boolean;
            RangeEntity?: number;
            HideConfig?: {
              Type: string;
              ExcludeEntities?: Array<number>;
            };
            TipOption?: {
              TidMainText: string;
              Type: number;
              TidSubText?: string;
            };
            DisplayMode?: string;
            Time?: number;
            SplineEntityId?: number;
            Items?: Array<{
              ItemId: number;
              Count: number;
            }>;
            MontageId?: number;
            IsAbpMontage?: boolean;
            LoopDuration?: number;
            IsEnable?: boolean;
            LockState?: string;
            Visible?: boolean;
            DungeonId?: number;
            IsRegroup?: boolean;
            LocationEntityId?: number;
            SkillOption?: {
              Type: string;
              DisplayMode?: string;
            };
            Pos?: {
              X: number;
              Y: number;
              Z: number;
            };
            FadeInTime?: number;
            StayTime?: number;
            FadeOutTime?: number;
            LockCamera?: boolean;
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
            IsHideSimpleNpc?: boolean;
            GeneralTextId?: number;
            ChapterState?: number;
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
                X?: number;
              };
              OverlayArmLength?: number;
            };
            EnterRadius?: number;
            LeaveRadius?: number;
            Flow?: {
              FlowListName: string;
              FlowId: number;
              StateId?: number;
            };
            SystemOption?: {
              Type: string;
              UnlockOption: {
                Type: string;
                Id: number;
              };
            };
            Fov?: number;
            OnlyClearRedDot?: boolean;
            QuestId?: number;
            UiType?: number;
            Configs?: Array<{
              LevelPlayId: number;
              Enable: boolean;
            }>;
            TeleportId?: number;
            TelePortConfig?: {
              Type: number;
              TargetPos?: {
                X: number;
                Y: number;
                Z: number;
                A?: number;
              };
              EntityIds?: Array<number>;
            };
            EventConfig?: {
              Type: string;
              AkEvent: string;
            };
            MarkId?: number;
            TransitionOption?: {
              Type: string;
              Mp4Path?: string;
              CenterTextFlow?: {
                FlowListName: string;
                FlowId: number;
                StateId: number;
              };
            };
            ItemId?: number;
            Count?: number;
            IsAll?: boolean;
            RedDot?: boolean;
            Hour?: number;
            Min?: number;
            ShowUi?: boolean;
            Level?: string;
            Content?: string;
            OccupationType?: string;
            Occupations?: Array<string>;
            WaitTime?: number;
            WuYinQuName?: string;
            AreaId?: number;
            CharacterId?: number;
            CharacterGroup?: Array<number>;
            Duration?: number;
            LoadDataLayers?: Array<number>;
            UnloadDataLayers?: Array<number>;
            CameraMove?: boolean;
            RegionMpcId?: number;
            SetReviveType?: string;
            ReviveId?: number;
            ActionMontage?: {
              Path: string;
              MontageType: string;
            };
            IsHidePasserByNpc?: boolean;
            CameraShakeBp?: string;
            CameraShakeConfig?: {
              Type: string;
            };
            SkillType?: number;
            MoveOption?: {
              Type: string;
              Forward?: boolean;
              Back?: boolean;
              Left?: boolean;
              Right?: boolean;
              ForceWalk?: boolean;
              ForbidSprint?: boolean;
            };
            UiConfig?: {
              Type: number;
              ShowDetail?: boolean;
              Title: string;
            };
            Enable?: boolean;
            BattleOption?: {
              Type: string;
              TargetEntityId: number;
              MonsterEntityIds: Array<number>;
              MoveEvent: string;
            };
            IsSelf?: boolean;
            Location?: number;
            WeatherId?: number;
            CameraOption?: {
              Type: string;
            };
            UiOption?: {
              Type: string;
            };
            SceneInteractionOption?: {
              Type: string;
            };
            FunctionId?: number;
          };
          ActionGuid?: string;
          ActionId: number;
          Async?: boolean;
          Disabled?: boolean;
        }>;
        RewardId?: number;
        HideUi?: boolean;
        HideTip?: boolean;
        SaveConfig?: {
          DisableRollbackWhileReconnect?: boolean;
          PosRollbackCfg?: {
            RangeEntityId: number;
            PositionEntityId: number;
          };
          EnterActions?: Array<{
            Name: string;
            Params: {
              Type?: string;
              EntityId?: number;
              State?: string;
              Ease?: {
                Type: number;
                Duration: number;
              };
              ScreenType?: string;
              TelePortConfig?: {
                Type: number;
                TargetPos: {
                  X: number;
                  Y: number;
                  Z: number;
                  A: number;
                };
              };
              SetReviveType?: string;
              ReviveId?: number;
              RangeEntity?: number;
              HideConfig?: {
                Type: string;
                ExcludeEntities?: Array<number>;
              };
              IsHideSimpleNpc?: boolean;
              IsHidePasserByNpc?: boolean;
              EntityIds?: Array<number>;
              FlowListName?: string;
              FlowId?: number;
              StateId?: number;
              Level?: string;
              Content?: string;
              TransitionOption?: {
                Type: string;
                CenterTextFlow: {
                  FlowListName: string;
                  FlowId: number;
                  StateId: number;
                };
              };
              Visible?: boolean;
              Hour?: number;
              Min?: number;
              ShowUi?: boolean;
              LockState?: string;
              CharacterId?: number;
              AutoChange?: boolean;
              ActiveRange?: {
                CheckPoint: {
                  X: number;
                  Y: number;
                  Z: number;
                };
                CheckEnterRange: number;
                CheckLeaveRange: number;
              };
              CharacterGroup?: Array<number>;
              CreateTempTeam?: boolean;
              BuffIds?: Array<number>;
              Configs?: Array<{
                LevelPlayId: number;
                Enable: boolean;
              }>;
              SystemType?: number;
              IsEnable?: boolean;
              ResetEntityConfig?: {
                Type: string;
                EntityIds: Array<number>;
              };
              Time?: number;
              IsSelf?: boolean;
              Location?: number;
            };
            ActionGuid: string;
            ActionId: number;
            Async?: boolean;
          }>;
        };
        Slots?: Array<{
          Condition: {
            Type: number;
            Conditions: Array<{
              Type: string;
              Var1?: {
                Type: string;
                Source: string;
                Name: string;
              };
              Compare?: string;
              Var2?: {
                Type: string;
                Source: string;
                Value: any;
              };
              Gender?: string;
              EntityId?: number;
              State: any;
              IsSelf?: boolean;
              Location?: number;
              Items?: Array<{
                ItemId: number;
                Count: number;
              }>;
              QuestId?: number;
            }>;
          };
          Node: {
            Type: string;
            Id: number;
            Desc: string;
            Children?: Array<{
              Type: string;
              Id: number;
              Desc: string;
              Actions?: Array<{
                Name: string;
                Params: {
                  FlowListName?: string;
                  FlowId?: number;
                  StateId?: number;
                  Type?: string;
                  EntityId?: number;
                  State?: string;
                  CharacterId?: number;
                  CharacterGroup?: Array<number>;
                  AutoChange?: boolean;
                  ActiveRange?: {
                    CheckPoint: {
                      X: number;
                      Y: number;
                      Z: number;
                    };
                    CheckEnterRange: number;
                    CheckLeaveRange: number;
                  };
                  CreateTempTeam?: boolean;
                  Ease?: {
                    Type: number;
                    Duration: number;
                  };
                  ScreenType?: string;
                  EntityIds?: Array<number>;
                  Visible?: boolean;
                };
                ActionGuid: string;
                ActionId: number;
              }>;
              Condition?: {
                Type: any;
                GuideGroupId?: number;
                Flow?: {
                  FlowListName: string;
                  FlowId: number;
                  StateId: number;
                };
                AddOptions?: Array<{
                  EntityId: number;
                  Option: {
                    TidContent?: string;
                    Guid: string;
                    Type: {
                      Type: string;
                      Actions?: Array<{
                        Name: string;
                        Params: {
                          Type?: string;
                          EntityId?: number;
                          State?: string;
                          DisplayMode?: string;
                          Pos?: {
                            X: number;
                            Y: number;
                            Z: number;
                          };
                          CameraMove?: boolean;
                          IsSelf?: boolean;
                          Location?: number;
                          Time?: number;
                        };
                        ActionGuid: string;
                        ActionId: number;
                      }>;
                      Flow?: {
                        FlowListName: string;
                        FlowId: number;
                        StateId: number;
                      };
                    };
                    DoIntactType: string;
                    Condition?: {
                      Type: number;
                      Conditions: Array<{
                        Type: string;
                        EntityId: number;
                        Compare: string;
                        State?: string;
                        IsSelf?: boolean;
                        Location?: number;
                      }>;
                    };
                  };
                  IsManualFinish?: boolean;
                }>;
                Count?: number;
                Conditions?: Array<{
                  EntityId?: number;
                  State: any;
                  Type?: string;
                  QuestId?: number;
                  Compare?: string;
                  Var1?: {
                    Type: string;
                    Source: string;
                    Name: string;
                  };
                  Var2?: {
                    Type: string;
                    Source: string;
                    Value: boolean;
                  };
                }>;
                Check?: {
                  Type: string;
                  SkillId: number;
                };
                PreConditions?: {
                  Type: number;
                  Conditions: Array<{
                    Type: string;
                    Center?: {
                      X: number;
                      Y: number;
                      Z: number;
                    };
                    Radius?: number;
                    Compare?: string;
                    Start?: {
                      Hour: number;
                      Min: number;
                    };
                    End?: {
                      Hour: number;
                      Min: number;
                    };
                  }>;
                };
                Pos?: {
                  X: number;
                  Y: number;
                  Z: number;
                };
                Range?: number;
                EntityId?: number;
                Items?: Array<{
                  ItemId: number;
                  Count: number;
                }>;
                Time?: number;
                TimerType?: string;
                ExistTargets?: Array<any>;
                TargetsToAwake?: Array<number>;
                UiType?: {
                  Type: string;
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
                    A?: number;
                  }>;
                  EntityIds?: Array<number>;
                };
                Range?: number;
              };
              EnterActions?: Array<{
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
                    Value: boolean;
                  };
                  Flow?: {
                    FlowListName: string;
                    FlowId: number;
                  };
                  EntityId?: number;
                  EntityIds?: Array<number>;
                  Type?: string;
                  State?: string;
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
                  Visible?: boolean;
                  GuideId?: number;
                };
                ActionGuid: string;
                ActionId: number;
              }>;
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
                    Value: boolean;
                  };
                  Visible?: boolean;
                  EntityIds?: Array<number>;
                  ChapterState?: number;
                  Ease?: {
                    Type: number;
                    Duration: number;
                  };
                  Level?: string;
                  Content?: string;
                  Time?: number;
                  FlowListName?: string;
                  FlowId?: number;
                  StateId?: number;
                  ScreenType?: string;
                  Type?: string;
                  EntityId?: number;
                  State?: string;
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
                Condition?: {
                  Type: string;
                  Pos?: {
                    X: number;
                    Y: number;
                    Z: number;
                  };
                  Range?: number;
                  ExistTargets?: Array<number>;
                  TargetsToAwake?: Array<number>;
                  Conditions?: Array<{
                    EntityId: number;
                    State: string;
                  }>;
                  UiType?: {
                    Type: string;
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
                      A?: number;
                    }>;
                    EntityIds?: Array<number>;
                  };
                  Range?: number;
                };
                EnterActions?: Array<{
                  Name: string;
                  Params: {
                    EntityIds?: Array<number>;
                    Type?: string;
                    EntityId?: number;
                    State?: string;
                    Level?: string;
                    Content?: string;
                  };
                  ActionGuid: string;
                  ActionId: number;
                }>;
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
                      Value: boolean;
                    };
                    Pos?: {
                      X: number;
                      Y: number;
                      Z: number;
                    };
                    FadeInTime?: number;
                    StayTime?: number;
                    FadeOutTime?: number;
                    LockCamera?: boolean;
                    FlowListName?: string;
                    FlowId?: number;
                    StateId?: number;
                    Type?: string;
                    EntityId?: number;
                    State?: string;
                    EntityIds?: Array<number>;
                    Visible?: boolean;
                  };
                  ActionGuid: string;
                  ActionId: number;
                  Async?: boolean;
                }>;
                FixProcessor?: {
                  FixActions: Array<{
                    Timing: string;
                    Condition: {
                      Type: number;
                      Conditions: Array<{
                        Type: string;
                        EntityIds: Array<number>;
                        IsExist: boolean;
                      }>;
                    };
                    ThenActions: Array<{
                      Name: string;
                      Params: {
                        EntityIds: Array<number>;
                      };
                      ActionGuid: string;
                      ActionId: number;
                    }>;
                  }>;
                };
                FailedCondition?: {
                  IsTransferFailure: boolean;
                  IsTeamDeathFailure: boolean;
                  Timer?: {
                    Time: number;
                    TimerType: string;
                  };
                  CanGiveUp?: boolean;
                };
                Child?: {
                  Type: string;
                  Id: number;
                  Desc: string;
                  Condition: {
                    Type: string;
                    Time: number;
                    TimerType: string;
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
                      Type: string;
                      Conditions: Array<any>;
                      GuideId: number;
                    };
                    ActionGuid: string;
                    ActionId: number;
                  }>;
                  FinishActions: Array<any>;
                  HideUi: boolean;
                  HideTip: boolean;
                };
                HideTip?: boolean;
              }>;
              HideUi?: boolean;
              ShowNavigation?: boolean;
              WaitUntilTrue?: boolean;
              HideTip?: boolean;
              RewardId?: number;
              FailedCondition?: {
                Timer: {
                  Time: number;
                  TimerType: string;
                };
                IsTransferFailure: boolean;
                IsTeamDeathFailure: boolean;
                CanGiveUp: boolean;
              };
            }>;
            Count?: number;
            Slots?: Array<{
              Condition: {
                Type: number;
                Conditions: Array<{
                  Type: string;
                  Compare: string;
                  Items?: Array<{
                    ItemId: number;
                    Count: number;
                  }>;
                  QuestId?: number;
                  State?: number;
                }>;
              };
              Node: {
                Type: string;
                Id: number;
                Desc: string;
                Children?: Array<{
                  Type: string;
                  Id: number;
                  Desc: string;
                  Condition: {
                    Type: string;
                    Check: {
                      Type: string;
                      SkillId: number;
                    };
                    PreConditions: {
                      Type: number;
                      Conditions: Array<{
                        Type: string;
                        Center: {
                          X: number;
                          Y: number;
                          Z: number;
                        };
                        Radius: number;
                      }>;
                    };
                  };
                  TidTip: string;
                  TrackTarget: {
                    TrackType: {
                      Type: string;
                      Locations: Array<{
                        X: number;
                        Y: number;
                        Z: number;
                        A: number;
                      }>;
                    };
                    Range: number;
                  };
                  EnterActions: Array<any>;
                  FinishActions: Array<{
                    Name: string;
                    Params: {
                      EntityIds?: Array<number>;
                      FlowListName?: string;
                      FlowId?: number;
                      StateId?: number;
                    };
                    ActionGuid: string;
                    ActionId: number;
                  }>;
                }>;
                Slots?: Array<{
                  Condition: {
                    Type: number;
                    Conditions: Array<{
                      Type: string;
                      QuestId: number;
                      Compare: string;
                      State: number;
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
                      Condition: {
                        Type: string;
                        Check: {
                          Type: string;
                          SkillId: number;
                        };
                        PreConditions: {
                          Type: number;
                          Conditions: Array<{
                            Type: string;
                            Center: {
                              X: number;
                              Y: number;
                              Z: number;
                            };
                            Radius: number;
                          }>;
                        };
                      };
                      TidTip: string;
                      TrackTarget: {
                        TrackType: {
                          Type: string;
                          Locations: Array<{
                            X: number;
                            Y: number;
                            Z: number;
                            A: number;
                          }>;
                        };
                        Range: number;
                      };
                      EnterActions: Array<any>;
                      FinishActions: Array<{
                        Name: string;
                        Params: {
                          EntityIds?: Array<number>;
                          FlowListName?: string;
                          FlowId?: number;
                          StateId?: number;
                        };
                        ActionGuid: string;
                        ActionId: number;
                      }>;
                    }>;
                  };
                }>;
              };
            }>;
            Actions?: Array<{
              Name: string;
              Params: {
                Time?: number;
                FlowListName?: string;
                FlowId?: number;
                StateId?: number;
              };
              ActionGuid: string;
              ActionId: number;
            }>;
          };
        }>;
        Count?: number;
        DungeonId?: number;
        OccupationConfig?: {
          TidDesc: string;
          Occupations: Array<string>;
        };
        FailedCondition?: {
          IsTransferFailure?: boolean;
          IsTeamDeathFailure?: boolean;
          RangeLimiting?: {
            Point: {
              X: number;
              Y: number;
              Z: number;
            };
            Range: number;
            OverRangeCountdown?: number;
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
          CanGiveUp?: boolean;
          EntityStateCondition?: {
            Conditions: Array<{
              EntityId: number;
              State: string;
            }>;
          };
          Timer?: {
            Time: number;
            TimerType: string;
          };
          EntityAlert?: {
            EntityIds: Array<number>;
          };
          EntityDeathCondition?: {
            EntityIds: Array<number>;
          };
          CheckDungeonFailure?: Array<number>;
          EntityDistanceLimiting?: {
            EntityId: number;
            MaxDistance: number;
            OverMaxCountdown: number;
          };
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
          SneakPlayCondition?: {
            Time: number;
          };
          IsLeaveDungeonFailure?: boolean;
        };
        UIConfig?: {
          UiType: string;
          MainTitle: {
            TidTitle: string;
            QuestScheduleType: {
              Type: string;
              AssociatedChildQuestIds?: Array<number>;
              ChildQuestId?: number;
              ShowComplete?: boolean;
              ShowTracking?: boolean;
              Var?: {
                Type: string;
                Source: string;
                Name: string;
              };
            };
          };
          SubTitles: Array<{
            TidTitle: string;
            QuestScheduleType: {
              Type: string;
              ChildQuestId?: number;
              ShowComplete?: boolean;
              ShowTracking?: boolean;
              EntityId?: number;
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
            };
          }>;
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
        };
        TidQuestAliasName?: string;
        ShowNavigation?: boolean;
        DisableOnline?: boolean;
        RewardGetUiType?: number;
        WaitUntilTrue?: boolean;
        Actions?: Array<{
          Name: string;
          Params: {
            EntityIds?: Array<number>;
            CharacterId?: number;
            CharacterGroup?: Array<number>;
            AutoChange?: boolean;
            CreateTempTeam?: boolean;
            ActiveRange?: {
              CheckPoint: {
                X: number;
                Y: number;
                Z: number;
              };
              CheckEnterRange: number;
              CheckLeaveRange: number;
            };
            LoadDataLayers?: Array<number>;
            UnloadDataLayers?: Array<number>;
            Type?: string;
            GuideId?: number;
            FlowListName?: string;
            FlowId?: number;
            StateId?: number;
            EntityId?: number;
            State: any;
            Pos?: {
              X: number;
              Y: number;
              Z: number;
            };
            MoveTarget?: {
              Type: string;
              EntityId: number;
            };
            SplineEntityId?: number;
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
            EnterRadius?: number;
            LeaveRadius?: number;
            Flow?: {
              FlowListName: string;
              FlowId: number;
              StateId: number;
            };
            WaitTime?: number;
            TipOption?: {
              Type: number;
              TidMainText: string;
            };
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
            SystemType: any;
            BoardId?: number;
            Configs?: Array<{
              LevelPlayId: number;
              Enable: boolean;
            }>;
            Visible?: boolean;
            MarkId?: number;
            Enable?: boolean;
            RangeEntity?: number;
            Level?: string;
            Content?: string;
            Time?: number;
            Ease?: {
              Type: number;
              Duration: number;
            };
            ScreenType?: string;
            TelePortConfig?: {
              Type: number;
              TargetPos: {
                X: number;
                Y: number;
                Z: number;
                A?: number;
              };
            };
            Hour?: number;
            Min?: number;
            ShowUi?: boolean;
            ChapterState?: number;
            FadeInTime?: number;
            StayTime?: number;
            FadeOutTime?: number;
            LockCamera?: boolean;
            IsEnable?: boolean;
            GeneralTextId?: number;
            SetReviveType?: string;
            ReviveId?: number;
            BuffIds?: Array<number>;
            RegionMpcId?: number;
            Conditions?: Array<any>;
            TransitionOption?: {
              Type: string;
              Mp4Path: string;
            };
          };
          ActionGuid: string;
          ActionId: number;
          Async?: boolean;
        }>;
        TidQuestAliasDesc?: string;
        FixProcessor?: {
          FixActions: Array<{
            Timing: string;
            Condition: {
              Type: number;
              Conditions: Array<{
                Type: string;
                EntityIds?: Array<number>;
                IsExist?: boolean;
                Range?: {
                  Type: string;
                  Pos: {
                    X: number;
                    Y: number;
                    Z: number;
                  };
                  Radius: number;
                };
                IsOnRange?: boolean;
                DungeonId?: number;
              }>;
            };
            ThenActions: Array<{
              Name: string;
              Params: {
                Pos?: {
                  X: number;
                  Y: number;
                  Z: number;
                };
                EntityIds?: Array<number>;
              };
              ActionGuid: string;
              ActionId: number;
            }>;
          }>;
        };
        RewardGetUiConfig?: {
          Type: number;
          Title?: string;
          ShowDetail?: boolean;
        };
        CompositeTrackViewMode?: string;
        PerformanceSetting?: {
          Author: string;
          Note: string;
          EnableOptimize: boolean;
          RangeEntities: Array<number>;
          Mode: {
            Type: number;
          };
        };
        AutoFailed?: boolean;
      };
    };
  }>;
};

export type DBEntityOwnerData = {
  entityownerdata: Array<{
    Guid: string;
    data: {
      Guid: string;
      Owner: Array<{
        Type: string;
        EntityId?: number;
        LevelPlayId?: number;
        QuestId?: number;
      }>;
    };
  }>;
};

export type DBQuestData = {
  questdata: Array<{
    QuestId: number;
    data: {
      QuestId: number;
      Data: {
        Id: number;
        Type: number;
        RegionId: number;
        Key: string;
        TidName: string;
        TidDesc: string;
        RewardId?: number;
        DistributeType: string;
        ProvideType: {
          Conditions?: Array<{
            Type: string;
            ExploreLevel?: number;
            PreQuest?: number;
            Items?: Array<{
              ItemId: number;
              Count: number;
            }>;
            DateId?: number;
            PreLevelPlay?: number;
            PreChildQuest?: {
              QuestId: number;
              ChildQuestId: number;
            };
            Gender?: string;
          }>;
          Type?: number;
        };
        ActiveActions?: Array<{
          Name: string;
          Params: {
            EntityIds?: Array<number>;
            EnterRadius?: number;
            LeaveRadius?: number;
            Flow?: {
              FlowListName: string;
              FlowId: number;
              StateId: number;
            };
            MailId?: number;
            Visible?: boolean;
            FlowListName?: string;
            FlowId?: number;
            StateId?: number;
            Level?: string;
            Content?: string;
            RedDot?: boolean;
            WaitTime?: number;
            EntityId?: number;
          };
          ActionGuid: string;
          ActionId: number;
        }>;
        DungeonId: number;
        OnlineType: string;
        ObjType: string;
        Children?: Array<string>;
        Reference?: Array<string>;
        IsAutoTrack?: boolean;
        AcceptActions?: Array<{
          Name: string;
          Params: {
            EntityIds?: Array<number>;
            MailId?: number;
            Level?: string;
            Content?: string;
            Flow?: {
              FlowListName: string;
              FlowId: number;
            };
            EntityId?: number;
            Pos?: {
              X: number;
              Y: number;
              Z: number;
            };
            FadeInTime?: number;
            StayTime?: number;
            FadeOutTime?: number;
            LockCamera?: boolean;
            Ease?: {
              Type: number;
              Duration: number;
            };
            Type?: string;
            State?: string;
            Items?: Array<{
              ItemId: number;
              Count: number;
            }>;
          };
          ActionGuid: string;
          ActionId: number;
          Async?: boolean;
        }>;
        UnlockDelayTime?: {
          Day: number;
          Hour: number;
          Minute: number;
        };
        AddInteractOption?: {
          EntityId: number;
          Option: {
            TidContent?: string;
            Guid: string;
            Type: {
              Type: string;
              Flow: {
                FlowListName: string;
                FlowId: number;
                StateId: number;
              };
            };
            DoIntactType?: string;
            Range?: number;
            Icon?: string;
          };
          IsManualFinish?: boolean;
          IsManualDelete?: boolean;
        };
        FinishActions?: Array<{
          Name: string;
          Params: {
            GeneralTextId?: number;
            Level?: string;
            Content?: string;
            Type?: string;
            EntityId?: number;
            State?: string;
            Configs?: Array<{
              LevelPlayId: number;
              Enable: boolean;
            }>;
          };
          ActionId: number;
          ActionGuid: string;
        }>;
        DistributeParams?: {
          UseItem: {
            ItemId: number;
            Count: number;
          };
        };
        IsHideAcceptMarkOnNpc?: boolean;
        ChapterId?: number;
        RoleId?: string;
        PreShowInfo?: {
          PreShowCondition: {
            Conditions: Array<{
              Type: string;
              ExploreLevel?: number;
              PreQuest?: number;
              DateId?: number;
            }>;
            Type?: number;
          };
          TidPreShowDesc: string;
        };
        TerminateActions?: Array<{
          Name: string;
          Params: {
            Type: string;
            EntityId: number;
            State: string;
          };
          ActionGuid: string;
          ActionId: number;
        }>;
        FunctionId?: number;
      };
    };
  }>;
};

export type DBLevelPlayData = {
  levelplaydata: Array<{
    LevelPlayId: number;
    data: {
      LevelPlayId: number;
      Data: {
        Id: number;
        Key: string;
        InternalDest: string;
        LevelId: number;
        TidName: string;
        Type: string;
        InstanceId?: number;
        LevelPlayEntityId: number;
        LevelAdditiveId: number;
        EnterRadius: number;
        LeaveRadius: number;
        DelayRefresh: boolean;
        DelayDestroy: boolean;
        LevelPlayOpenCondition: {
          Conditions?: Array<{
            Type: string;
            PreChildQuest?: {
              QuestId: number;
              ChildQuestId: number;
            };
            PreQuest?: number;
            PreLevelPlay?: number;
            RangeEntityId?: number;
            ExploreLevel?: number;
          }>;
          Type?: number;
          DelayRefresh?: boolean;
        };
        LevelPlayActive: {
          ActiveType: number;
        };
        LevelPlayRewardConfig: {
          Type: string;
          RewardId?: number;
          RewardEntityId?: number;
          RewardCompleteActions?: Array<any>;
          FirstCompleteActions?: Array<{
            Name: string;
            Params: {
              TipOption?: {
                Type: number;
                TidText: string;
              };
              DynamicSettlementConfig?: {
                Type: string;
              };
            };
            ActionId: number;
            ActionGuid: string;
          }>;
          Reset?: {
            Type: string;
            Count: number;
          };
          FirstRewardId?: number;
          RewardConfig?: Array<{
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
            RewardId: number;
          }>;
        };
        LevelPlayRefreshConfig: {
          Type: string;
          UpdateType?: string;
          MinRefreshCd?: number;
          MaxRefreshCd?: number;
          ChildDestroyRefreshCd?: {
            MinRefreshCd: number;
            MaxRefreshCd: number;
          };
          AwardedRefreshCd?: {
            MinRefreshCd: number;
            MaxRefreshCd: number;
          };
          CompletedRefreshTime?: number;
          AwardedRefreshTime?: number;
        };
        LevelPlayTrack: {
          TrackRadius: number;
          TrackPriority: number;
        };
        LevelPlayMark?: {
          MarkId: number;
          MapBgPath: string;
        };
        EnterInRangeActions?: Array<{
          Name: string;
          Params: {
            TipOption: {
              Type: number;
              TidText: string;
            };
          };
          ActionId: number;
          ActionGuid: string;
        }>;
        PackId: number;
        OnlineType: string;
        ObjType: string;
        Children?: Array<string>;
        Reference?: Array<string>;
        ExploratoryDegree?: number;
        LevelPlayOpenActions?: Array<{
          Name: string;
          Params: {
            Type: string;
            EntityId: number;
            State: string;
          };
          ActionGuid: string;
          ActionId: number;
        }>;
      };
    };
  }>;
};
