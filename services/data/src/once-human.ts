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
import {
  adjustBrightnessAndContrast,
  IconProps,
  mergeImages,
  saveIcon,
} from "./lib/image.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import {
  BaseNPCData,
  BattleFieldData,
  BigMapItemData,
  PrefabGroupInfoData,
  PrefabInfoData,
  ScenePrefabData,
  SmallMapItemData,
  TreasureMonsterDropData,
} from "./once-human.types.js";
import { Node } from "./types.js";

initDirs(
  Bun.env.ONCE_HUMAN_CONTENT_DIR ?? "/mnt/c/dev/OnceHuman/Extracted/Data",
  Bun.env.ONCE_HUMAN_TEXTURE_DIR ?? "/mnt/c/dev/OnceHuman/Extracted/Texture",
  Bun.env.ONCE_HUMAN_OUTPUT_DIR ??
    "/home/devleon/the-hidden-gaming-lair/static/once-human",
);

let nodes = initNodes();
const filters = initFilters();
const enDict = initDict({
  locations: "Locations",
  monsters: "Monsters",
  riddles: "Riddles",
  items: "Items",
});

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
// const regions = await getRegionsFromImage(
//   TEXTURE_DIR + "/ui/texpack/bigmap_res/grade_area.png",
//   tiles[mapName].transformation!
// );

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
    iconProps.brightness = -100;
    iconProps.contrast = 1.3;
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
  } else if (more?.includes("_Scattered")) {
    group = "locations";
    type = "Scattered";
    title = type;
    iconPath = `${Bun.env.GLOBAL_ICONS_DIR || "/home/devleon/the-hidden-gaming-lair/static/global/icons"}/game-icons/damaged-house_quoting.webp`;
    iconProps.glowing = true;
    iconProps.color = "black";
    size = 0.65;
  } else if (type === "Morphic - Crate") {
    (iconPath =
      "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png"),
      (type = "morphic_crate");
    title = "Morphic Crate";
    group = "items";
    iconProps.color = "purple";
    iconProps.circle = true;
  } else if (more?.includes("Bus ") || more?.includes("_Bus_")) {
    type = "bus_monster";
    iconPath = `${Bun.env.GLOBAL_ICONS_DIR || "/home/devleon/the-hidden-gaming-lair/static/global/icons"}/game-icons/bus_delapouite.webp`;
    title = "Bus Monster";
    group = "monsters";
    iconProps.color = "#ea93b2";
  } else if (more?.includes("House_Monster")) {
    type = "house_monster";
    iconPath = `${Bun.env.GLOBAL_ICONS_DIR || "/home/devleon/the-hidden-gaming-lair/static/global/icons"}/game-icons/house_delapouite.webp`;
    title = "Bus Monster";
    group = "monsters";
    iconProps.color = "#ea93b2";
    size = 0.75;
  }
  if (!title) {
    title = type;
  }

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
  initialIconPath = textureMap[mapItem.res_path];
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
    iconProps.color = uniqolor(type).color;
    size = 0.5;
    continue; // Temporary
  }

  if (!newTypes.includes(type)) {
    // Remove all old nodes of this type
    newTypes.push(type);
    nodes = nodes.filter((n) => n.type !== type);

    // Remove old filter values
    filters.forEach((filter) => {
      filter.values = filter.values.filter((v) => v.id !== type);
    });

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
  const smappMapItem =
    smallMapItemData[prefabGroupInfo.prefab_group_bigmap_icon_id.toString()];
  let initialIconPath = textureMap[smappMapItem.res_path];
  const initialType = smappMapItem.res_path
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
    iconProps.color = uniqolor(type).color;
    size = 0.5;
    continue; // Temporary
  }

  if (!newTypes.includes(type)) {
    // Remove all old nodes of this type
    newTypes.push(type);
    nodes = nodes.filter((n) => n.type !== type);

    // Remove old filter values
    filters.forEach((filter) => {
      filter.values = filter.values.filter((v) => v.id !== type);
    });

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

    const initialGroup = nodeData.unit_type;

    let initialTitle;
    const baseNPC = baseNPCData[nodeData.prefab_id];
    if (baseNPC) {
      initialTitle = baseNPC.unit_name;
    } else if (nodeData.unit_name) {
      initialTitle = nodeData.unit_name;
    }
    if (!initialTitle) {
      console.warn("No initialTitle for", nodeData.unit_id);
      continue;
    }
    const initialType = initialTitle.replaceAll(/\s/g, " "); // There are some invalid spaces

    let { type, title, group, iconProps, iconPath, size } = switchType(
      initialGroup,
      initialType,
      initialTitle,
      "",
    );
    if (group === "unsorted") {
      continue; // Temporary
    }

    if (!iconPath) {
      iconPath = `${Bun.env.GLOBAL_ICONS_DIR || "/home/devleon/the-hidden-gaming-lair/static/global/icons"}/game-icons/plain-circle_delapouite.webp`;
      iconProps.color = uniqolor(type).color;
      size = 0.5;
      continue; // Temporary
    }

    enDict[type] = title;

    if (!newTypes.includes(type)) {
      // Remove all old nodes of this type
      newTypes.push(type);
      nodes = nodes.filter((n) => n.type !== type);

      // Remove old filter values
      filters.forEach((filter) => {
        filter.values = filter.values.filter((v) => v.id !== type);
      });

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
      p: [nodeData.pos3[2], nodeData.pos3[0]],
    };
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
    node.spawns.push(spawn);
  }
}

Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    nodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});
writeNodes(nodes);
const sortPriority = ["locations", "items", "monsters", "riddles"];
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
writeFilters(sortedFilters);
writeDict(enDict, "en");
console.log("Done!");
