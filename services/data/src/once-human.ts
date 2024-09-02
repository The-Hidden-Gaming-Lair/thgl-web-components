import uniqolor from "uniqolor";
import { initDict, writeDict } from "./lib/dicts.js";
import {
  CONTENT_DIR,
  initDirs,
  OUTPUT_DIR,
  TEMP_DIR,
  TEXTURE_DIR,
} from "./lib/dirs.js";
import { initFilters, writeFilters } from "./lib/filters.js";
import { encodeToFile, readDirSync, readJSON, saveImage } from "./lib/fs.js";
import { IconProps, mergeImages, saveIcon } from "./lib/image.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import {
  AchieveCollectData,
  BaseNPCData,
  BattleFieldData,
  BigMapItemData,
  BigWorldCollectableNotesData,
  InteractResData,
  PrefabGroupInfoData,
  PrefabInfoData,
  ScenePrefabData,
  SmallMapItemData,
  TreasureMonsterDropData,
} from "./once-human.types.js";
import { Node } from "./types.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";
import { getRegionsFromImage } from "./lib/regions.js";
import { initDatabase, writeDatabase } from "./lib/database.js";

initDirs(
  Bun.env.ONCE_HUMAN_CONTENT_DIR ?? "/mnt/c/dev/OnceHuman/Extracted/Data",
  Bun.env.ONCE_HUMAN_TEXTURE_DIR ?? "/mnt/c/dev/OnceHuman/Extracted/Texture",
  Bun.env.ONCE_HUMAN_OUTPUT_DIR ??
    "/home/devleon/the-hidden-gaming-lair/static/once-human",
);

let nodes = initNodes();
const filters = initFilters([
  { group: "items", defaultOn: true, defaultOpen: true, values: [] },
  { group: "recipes", defaultOn: true, defaultOpen: true, values: [] },
  { group: "gatherables", defaultOn: true, defaultOpen: true, values: [] },
]);
const enDict = initDict({
  locations: "Locations",
  boss: "Bosses",
  monster: "Monsters",
  animal: "Animals",
  riddles: "Riddles",
  items: "Items",
  recipes: "Recipes",
  gatherables: "Gatherables",
});
const typeIDs = initTypesIDs();

const mapName = "default";
if (Bun.env.TILES === "true") {
  const mapTiles = await readDirSync(
    TEXTURE_DIR + "/ui/texpack/bigmap_res/map/1024/",
  ).map((f) => TEXTURE_DIR + `/ui/texpack/bigmap_res/map/1024/${f}`);
  const canvas = await mergeImages(mapTiles, /(-?\d+)_(-?\d+)/);
  const imagePath = TEMP_DIR + "/" + mapName + ".png";
  saveImage(imagePath, canvas.toBuffer("image/png"));
}

const TILE_SIZE = 512;
const ORTHOGRAPHIC_WIDTH = 8200 * 2;

const tiles = initTiles(
  await generateTiles(
    mapName,
    TEMP_DIR + "/" + mapName + ".png",
    ORTHOGRAPHIC_WIDTH,
    TILE_SIZE,
    [0, 0],
    [
      [2500, -1200],
      [-8200, 8200],
    ],
    [
      [0, 0],
      [0, 0],
    ],
    [0.03121951219512195, 256, -0.03121951219512195, 256],
  ),
);

writeTiles(tiles);

await saveIcon(
  "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_oneself_v4.png",
  "player",
);
const regions = await getRegionsFromImage(
  TEXTURE_DIR + "/ui/uncompress_tex/monster_level_area_mask.png",
  (v) => {
    if (v === 8 || v === 7) {
      // Chalk Peak
      return 8;
    }
    if (v === 4 || v === 3) {
      // Broken Delta
      return 4;
    }
    if (v === 2 || v === 6) {
      // Dayton Wetlands
      return 2;
    }
    return 0;
  },
);
if (regions) {
  console.log(regions);
  //process.exit(1);
}

