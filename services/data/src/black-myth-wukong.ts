import uniqolor from "uniqolor";
import {
  CardDesc,
  CommDropRuleDesc,
  FUStGuideGroupDesc,
  FUStSummonCommDesc,
  FUStUnitBattleInfoExtendDesc,
  GMMapStaticData,
  ItemTreasureStart,
} from "./black-myth-wukong.types.js";
import { initDict, writeDict } from "./lib/dicts.js";
import {
  CONTENT_DIR,
  initDirs,
  OUTPUT_DIR,
  TEMP_DIR,
  TEXTURE_DIR,
} from "./lib/dirs.js";
import {
  initFilters,
  initGlobalFilters,
  writeFilters,
  writeGlobalFilters,
} from "./lib/filters.js";
import {
  encodeToFile,
  readDirRecursive,
  readDirSync,
  readJSON,
  saveImage,
} from "./lib/fs.js";
import { createBlankImage, IconProps, saveIcon } from "./lib/image.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";
import { Node, UEObjects } from "./types.js";

initDirs(
  "/mnt/c/dev/Black Myth Wukong/Extracted/Data",
  "/mnt/c/dev/Black Myth Wukong/Extracted/Texture",
  import.meta.dir + "/../../../static/black-myth-wukong",
);

const nodes = initNodes();
const filters = initFilters();
const typesIDs = initTypesIDs();
const enDict = initDict();
const tiles = initTiles();
const regions = initRegions();
const globalFilters = initGlobalFilters();

const en = await readJSON<Record<string, string>>(
  CONTENT_DIR + "/b1/Content/Localization/Game/en/Game.json",
);

const fustSummonCommonDesc = await readJSON<FUStSummonCommDesc>(
  CONTENT_DIR +
    "/b1/Content/00Main/PBTable/NoneRuntime/FUStSummonCommDesc.json",
);

const fustGuideGroupDesc = await readJSON<FUStGuideGroupDesc>(
  CONTENT_DIR +
    "/b1/Content/00Main/PBTable/NoneRuntime/FUStGuideGroupDesc.json",
);
const commDropRuleDesc = await readJSON<CommDropRuleDesc>(
  CONTENT_DIR + "/b1/Content/00Main/PBTable/Runtime/CommDropRuleDesc.json",
);

const cardDesc = await readJSON<CardDesc>(
  CONTENT_DIR + "/b1/Content/00Main/PBTable/Runtime/CardDesc.json",
);
const fUStUnitBattleInfoExtendDesc: FUStUnitBattleInfoExtendDesc = { "1": [] };
const fUStUnitBattleInfoExtendDescs = readDirSync(
  CONTENT_DIR + "/b1/Content/00Main/PBTable/NoneRuntime",
).filter(
  (f) => f.startsWith("FUStUnitBattleInfoExtendDesc") && f.endsWith(".json"),
);
for (const file of fUStUnitBattleInfoExtendDescs) {
  const part = await readJSON<FUStUnitBattleInfoExtendDesc>(
    CONTENT_DIR + "/b1/Content/00Main/PBTable/NoneRuntime/" + file,
  );
  if (part["1"]) {
    fUStUnitBattleInfoExtendDesc["1"].push(...part["1"]);
  }
}

const gmMapStaticData = await readJSON<GMMapStaticData>(
  CONTENT_DIR +
    "/b1/Content/00Main/PBTable/GMMapStaticData/GMMapStaticData.json",
);

const iconNames = readDirSync(
  TEXTURE_DIR + "/b1/Content/00MainHZ/UI/AlwaysCook/Icon/",
);

const typeIdsToResId = Object.fromEntries(
  Object.values(gmMapStaticData.MapData).flatMap((map) => {
    return Object.values(map).map((v) => {
      const [, , ...more] = v.Guid.split("-").at(-1)!.split("_");
      if (more.length === 0) {
        return [];
      }
      const last = more.join("_");
      let typeId;
      if (last.includes("_C")) {
        typeId = last.split("_C")[0];
      } else {
        typeId = last.replace(/_[^_]*$/, "");
      }
      return [typeId.toLowerCase(), v.ResId];
    });
  }),
);
const typeIdsToExtendId = Object.fromEntries(
  Object.values(gmMapStaticData.MapData).flatMap((map) => {
    return Object.values(map).map((v) => {
      const [, , ...more] = v.Guid.split("-").at(-1)!.split("_");
      if (more.length === 0) {
        return [];
      }
      const last = more.join("_");
      let typeId;
      if (last.includes("_C")) {
        typeId = last.split("_C")[0];
      } else {
        typeId = last.replace(/_[^_]*$/, "");
      }
      return [typeId.toLowerCase(), v.ExtendId];
    });
  }),
);
const PORTRAITS: Record<string, { name: string; size: number }> = {
  "1": { name: "lesser_yaoguais", size: 1 },
  "2": { name: "yaoguai_chiefs", size: 1.4 },
  "3": { name: "yaoguai_kings", size: 1.5 },
  "4": { name: "characters", size: 1 },
};
enDict["lesser_yaoguais"] = "Lesser Yaoguais";
enDict["yaoguai_chiefs"] = "Yaoguai Chiefs";
enDict["yaoguai_kings"] = "Yaoguai Kings";
enDict["characters"] = "Characters";

