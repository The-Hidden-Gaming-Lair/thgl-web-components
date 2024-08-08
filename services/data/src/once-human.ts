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
import { initTypesIDs } from "./lib/types-ids.js";
import {
  BigMapItemData,
  PrefabGroupInfoData,
  PrefabInfoData,
  ScenePrefabData,
  SmallMapItemData,
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
});

const mapName = "default";
if (Bun.env.TILES === "true") {
  const mapTiles = await readDirSync(
    TEXTURE_DIR + "/ui/texpack/bigmap_res/map/2048/",
  ).map((f) => TEXTURE_DIR + `/ui/texpack/bigmap_res/map/2048/${f}`);
  let canvas = await mergeImages(mapTiles);
  canvas = adjustBrightnessAndContrast(canvas, -40, 1.1);
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

const newTypes: string[] = [];

for (const [key, value] of Object.entries(prefabInfoData)) {
  let type;
  let title;
  let size = 1;
  let group = "unsorted";
  const iconProps: IconProps = {};

  let iconPath;
  const prefabGroupInfo = Object.values(prefabGroupInfoData).find(
    (d) => d.prefab_group_show_name === value.stronghold_name,
  );

  const bigMapItem = bigMapItemData[value.bigmap_icon_id.toString()];
  if (bigMapItem) {
    iconPath = textureMap[bigMapItem.res_path];
    type = bigMapItem.res_path.replace("map_icon_", "").replace(".png", "");
    title = bigMapItem.item_name;
  } else if (prefabGroupInfo) {
    const smappMapItem =
      smallMapItemData[prefabGroupInfo.prefab_group_bigmap_icon_id.toString()];
    iconPath = textureMap[smappMapItem.res_path];
    type = smappMapItem.res_path.replace("map_icon_", "").replace(".png", "");
    title = prefabGroupInfo.prefab_group_show_name;
  }
  if (!type) {
    type = value.stronghold_name;
  }
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
  } else if (type === "hud_icon_w_wharf") {
    group = "locations";
  } else if (type === "zhongliyingdi_kechuansong") {
    group = "locations";
    title = "Union Stronghold";
  } else if (type === "initial_respawn") {
    group = "locations";
  } else {
    group = "unsorted";
    // Temporary
    continue;
  }
  if (!title) {
    title = type;
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

Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    nodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});
writeNodes(nodes);
writeFilters(filters);
writeDict(enDict, "en");
console.log("Done!");
