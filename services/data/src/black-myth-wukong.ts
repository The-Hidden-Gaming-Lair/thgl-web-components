import uniqolor from "uniqolor";
import { ItemTreasureStart } from "./black-myth-wukong.types.js";
import { initDict, writeDict } from "./lib/dicts.js";
import { CONTENT_DIR, initDirs, TEMP_DIR } from "./lib/dirs.js";
import {
  initFilters,
  initGlobalFilters,
  writeFilters,
  writeGlobalFilters,
} from "./lib/filters.js";
import { readDirRecursive, readDirSync, readJSON } from "./lib/fs.js";
import { createBlankImage, saveIcon } from "./lib/image.js";
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

const mapNames = ["HFS01"];
enDict["HFS01"] = "Chapter 1";
const mapFolders = readDirSync(CONTENT_DIR + "/b1/Content/00Main/Maps");
for (const mapName of mapFolders) {
  if (!mapNames.includes(mapName)) {
    continue;
  }
  console.log(`Map: ${mapName}`);
  const mapImage = TEMP_DIR + "/" + mapName + ".png";
  const persistentLevel = await readJSON<UEObjects>(
    `${CONTENT_DIR}/b1/Content/00Main/Maps/${mapName}/${mapName}_PersistentLevel.json`,
  );
  const levelBounds = persistentLevel.find((o) => o.Outer === "LevelBounds_0");
  if (!levelBounds?.Properties) {
    throw new Error("LevelBounds_0 not found");
  }
  const width = Math.max(
    levelBounds.Properties.RelativeScale3D.X,
    levelBounds.Properties.RelativeScale3D.X,
    levelBounds.Properties.RelativeScale3D.Y,
  );
  const additionalOffset = [
    levelBounds.Properties.RelativeLocation.X,
    levelBounds.Properties.RelativeLocation.Y,
  ];

  createBlankImage(mapImage, 1024, 1024);

  const tile = await generateTiles(
    mapName,
    mapImage,
    width,
    512,
    additionalOffset,
    undefined,
    undefined,
    undefined,
    [1, -1],
  );
  tiles[mapName] = tile[mapName];

  const files = readDirRecursive(
    `${CONTENT_DIR}/b1/Content/00Main/Maps/${mapName}/`,
  );
  let i = 1;
  for (const file of files) {
    console.log(
      `File: ${i++}/${files.length}: ${file.replace(`${CONTENT_DIR}/b1/Content/00Main/Maps/${mapName}/`, "")}`,
    );

    if (!file.endsWith(".json") || file.includes("Audio")) {
      continue;
    }
    const items = await readJSON<ItemTreasureStart>(file);

    for (const item of items) {
      if (
        !item.Properties ||
        !item.Outer ||
        (item.Type !== "SceneComponent" && !item.Outer.startsWith("TAMER")) ||
        !("RelativeLocation" in item.Properties) ||
        !item.Properties.RelativeLocation ||
        item.Outer.includes("CineCamera") ||
        item.Outer.includes("StaticMeshActor") ||
        item.Outer.includes("Volume") ||
        item.Outer.includes("BGW") ||
        item.Outer.startsWith("Cube") ||
        item.Outer.startsWith("DecalActor") ||
        item.Outer.startsWith("PreviewActor") ||
        item.Outer.startsWith("NiagaraActor") ||
        item.Outer.startsWith("SM_") ||
        item.Outer.startsWith("ST_") ||
        item.Outer.startsWith("SceneItem") ||
        item.Outer.startsWith("Landscape")
      ) {
        continue;
      }
      let group;
      let type;
      let iconName;
      let size = 2;
      if (item.Outer.startsWith("BP_yaocai_renshen_C")) {
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
      } else if (item.Outer.startsWith("RebirthPoint")) {
        group = "locations";
        enDict[group] = "Locations";
        type = "rebirth_point";
        enDict[type] = "Rebirth Point";
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
      } else if (item.Outer.startsWith("TAMER_gycy_lang_05_C")) {
        group = "enemies";
        enDict[group] = "Enemies";
        type = "wolf_swornsword";
        enDict[type] = en["StringKVMapDesc.CardDesc.101010.UnitName"];
        enDict[`${type}_desc`] =
          en["StringKVMapDesc.CardDesc.101010.UnitPoetry"];
        iconName = await saveIcon(
          "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/wolf-head_lorc.webp",
          type,
          {
            color: uniqolor(type, {
              lightness: [70, 80],
            }).color,
          },
        );
        size = 1;
      } else if (item.Outer.startsWith("TAMER_gycy_lang_03_C")) {
        group = "enemies";
        enDict[group] = "Enemies";
        type = "wolf_scout";
        enDict[type] = en["StringKVMapDesc.CardDesc.101004.UnitName"];
        enDict[`${type}_desc`] =
          en["StringKVMapDesc.CardDesc.101004.UnitPoetry"];
        iconName = await saveIcon(
          "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/wolf-head_lorc.webp",
          type,
          {
            color: uniqolor(type, {
              lightness: [70, 80],
            }).color,
          },
        );
        size = 1;
      } else if (item.Outer.startsWith("TAMER_gycy_lang_06_C")) {
        group = "enemies";
        enDict[group] = "Enemies";
        type = "wolf_stalwart";
        enDict[type] = en["StringKVMapDesc.CardDesc.101006.UnitName"];
        enDict[`${type}_desc`] =
          en["StringKVMapDesc.CardDesc.101006.UnitPoetry"];
        iconName = await saveIcon(
          "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/wolf-head_lorc.webp",
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
        type = item.Outer.split("_C")[0]
          .replace("BP_", "")
          .replace("TAMER_", "");
        enDict[type] = type;
        enDict[`${type}_desc`] =
          "Please join my Discord server to help mapping the name of this enemy!";
        iconName = await saveIcon(
          "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/targeted_sbed.webp",
          type,
          {
            color: uniqolor(type, {
              lightness: [70, 80],
            }).color,
          },
        );
        size = 1;
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
      } else {
        continue;
        // group = "unsorted";
        // enDict[group] = "Unsorted";
        // type = item.Outer.split("_C")[0].replace("BP_", "");
        // enDict[type] = type;
        // iconName = await saveIcon(
        //   "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/plain-circle_delapouite.webp",
        //   type,
        //   {
        //     color: uniqolor(type, {
        //       lightness: [70, 80],
        //     }).color,
        //   },
        // );
        // size = 0.8;
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

      const typeId = item.Outer.split("_C")[0] + "_C";
      if (typeId.startsWith("TAMER_")) {
        typesIDs[typeId.replace("TAMER_", "UNIT_")] = type;
      } else {
        typesIDs[typeId] = type;
      }
    }
  }
}

// BP_yaocai_renshen_C === Aged Ginseng

writeNodes(nodes);
writeFilters(filters);
writeTypesIDs(typesIDs);
writeDict(enDict, "en");
writeTiles(tiles);
writeRegions(regions);
writeGlobalFilters(globalFilters);

console.log("Done");