// Unit_LYS_YaXiangKe_1a  = Crow Diviner
for (const folder of readDirSync(
  CONTENT_DIR + "/b1/Content/00Main/Design/Units/",
)) {
  if (folder.endsWith(".json") || folder === "Player") {
    continue;
  }
  for (const file of readDirSync(
    CONTENT_DIR + `/b1/Content/00Main/Design/Units/${folder}/`,
  )) {
    if (
      !file.startsWith("Unit") ||
      file.includes("emptyunit") ||
      file.includes("test")
    ) {
      continue;
    }
    // const unit = await readJSON<UEObjects>(CONTENT_DIR + `/b1/Content/00Main/Design/Units/${folder}/` + file);
    const typeId = (file.replace(".json", "") + "_C").toLowerCase();
    const [, , ...more] = typeId.split("_");
    let type = more.join("_");
    if (type.includes("_c")) {
      type = type.split("_c")[0];
    } else {
      type = type.replace(/_[^_]*$/, "");
    }
    if (typesIDs[typeId]) {
      throw new Error(`Type already exists: ${typeId}`);
    }
    typesIDs[typeId] = type;

    let iconPath;
    const iconProps: IconProps = {};
    let group = "enemies";
    const typeAlt = type.replace(/_[^_]*$/, "");
    const resId = typeIdsToResId[type] || typeIdsToResId[typeAlt];
    const extendId = typeIdsToExtendId[type] || typeIdsToExtendId[typeAlt];
    let size = 1;
    if (!resId || !extendId) {
      console.warn(`resId not found for ${type} | ${typeAlt} | ${file}`);
    } else {
      const guideGroupDesc = fustGuideGroupDesc["1"].find(
        (f) => f["1"] === resId,
      );
      const fUStUnitBattleInfo = fUStUnitBattleInfoExtendDesc["1"].find(
        (f) => f["1"] === extendId,
      );

      if (
        fUStUnitBattleInfo &&
        en[`StringKVMapDesc.UnitBattleInfoExtendDesc.${extendId}.UnitName`]
      ) {
        const card = cardDesc["1"].find(
          (c) => c["2"] === fUStUnitBattleInfo["2"],
        );
        if (card) {
          const portraitId = card["4"]!;
          const portrait = PORTRAITS[portraitId];
          group = portrait?.name || "enemies";
          size = portrait?.size || 1;
        }
        enDict[type] =
          en[`StringKVMapDesc.UnitBattleInfoExtendDesc.${extendId}.UnitName`];
      } else if (!guideGroupDesc) {
        console.warn(`guideGroupDesc not found for ${type} | ${typeAlt}`);
      } else {
        const cardGroup = guideGroupDesc["3"]!;
        const card = cardDesc["1"].find((c) => c["10"]?.includes(cardGroup));
        if (!card) {
          console.warn(
            `card not found for ${type} | ${typeAlt} | ${resId} ${cardGroup}`,
          );
        } else {
          const cardId = card["1"];
          const portraitId = card["4"]!;
          const portrait = PORTRAITS[portraitId];
          group = portrait?.name || "enemies";
          size = portrait?.size || 1;

          enDict[type] = en[`StringKVMapDesc.CardDesc.${cardId}.UnitName`];
          enDict[`${type}_desc`] =
            en[`StringKVMapDesc.CardDesc.${cardId}.UnitPoetry`];
        }
      }

      const commDropRule = commDropRuleDesc["1"].find((c) => c["1"] === resId);
      if (commDropRule) {
        if ("13" in commDropRule) {
          const itemIds = commDropRule["13"];
          if (itemIds) {
            enDict[`${type}_desc`] = `<b>Drops:<b><br>`;
            if (Array.isArray(itemIds)) {
              for (const itemId of itemIds) {
                if (en[`StringKVMapDesc.ItemDesc.${itemId}.Name`]) {
                  enDict[`${type}_desc`] +=
                    en[`StringKVMapDesc.ItemDesc.${itemId}.Name`] + "<br>";
                }
              }
            } else {
              const itemId = itemIds["1"];
              if (en[`StringKVMapDesc.ItemDesc.${itemId}.Name`]) {
                enDict[`${type}_desc`] +=
                  en[`StringKVMapDesc.ItemDesc.${itemId}.Name`];
              }
            }
          }
        }
      }
    }
    if (!enDict[type]) {
      enDict[type] = type;
    }

    let category = filters.find((f) => f.group === group);
    if (!category) {
      filters.push({
        group: group,
        defaultOpen: true,
        defaultOn: true,
        values: [],
      });
      category = filters.find((f) => f.group === group)!;
    }
    if (!category.values.some((v) => v.id === type)) {
      if (iconPath) {
        //
      } else if (enDict[type].startsWith("Crow ")) {
        iconPath =
          "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/raven_lorc.webp";
        iconProps.color = uniqolor(type, {
          lightness: [70, 80],
        }).color;
      } else if (enDict[type].startsWith("Wolf ")) {
        iconPath =
          "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/wolf-head_lorc.webp";
        iconProps.color = uniqolor(type, {
          lightness: [70, 80],
        }).color;
      } else if (enDict[type].startsWith("Croaky")) {
        iconPath =
          "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/frog_lorc.webp";
        iconProps.color = uniqolor(type, {
          lightness: [70, 80],
        }).color;
      } else if (enDict[type].startsWith("Bullguard")) {
        iconPath =
          "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/bully-minion_delapouite.webp";
        iconProps.color = uniqolor(type, {
          lightness: [70, 80],
        }).color;
      } else {
        iconPath =
          "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/targeted_sbed.webp";
        iconProps.color = uniqolor(type, {
          lightness: [70, 80],
        }).color;
      }
      const iconName = await saveIcon(iconPath, type, iconProps);
      category.values.push({
        id: type,
        icon: iconName,
        size,
      });
    }
  }
}