const scenePrefabData = await readJSON<ScenePrefabData>(
  CONTENT_DIR + "/game_common/data/scene_prefab/scene_prefab_data.json",
);
const prefabInfoData = await readJSON<PrefabInfoData>(
  CONTENT_DIR + "/game_common/data/prefab_info_data.json",
);
const textureMap = await readJSON<Record<string, string>>(
  CONTENT_DIR + "/client_data/ui/texture_map.json",
);
const bigMapItemData = await readJSON<BigMapItemData>(
  CONTENT_DIR + "/client_data/big_map_item_data.json",
);
const smallMapItemData = await readJSON<SmallMapItemData>(
  CONTENT_DIR + "/client_data/small_map_item_data.json",
);
const prefabGroupInfoData = await readJSON<PrefabGroupInfoData>(
  CONTENT_DIR + "/game_common/data/prefab_group_info_data.json",
);
const treasureMonsterDropData = await readJSON<TreasureMonsterDropData>(
  CONTENT_DIR + "/game_common/data/treasure_monster_drop_data.json",
);
const baseNPCData = await readJSON<BaseNPCData>(
  CONTENT_DIR + "/game_common/data/unit_data/base_npc_data.json",
);
const interactResData = await readJSON<InteractResData>(
  CONTENT_DIR + "/game_common/data/interact_res_data.json",
);
const newTypes: string[] = [];

const switchType = (
  initialGroup: string,
  initialType: string,
  initialTitle: string,
  initialIconPath: string,
  more?: string,
) => {
  let type = initialType;
  let title = initialTitle;
  let iconPath = initialIconPath;
  let group = initialGroup;
  let size = 1;
  const iconProps: IconProps = {};

  if (type === "juluo") {
    group = "locations";
    title = "Hamlet";
  } else if (type === "chengzhen") {
    group = "locations";
    title = "Settlement";
  } else if (type === "yingdi") {
    group = "locations";
    title = "Attack";
  } else if (type === "icon_stronghold_borderlands_nml") {
    group = "locations";
    title = "Frontier";
  } else if (type === "juxie") {
    group = "locations";
    title = "Monolith";
  } else if (type === "yanjiusuo") {
    group = "locations";
    title = "Research Institute";
  } else if (type === "gongchang") {
    group = "locations";
    title = "Factory";
  } else if (type === "zhongzhiyuan") {
    group = "locations";
    title = "Real Estate";
  } else if (type === "jiaotongshuniu") {
    group = "locations";
    title = "Railway";
  } else if (type === "junshijidi") {
    group = "locations";
    title = "Military Base";
  } else if (type === "guanniaoyingdi") {
    group = "locations";
    title = "Camp";
  } else if (type === "gouwuzhongxin") {
    group = "locations";
    title = "Town";
  } else if (type === "cistern") {
    group = "locations";
  } else if (type === "transport") {
    group = "locations";
  } else if (type === "school") {
    group = "locations";
    title = "School";
  } else if (type === "hud_icon_resourse_null") {
    group = "locations";
  } else if (type === "securementsilos") {
    group = "locations";
  } else if (type === "raidlea") {
    group = "locations";
  } else if (type === "hospital") {
    group = "locations";
  } else if (type === "zhongliyingdi_kechuansong") {
    group = "locations";
    title = "Union Stronghold";
  } else if (type === "initial_respawn") {
    group = "locations";
  } else if (more?.includes("Riddle Spot")) {
    group = "riddles";
    iconPath = `${Bun.env.GLOBAL_ICONS_DIR || "/home/devleon/the-hidden-gaming-lair/static/global/icons"}/game-icons/jigsaw-piece_lorc.webp`;
    type =
      more!
        .split("Riddle Spot ")[1]
        ?.replace(" Anti-Construction", "")
        .replace(" anti-construction", "")
        .replace(" Construction", "")
        .replace(" Anti-Building", "")
        .replace(" Prevention", "")
        .replace("anti-construction", "Anti-Construction") ||
      type.replace(" Riddle Spot", "");
    iconProps.color = uniqolor(type).color;

    // typeIDs[typeId] = "deviation_point_box.gim"
  } else if (more?.includes("_Scattered")) {
    group = "locations";
    type = "Scattered";
    title = type;
    iconPath = `${Bun.env.GLOBAL_ICONS_DIR || "/home/devleon/the-hidden-gaming-lair/static/global/icons"}/game-icons/damaged-house_quoting.webp`;
    iconProps.glowing = true;
    iconProps.color = "black";
    size = 0.65;
  } else if (more?.includes("Bus ") || more?.includes("_Bus_")) {
    type = "bus_monster";
    iconPath = iconPath =
      "/ui/dynamic_texpack/all_icon_res/map_icon/small_map_icon/map_icon_littlemonster.png";
    title = "Bus Monster";
    group = "monster";
    iconProps.color = "#ea93b2";
    iconProps.circle = true;
  } else if (more?.includes("House_Monster")) {
    type = "house_monster";
    iconPath = iconPath =
      "/ui/dynamic_texpack/all_icon_res/map_icon/small_map_icon/map_icon_littlemonster.png";
    title = "Bus Monster";
    group = "monster";
    iconProps.color = "#ea93b2";
    iconProps.circle = true;
  }
  if (!title) {
    title = type;
  }

  // Remove special characters
  type = type
    .replaceAll(" ", "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();

  return {
    type,
    title,
    group,
    iconProps,
    iconPath,
    size,
  };
};

for (const [key, value] of Object.entries(prefabInfoData)) {
  let initialIconPath = "";
  const prefabGroupInfo = Object.values(prefabGroupInfoData).find(
    (d) => d.prefab_group_show_name === value.stronghold_name,
  );

  let initialType;
  let initialTitle = "";
  const mapIconId = (
    value.bigmap_icon_id ||
    prefabGroupInfo?.prefab_group_bigmap_icon_id ||
    0
  ).toString();
  const mapItem = bigMapItemData[mapIconId] || smallMapItemData[mapIconId];

  if (!mapItem) {
    console.warn("No map item for", key);
    continue;
  }
  initialIconPath =
    "ui/dynamic_texpack/" +
    textureMap[mapItem.res_path] +
    "/" +
    mapItem.res_path;
  initialType =
    mapItem.res_path.replace("map_icon_", "").replace(".png", "") ||
    value.stronghold_name;
  initialTitle = prefabGroupInfo?.prefab_group_show_name || mapItem.item_name;

  let { type, title, group, iconProps, iconPath, size } = switchType(
    "unsorted",
    value.note?.includes("Riddle Spot") ? value.stronghold_name : initialType,
    initialTitle,
    initialIconPath,
    value.note,
  );

  if (group === "unsorted") {
    continue; // Temporary
  }

  if (enDict[type] && enDict[type] !== title) {
    console.warn(`Type ${type} already exists with name ${enDict[type]}`);
  } else {
    enDict[type] = title;
  }

  if (!iconPath) {
    iconPath = `${Bun.env.GLOBAL_ICONS_DIR || "/home/devleon/the-hidden-gaming-lair/static/global/icons"}/game-icons/plain-circle_delapouite.webp`;
    iconProps.color = uniqolor(type, {
      lightness: [70, 80],
    }).color;
    size = 0.5;
    continue; // Temporary
  }

  if (!newTypes.includes(type)) {
    newTypes.push(type);
    // Add new filter value
    if (!iconPath) {
      console.warn("No icon path for", key);
      continue;
    }
    try {
      const icon = await saveIcon(iconPath, type, iconProps);
      if (!filters.some((f) => f.group === group)) {
        filters.push({
          group,
          values: [],
          defaultOn: true,
          defaultOpen: true,
        });
      }
      const filter = filters.find((f) => f.group === group)!;
      filter.values.push({
        id: type,
        icon,
        size,
      });
    } catch (e) {
      console.warn("Error saving icon", iconPath, type);
      continue;
    }
  }

  if (!nodes.some((n) => n.type === type)) {
    nodes.push({
      type,
      spawns: [],
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  const spawn: Node["spawns"][0] = {
    p: [value.pos[2], value.pos[0]],
  };
  if (value.stronghold_name !== enDict[type] || value.stronghold_level) {
    const id = key;
    enDict[id] = value.stronghold_name;
    if (value.stronghold_level) {
      enDict[id + "_desc"] = `Level: ${value.stronghold_level}`;
    }

    spawn.id = id;
    if (prefabGroupInfo?.task_name) {
      if (enDict[id + "_desc"]) {
        enDict[id + "_desc"] += "<br>";
      } else {
        enDict[id + "_desc"] = "";
      }
      enDict[id + "_desc"] += `<b>${prefabGroupInfo.task_name}</b>`;
      prefabGroupInfo.task_info_list.forEach((info) => {
        enDict[id + "_desc"] +=
          "<br/>- " +
          info[0].replace(
            "寻找武器箱和装备箱",
            "Find Weapon and Armor Crates",
          ) +
          ": " +
          info[2];
      });
    }
  }

  if (
    node.spawns.some(
      (s) =>
        (s.id && spawn.id ? enDict[s.id] === enDict[spawn.id] : true) &&
        s.p[0] === spawn.p[0] &&
        s.p[1] === spawn.p[1],
    )
  ) {
    console.warn("Duplicate spawn", spawn.id ?? spawn.p);
    continue;
  }
  node.spawns.push(spawn);
}

for (const [key, prefabGroupInfo] of Object.entries(prefabGroupInfoData)) {
  const mapIconId = prefabGroupInfo.prefab_group_bigmap_icon_id.toString();
  const mapItem = bigMapItemData[mapIconId] || smallMapItemData[mapIconId];

  if (!mapItem) {
    console.warn("No map item for", key);
    continue;
  }
  let initialIconPath =
    "ui/dynamic_texpack/" +
    textureMap[mapItem.res_path] +
    "/" +
    mapItem.res_path;
  const initialType = mapItem.res_path
    .replace("map_icon_", "")
    .replace(".png", "");
  const initialTitle = prefabGroupInfo.prefab_group_show_name;

  let { type, title, group, iconProps, iconPath, size } = switchType(
    "unsorted",
    initialType,
    initialTitle,
    initialIconPath,
  );
  if (group === "unsorted") {
    continue; // Temporary
  }

  if (enDict[type] && enDict[type] !== title) {
    console.warn(`Type ${type} already exists with name ${enDict[type]}`);
  } else {
    enDict[type] = title;
  }

  if (!iconPath) {
    iconPath = `${Bun.env.GLOBAL_ICONS_DIR || "/home/devleon/the-hidden-gaming-lair/static/global/icons"}/game-icons/plain-circle_delapouite.webp`;
    iconProps.color = uniqolor(type, {
      lightness: [70, 80],
    }).color;
    size = 0.5;
    continue; // Temporary
  }

  if (!newTypes.includes(type)) {
    newTypes.push(type);
    // Add new filter value
    if (!iconPath) {
      console.warn("No icon path for", key);
      continue;
    }
    const icon = await saveIcon(iconPath, type, iconProps);
    if (!filters.some((f) => f.group === group)) {
      filters.push({
        group,
        values: [],
        defaultOn: true,
        defaultOpen: true,
      });
    }
    const filter = filters.find((f) => f.group === group)!;
    filter.values.push({
      id: type,
      icon,
      size,
    });
  }

  if (!nodes.some((n) => n.type === type)) {
    nodes.push({
      type,
      spawns: [],
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  const spawn: Node["spawns"][0] = {
    p: [
      prefabGroupInfo.prefab_group_pos[2],
      prefabGroupInfo.prefab_group_pos[0],
    ],
  };
  if (
    prefabGroupInfo.prefab_group_show_name !== enDict[type] ||
    prefabGroupInfo.prefab_group_level
  ) {
    const id = key;
    enDict[id] = prefabGroupInfo.prefab_group_show_name;
    if (prefabGroupInfo.prefab_group_level) {
      enDict[id + "_desc"] = `Level: ${prefabGroupInfo.prefab_group_level}`;
    }

    spawn.id = id;
    if (prefabGroupInfo?.task_name) {
      if (enDict[id + "_desc"]) {
        enDict[id + "_desc"] += "<br>";
      } else {
        enDict[id + "_desc"] = "";
      }
      enDict[id + "_desc"] += `<b>${prefabGroupInfo.task_name}</b>`;
      prefabGroupInfo.task_info_list.forEach((info) => {
        enDict[id + "_desc"] +=
          "<br/>- " +
          info[0].replace(
            "寻找武器箱和装备箱",
            "Find Weapon and Armor Crates",
          ) +
          ": " +
          info[2];
      });
    }
  }
  if (
    node.spawns.some(
      (s) =>
        (s.id && spawn.id ? enDict[s.id] === enDict[spawn.id] : true) &&
        s.p[0] === spawn.p[0] &&
        s.p[1] === spawn.p[1],
    )
  ) {
    console.warn("Duplicate spawn", spawn.id ?? spawn.p);
    continue;
  }
  node.spawns.push(spawn);
}

const isValidModelPath = (modelPath: string) => {
  return (
    modelPath &&
    !modelPath.includes("/test/") &&
    !modelPath.includes("/empty/") &&
    !modelPath.includes("/player/") &&
    !modelPath.includes("/weapon/") &&
    !modelPath.includes("/tool/") &&
    !modelPath.startsWith("editor_res") &&
    !modelPath.startsWith("effect") &&
    !modelPath.startsWith("vehicle") &&
    !modelPath.startsWith("environment")
  );
};

for (const baseNPC of Object.values(baseNPCData)) {
  if (!isValidModelPath(baseNPC.model_path)) {
    continue;
  }

  const title = baseNPC.unit_name;
  const group = baseNPC.model_path.split("/")[1];

  let type = group + "_" + title.toLowerCase().replaceAll(" ", "_");
  if (type.match(/[\u3400-\u9FBF]/)) {
    continue;
  }
  // Remove special characters
  type = type
    .replaceAll(" ", "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();

  let iconPath;
  if (group === "monster") {
    iconPath =
      "/ui/dynamic_texpack/all_icon_res/map_icon/small_map_icon/map_icon_s_littlemonster.png";
  } else if (group === "boss") {
    iconPath =
      "/ui/dynamic_texpack/all_icon_res/map_icon/big_map_icon/map_icon_boss.png";
  } else if (group === "animal") {
    iconPath =
      "/ui/dynamic_texpack/all_icon_res/map_icon/small_map_icon/map_icon_enemy.png";
  } else {
    continue;
  }
  const typeId = baseNPC.model_path.replaceAll("/", "\\").split("\\").at(-1)!;
  if (typeIDs[typeId] && typeIDs[typeId] !== type) {
    console.warn(
      `Type ID already exists for ${typeId}. ${typeIDs[typeId]} !== ${type}`,
    );
  }
  typeIDs[typeId] = type;

  const iconProps: IconProps = {
    color: uniqolor(type, {
      lightness: [70, 80],
    }).color,
    circle: true,
  };
  const size = 0.75;

  enDict[type] = title;

  if (!newTypes.includes(type)) {
    newTypes.push(type);
    const icon = await saveIcon(iconPath, type, iconProps);
    if (!filters.some((f) => f.group === group)) {
      filters.push({
        group,
        values: [],
        defaultOn: true,
        defaultOpen: true,
      });
    }
    const filter = filters.find((f) => f.group === group)!;
    filter.values.push({
      id: type,
      icon,
      size,
    });
    if (!nodes.some((n) => n.type === type)) {
      nodes.push({
        type,
        spawns: [],
      });
    }
  }
}

const battleFieldNames = readDirSync(
  CONTENT_DIR + "/game_common/data/battle_field",
);
for (const battleFieldName of battleFieldNames) {
  if (!battleFieldName.endsWith(".json")) {
    continue;
  }
  const battleFieldData = await readJSON<BattleFieldData>(
    CONTENT_DIR + "/game_common/data/battle_field/" + battleFieldName,
  );

  for (const nodeData of Object.values(battleFieldData.nodes)) {
    if (nodeData.Type !== "NpcNode") {
      continue;
    }
    if (!isValidModelPath(nodeData.model_path)) {
      continue;
    }

    let initialType;
    const baseUnitData = baseNPCData[nodeData.unit_id];
    if (nodeData.unit_name === "Default") {
      continue;
    }
    let initialTitle = nodeData.unit_name;
    if (
      !initialTitle ||
      initialTitle.match(/[\u3400-\u9FBF]/) ||
      !initialTitle.match(/[A-Z]/g)
    ) {
      initialTitle = baseUnitData?.unit_name;
    }
    if (!initialTitle || initialTitle.match(/[\u3400-\u9FBF]/)) {
      continue;
    }

    // if (nodeData.model_path.includes("/m_spider_box/")) {
    //   continue
    // }

    const spawn: Node["spawns"][0] = {
      p: [nodeData.pos3[2], nodeData.pos3[0]],
    };

    let initialGroup = nodeData.model_path.split("/")[1];
    initialType =
      nodeData.model_path.split("/").at(-1)?.split(".")[0] ??
      nodeData.model_path.split("\\").at(-1)?.split(".")[0] ??
      nodeData.model_path;
    spawn.id = initialType;

    if (!initialTitle) {
      // console.warn("No initialTitle for", nodeData.unit_id);
      continue;
    }
    if (!initialType) {
      initialType = initialTitle.replaceAll(/\s/g, " "); // There are some invalid spaces
    }
    if (nodeData.model_path.includes("/m_spider_box/")) {
      continue;
    }

    let { type, title, group, iconProps, iconPath, size } = switchType(
      initialGroup,
      initialType,
      initialTitle,
      "",
      nodeData.model_path,
    );

    if (group === "unsorted") {
      continue; // Temporary
    }

    if (!iconPath) {
      type =
        initialGroup + "_" + title.toLocaleLowerCase().replaceAll(" ", "_");
      if (group === "monster") {
        iconPath =
          "/ui/dynamic_texpack/all_icon_res/map_icon/small_map_icon/map_icon_s_littlemonster.png";
      } else if (group === "boss") {
        iconPath =
          "/ui/dynamic_texpack/all_icon_res/map_icon/big_map_icon/map_icon_boss.png";
      } else if (group === "animal") {
        iconPath =
          "/ui/dynamic_texpack/all_icon_res/map_icon/small_map_icon/map_icon_enemy.png";
      }
      iconProps.color = uniqolor(type, {
        lightness: [70, 80],
      }).color;
      iconProps.circle = true;
      size = 0.75;
    }

    const typeId = nodeData.model_path
      .replaceAll("/", "\\")
      .split("\\")
      .at(-1)!;
    if (typeIDs[typeId] && typeIDs[typeId] !== type) {
      console.warn(
        `Type ID already exists for ${typeId}. ${typeIDs[typeId]} !== ${type}`,
      );
    }
    typeIDs[typeId] = type;

    enDict[type] = title;

    if (!newTypes.includes(type)) {
      newTypes.push(type);
      const icon = await saveIcon(iconPath, type, iconProps);
      if (!filters.some((f) => f.group === group)) {
        filters.push({
          group,
          values: [],
          defaultOn: true,
          defaultOpen: true,
        });
      }
      const filter = filters.find((f) => f.group === group)!;
      filter.values.push({
        id: type,
        icon,
        size,
      });
    }

    if (!nodes.some((n) => n.type === type)) {
      nodes.push({
        type,
        spawns: [],
      });
    }

    const node = nodes.find((n) => n.type === type)!;

    if (
      node.spawns.some(
        (s) =>
          (s.id && spawn.id ? enDict[s.id] === enDict[spawn.id] : true) &&
          s.p[0] === spawn.p[0] &&
          s.p[1] === spawn.p[1],
      )
    ) {
      // console.warn(
      //   "Duplicate spawn",
      //   spawn.id ?? spawn.p,
      //   nodeData.unit_id,
      //   type,
      // );
      continue;
    }
    // Don't add static monsters yet
    // node.spawns.push(spawn);
  }
}

const achieveCollectData = await readJSON<AchieveCollectData>(
  CONTENT_DIR + "/game_common/data/achieve_collect_data.json",
);

// Morphic Crate
{
  const group = "items";
  const type = "morphic_crate";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    type,
    {
      color: "purple",
      circle: true,
    },
  );

  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
  });
  enDict[type] = "Morphic Crate";

  if (!nodes.some((n) => n.type === type)) {
    nodes.push({
      type,
      spawns: [],
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["m_spider_box.gim"] = type;
}

// Weapon Crate
{
  const group = "items";
  const type = "weapon_crate";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    type,
    {
      color: "green",
      circle: true,
    },
  );

  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    autoDiscover: true,
  });
  enDict[type] = "Weapon Crate";

  if (!nodes.some((n) => n.type === type)) {
    nodes.push({
      type,
      spawns: [],
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  for (const [key, value] of Object.entries(interactResData)) {
    if (value.res_name === "Weapon Crate") {
      typeIDs[key] = type;
    }
  }
}
// Gear Crate
{
  const group = "items";
  const type = "gear_crate";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    type,
    {
      color: "yellow",
      circle: true,
    },
  );

  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    autoDiscover: true,
  });
  enDict[type] = "Gear Crate";

  if (!nodes.some((n) => n.type === type)) {
    nodes.push({
      type,
      spawns: [],
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  for (const [key, value] of Object.entries(interactResData)) {
    if (value.res_name === "Gear Crate") {
      typeIDs[key] = type;
    }
  }
}
// Storage Crate
{
  const group = "items";
  const type = "storage_crate";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    type,
    {
      color: "lightblue",
      circle: true,
    },
  );

  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    autoDiscover: true,
  });
  enDict[type] = "Storage Crate";

  if (!nodes.some((n) => n.type === type)) {
    nodes.push({
      type,
      spawns: [],
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];

  for (const [key, value] of Object.entries(interactResData)) {
    if (value.res_name === "Storage Crate") {
      typeIDs[key] = type;
    }
  }
}

for (const [key, value] of Object.entries(interactResData)) {
  if (value.res_icon !== "hud_icon_gather_s.png") {
    continue;
  }

  if (key === "deviation_point_box.gim") {
    continue;
  }
  let group;
  let size = 1;
  const type = value.res_name
    .toLowerCase()
    .replaceAll(" ", "_")
    .replace(/[^a-zA-Z0-9_]/g, "");
  let iconPath;
  const iconProps: IconProps = {};
  if (value.res_name.endsWith(" Recipe")) {
    group = "recipes";
    iconPath = `${Bun.env.GLOBAL_ICONS_DIR || "/home/devleon/the-hidden-gaming-lair/static/global/icons"}/game-icons/full-folder_delapouite.webp`;
    iconProps.color = uniqolor(key, {
      lightness: [70, 80],
    }).color;
    iconProps.circle = true;
    size = 0.76;
  } else if (value.res_name === "Fruit & Veggies") {
    group = "items";
    iconPath = `${Bun.env.GLOBAL_ICONS_DIR || "/home/devleon/the-hidden-gaming-lair/static/global/icons"}/game-icons/fruit-bowl_skoll.webp`;
    size = 0.76;
  } else {
    group = "items";
    iconPath =
      "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png";
    iconProps.color = uniqolor(key, {
      lightness: [70, 80],
    }).color;
    iconProps.circle = true;

    continue; // Temporary
  }
  const icon = await saveIcon(iconPath, type, iconProps);

  const filter = filters.find((f) => f.group === group)!;
  if (!filter.values.some((v) => v.id === type)) {
    filter.values.push({
      id: type,
      icon,
      size,
      // autoDiscover: true,
    });
    enDict[type] = value.res_name;
  }
  if (!nodes.some((n) => n.type === type)) {
    nodes.push({
      type,
      spawns: [],
    });
  }
  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];

  typeIDs[key] = type;
}

// Mystical Crate
{
  const group = "items";
  const type = "mystical_crate";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    type,
    {
      color: "orange",
      circle: true,
    },
  );

  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    autoDiscover: true,
  });
  enDict[type] = "Mystical Crate";

  if (!nodes.some((n) => n.type === type)) {
    nodes.push({
      type,
      spawns: [],
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["invisible_treasure_01.gim"] = type;
  typeIDs["invisible_treasure_02.gim"] = type;
  typeIDs["invisible_treasure_03.gim"] = type;
  typeIDs["invisible_treasure_04.gim"] = type;
}
// Copper
{
  const group = "gatherables";
  const type = "copper_ore";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon/icon_copper_ore.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    autoDiscover: true,
  });
  enDict[type] = "Copper Ore";

  if (!nodes.some((n) => n.type === type)) {
    nodes.push({
      type,
      spawns: [],
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["cu_l_01.gim"] = type;
}

{
  const previousNodes = await readJSON<Node[]>(
    OUTPUT_DIR + "/coordinates/nodes.json",
  );
  for (const node of previousNodes) {
    if (!Object.values(typeIDs).includes(node.type)) {
      continue;
    }
    const prevNode = nodes.find((n) => n.type === node.type)!;
    prevNode.spawns = node.spawns;
  }
}

const sortPriority = [
  "items",
  "recipes",
  "gatherables",
  "locations",
  "riddles",
  "boss",
  "monster",
  "animal",
];

const filteredNodes = nodes
  .map((n) => ({
    ...n,
    static:
      !Object.values(typeIDs).includes(n.type) || n.type.endsWith("_crate"),
    spawns: n.spawns.filter((s) => {
      const isNotOnWorldMap = s.p[0] > 3050 || (s.p[0] > -600 && s.p[1] < 600);
      return !isNotOnWorldMap;
    }),
  }))
  .sort((a, b) => {
    const groupA =
      filters.find((f) => f.values.some((v) => v.id === a.type))?.group ??
      a.type;
    const groupB =
      filters.find((f) => f.values.some((v) => v.id === b.type))?.group ??
      b.type;
    if (groupA === groupB) {
      return 0;
    }
    let priorityA = sortPriority.findIndex((p) =>
      groupA.toLowerCase().startsWith(p.toLowerCase()),
    );
    if (priorityA === -1) {
      priorityA = 1000;
    }
    let priorityB = sortPriority.findIndex((p) =>
      groupB.toLowerCase().startsWith(p.toLowerCase()),
    );
    if (priorityB === -1) {
      priorityB = 1000;
    }
    if (priorityA === priorityB) {
      return groupA.localeCompare(groupB);
    }
    return priorityA - priorityB;
  });

const flatFilters = Object.values(filters).flatMap((f) => f.values);
filteredNodes.sort((a, b) => {
  const aSize = flatFilters.find((f) => f.id === a.type)!.size!;
  const bSize = flatFilters.find((f) => f.id === b.type)!.size!;
  return aSize - bSize;
});
writeNodes(filteredNodes);
Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    filteredNodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});

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

const database = initDatabase();
{
  const bigWorldCollectableNotesData =
    await readJSON<BigWorldCollectableNotesData>(
      CONTENT_DIR + "/client_data/big_world_collectable_notes_data.json",
    );
  for (const [key, value] of Object.entries(bigWorldCollectableNotesData)) {
    if (!value.content_lst) {
      console.warn("No content for", key);
      continue;
    }

    const type =
      "remnants_" +
      value.sub_type_name
        .replaceAll(" ", "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();
    enDict[type] = value.sub_type_name;
    if (!database.some((i) => i.type === type)) {
      database.push({
        type,
        items: [],
      });
    }
    const items = database.find((i) => i.type === type)!;

    const item: (typeof database)[number]["items"][number] = {
      id: key,
      props: {
        title: value.title,
        title1: value.title1,
        title2: value.title2,
        title3: value.title3,
        content: value.content_lst.join("\n\n"),
        sortPriority: value.sort_priority,
      },
    };

    items.items.push(item);
  }
}

writeFilters(sortedFilters);
writeDict(enDict, "en");
writeTypesIDs(typeIDs);
writeDatabase(database);

console.log("Done!");