// const mapNames = ["HFS01", "HFM02"];
const mapNames = ["HFS01"];
enDict["HFS01"] = "Chapter 1";
enDict["HFM02"] = "Chapter 2";
const mapFolders = readDirSync(CONTENT_DIR + "/b1/Content/00Main/Maps");
for (const mapName of mapFolders) {
  if (!mapNames.includes(mapName)) {
    continue;
  }
  console.log(`Map: ${mapName}`);
  const mapImage = TEMP_DIR + "/" + mapName + ".png";
  // const persistentLevel = await readJSON<UEObjects>(
  //   `${CONTENT_DIR}/b1/Content/00Main/Maps/${mapName}/${mapName}_PersistentLevel.json`,
  // );
  // const levelBounds = persistentLevel.find((o) => o.Outer === "LevelBounds_0");
  // if (!levelBounds?.Properties) {
  //   throw new Error("LevelBounds_0 not found");
  // }
  // const width = Math.max(
  //   levelBounds.Properties.RelativeScale3D.X,
  //   levelBounds.Properties.RelativeScale3D.Y,
  // );
  // const additionalOffset = [
  //   levelBounds.Properties.RelativeLocation.X,
  //   levelBounds.Properties.RelativeLocation.Y,
  // ];

  const waterPoints: [number, number][] = [];
  const files = readDirRecursive(
    `${CONTENT_DIR}/b1/Content/00Main/Maps/${mapName}/`,
  );
  let i = 1;
  for (const file of files) {
    // console.log(
    //   `File: ${i++}/${files.length}: ${file.replace(`${CONTENT_DIR}/b1/Content/00Main/Maps/${mapName}/`, "")}`,
    // );

    if (!file.endsWith(".json") || file.includes("Audio")) {
      continue;
    }
    const items = await readJSON<ItemTreasureStart>(file);

    for (const item of items) {
      if (
        !item.Properties ||
        !item.Outer ||
        // (item.Type !== "SceneComponent" && !item.Outer.startsWith("TAMER")) ||
        !("RelativeLocation" in item.Properties) ||
        !item.Properties.RelativeLocation
        // ||
        // item.Outer.includes("CineCamera") ||
        // item.Outer.includes("StaticMeshActor") ||
        // item.Outer.includes("Volume") ||
        // item.Outer.includes("BGW") ||
        // item.Outer.startsWith("Cube") ||
        // item.Outer.startsWith("DecalActor") ||
        // item.Outer.startsWith("PreviewActor") ||
        // item.Outer.startsWith("NiagaraActor") ||
        // item.Outer.startsWith("SM_") ||
        // item.Outer.startsWith("ST_") ||
        // item.Outer.startsWith("SceneItem") ||
        // item.Outer.startsWith("Landscape")
      ) {
        continue;
      }
      let group;
      let type;
      let iconName;
      let size = 2;
      let typeId = (item.Outer.split("_C")[0] + "_C").toLowerCase();
      if (item.Outer.startsWith("BP_yaocai_lingzhi_C")) {
        group = "materials";
        enDict[group] = "Materials";
        type = "purple_lingzhi";
        enDict[type] = en["StringKVMapDesc.ItemDesc.3204.Name"];
        iconName = await saveIcon(
          "/b1/Content/00MainHZ/UI/AlwaysCook/Icon/Item_Icon_3204_t.png",
          type,
          {
            // color: "#ffffff",
            threshold: 0,
          },
        );
      } else if (item.Outer.startsWith("BP_yaocai_renshen_C")) {
        group = "materials";
        enDict[group] = "Materials";
        type = "aged_ginseng";
        enDict[type] = en["StringKVMapDesc.ItemDesc.3202.Name"];
        iconName = await saveIcon(
          "/b1/Content/00MainHZ/UI/AlwaysCook/Icon/Item_Icon_3202_t.png",
          type,
          {
            // color: "#ffffff",
            threshold: 0,
          },
        );
      } else if (item.Outer.startsWith("BP_yaocai_longdancao_C")) {
        group = "materials";
        enDict[group] = "Materials";
        type = "gentian";
        enDict[type] = en["StringKVMapDesc.ItemDesc.3206.Name"];
        iconName = await saveIcon(
          "/b1/Content/00MainHZ/UI/AlwaysCook/Icon/Item_Icon_3206_t.png",
          type,
          {
            // color: "#ffffff",
            threshold: 0,
          },
        );
      } else if (item.Outer.startsWith("BP_yaocai_biou_")) {
        group = "materials";
        enDict[group] = "Materials";
        type = "jade_lotus";
        enDict[type] = en["StringKVMapDesc.ItemDesc.3216.Name"];
        iconName = await saveIcon(
          "/b1/Content/00MainHZ/UI/AlwaysCook/Icon/Item_Icon_3216_t.png",
          type,
          {
            // color: "#ffffff",
            threshold: 0,
          },
        );
        size = 1.5;
      } else if (item.Outer.startsWith("BP_GhostFireSpawner_")) {
        group = "items";
        enDict[group] = "Items";
        type = "will";
        enDict[type] = en["StringKVMapDesc.ItemDesc.1002.Name"];
        iconName = await saveIcon(
          "/b1/Content/00MainHZ/UI/AlwaysCook/Icon/Item_Icon_1002_g.png",
          type,
          {
            // color: "#ffffff",
            threshold: 0,
          },
        );
        size = 1.5;
      } else if (item.Outer.startsWith("RebirthPoint")) {
        group = "locations";
        enDict[group] = "Locations";
        type = "rebirth_point";
        enDict[type] = "Keeper's Shrine";
        iconName = await saveIcon(
          "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/shinto-shrine_delapouite.webp",
          type,
          {
            color: uniqolor(type, {
              lightness: [70, 80],
            }).color,
          },
        );
        size = 1;
      } else if (item.Outer.startsWith("TAMER_")) {
        group = "enemies";
        enDict[group] = "Enemies";
        typeId = typeId.replace("tamer_", "unit_").replace("_huoba", "");
        type = typesIDs[typeId];
        if (!type) {
          const [, , searchId] = typeId.split("_");
          type = Object.entries(typesIDs).find(([k, v]) => {
            return k.includes(searchId);
          })?.[1];
        }
        if (!type) {
          console.warn(`Type not found for ${typeId}`);
          continue;
        }
      } else if (item.Outer.startsWith("BPO_TreasureBox_")) {
        group = "items";
        enDict[group] = "Items";
        type = "treasure_box";
        enDict[type] = "Treasure Box";
        iconName = await saveIcon(
          "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/chest_delapouite.webp",
          type,
          {
            color: uniqolor(type, {
              lightness: [70, 80],
            }).color,
          },
        );
        size = 1;
      } else if (item.Outer.startsWith("BP_InteractiveWater_")) {
        waterPoints.push([
          item.Properties.RelativeLocation.X,
          item.Properties.RelativeLocation.Y,
        ]);
        continue;
      } else {
        continue;
        // group = "unsorted";
        // enDict[group] = "Unsorted";
        // type = item.Outer.split("_C")[0].replace("BP_", "");
        // type = type.replaceAll(/\d+/g, "");
        // enDict[type] = type;
        // iconName = await saveIcon(
        //   "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/plain-circle_delapouite.webp",
        //   "unknown",
        //   // {
        //   //   color: uniqolor(type, {
        //   //     lightness: [70, 80],
        //   //   }).color,
        //   // },
        // );
        // size = 0.8;
      }
      typesIDs[typeId] = type;
      let category = filters.find((f) => f.group === group);

      if (!category) {
        filters.push({
          group: group,
          defaultOpen: true,
          defaultOn: true,
          values: [],
        });
        category = filters.find((f) => f.group === group)!;
      }
      if (!category.values.some((v) => v.id === type) && iconName) {
        category.values.push({
          id: type,
          icon: iconName,
          size,
        });
      }

      let oldNodes = nodes.find(
        (n) => n.type === type && n.mapName === mapName,
      );
      if (!oldNodes) {
        nodes.push({ type: type, mapName, spawns: [] });
        oldNodes = nodes.find((n) => n.type === type && n.mapName === mapName)!;
      }

      const spawn: Node["spawns"][number] = {
        p: [
          item.Properties.RelativeLocation.X,
          item.Properties.RelativeLocation.Y,
        ],
      };
      oldNodes.spawns.push(spawn);
    }
  }

  const minX = Math.min(
    ...nodes
      .filter((n) => n.mapName === mapName)
      .flatMap((n) => n.spawns.map((s) => s.p[0])),
  );
  const minY = Math.min(
    ...nodes
      .filter((n) => n.mapName === mapName)
      .flatMap((n) => n.spawns.map((s) => s.p[1])),
  );
  const maxX = Math.max(
    ...nodes
      .filter((n) => n.mapName === mapName)
      .flatMap((n) => n.spawns.map((s) => s.p[0])),
  );
  const maxY = Math.max(
    ...nodes
      .filter((n) => n.mapName === mapName)
      .flatMap((n) => n.spawns.map((s) => s.p[1])),
  );

  const width = Math.max(maxX - minX, maxY - minY);
  const padding = width * 0.05;
  const fitBounds = [
    [minX - padding, minY - padding],
    [maxX + padding, maxY + padding],
  ] as [[number, number], [number, number]];

  let canvas = createBlankImage(1024, 1024);
  saveImage(mapImage, canvas.toBuffer("image/png"));

  const tile = await generateTiles(
    mapName,
    mapImage,
    width,
    512,
    [0, 0],
    fitBounds,
    undefined,
    undefined,
    [1, -1],
  );

  tiles[mapName] = tile[mapName];
}

// BP_yaocai_renshen_C === Aged Ginseng

const filteredNodes = nodes.map((n) => ({
  ...n,
  static: !Object.values(typesIDs).includes(n.type),
}));

writeNodes(filteredNodes);
Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    filteredNodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});

const sortPriority = [
  "locations",
  "items",
  "materials",
  "lesser_yaoguais",
  "yaoguai_chiefs",
  "yaoguai_kings",
  "characters",
  "enemies",
];
const sortedFilters = filters
  // .map((f) => {
  //   return {
  //     ...f,
  //     values: f.values.filter((v) => nodes.some((n) => n.type === v.id)),
  //   };
  // })
  .sort((a, b) => {
    if (a.group === b.group) {
      return 0;
    }
    let priorityA = sortPriority.findIndex((p) =>
      a.group.toLowerCase().startsWith(p.toLowerCase()),
    );
    if (priorityA === -1) {
      priorityA = 1000;
    }
    let priorityB = sortPriority.findIndex((p) =>
      b.group.toLowerCase().startsWith(p.toLowerCase()),
    );
    if (priorityB === -1) {
      priorityB = 1000;
    }
    if (priorityA === priorityB) {
      return a.group.localeCompare(b.group);
    }
    return priorityA - priorityB;
  });
writeFilters(sortedFilters);
writeTypesIDs(typesIDs);
writeDict(enDict, "en");
writeTiles(tiles);
writeRegions(regions);
writeGlobalFilters(globalFilters);

console.log("Done");
