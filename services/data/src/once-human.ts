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
  arrayJoinImages,
  createBlankImage,
  IconProps,
  mergeImages,
  saveIcon,
} from "./lib/image.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import {
  AchieveCollectData,
  AreaMaskDefineData,
  BaseNPCData,
  BattleFieldData,
  BigMapItemData,
  BigWorldCollectableNotesData,
  BookCollectAreaEnterClientData,
  BookCollectModelData,
  BookCollectSeriesData,
  CollectNewTagData,
  DeviationBaseData,
  FishData,
  GiftDropNormalDataClient,
  InteractResData,
  ItemData,
  PrefabGroupInfoData,
  PrefabInfoData,
  ScenePrefabData,
  SmallMapItemData,
  TreasureMonsterDropData,
} from "./once-human.types.js";
import { Node } from "./types.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";
import {
  getBorderFromMaskImage,
  initRegions,
  writeRegions,
} from "./lib/regions.js";
import { initDatabase, writeDatabase } from "./lib/database.js";
import { capitalizeWords } from "./lib/utils.js";

initDirs(
  String.raw`C:\dev\OnceHuman\Extracted\Data`,
  String.raw`C:\dev\OnceHuman\Extracted\Texture`,
  String.raw`C:\dev\the-hidden-gaming-lair\static\once-human`,
);

let nodes = initNodes();
const filters = initFilters([
  { group: "items", defaultOn: true, defaultOpen: false, values: [] },
  { group: "recipes", defaultOn: true, defaultOpen: false, values: [] },
  { group: "notes", defaultOn: true, defaultOpen: false, values: [] },
  { group: "gatherables", defaultOn: true, defaultOpen: false, values: [] },
  // { group: "plants", defaultOn: true, defaultOpen: false, values: [] },
  { group: "locations", defaultOn: true, defaultOpen: false, values: [] },
  { group: "riddles", defaultOn: true, defaultOpen: false, values: [] },
  { group: "boss", defaultOn: true, defaultOpen: false, values: [] },
  { group: "monster", defaultOn: false, defaultOpen: false, values: [] },
  { group: "animal", defaultOn: false, defaultOpen: false, values: [] },
]);

const DEFAULT_SCENARIO = "default";
const PRISMVERSE_CLASH = "east_blackfell_pvp";
const THE_WAY_OF_WINTER = "north_snow_pve";
const RAIDS_AND_DUNGEONS = "raid";

const MASK_TO_SCENARIO: Record<string, string> = {
  east_blackfell_pvp_mask: PRISMVERSE_CLASH,
  north_snow_pve_mask: THE_WAY_OF_WINTER,
  east_butterflydream_pve_pvp_mask: DEFAULT_SCENARIO,
};

const enDict = initDict({
  [DEFAULT_SCENARIO]: "Manibus & Evolution's Call",
  [PRISMVERSE_CLASH]: "Prismverse's Clash",
  [THE_WAY_OF_WINTER]: "The Way of Winter",
  [RAIDS_AND_DUNGEONS]: "Raids & Dungeons",
  locations: "Locations",
  deviations: "Deviants",
  boss: "Bosses",
  monster: "Monsters",
  animal: "Animals",
  fishes: "Fishes",
  riddles: "Riddles",
  items: "Items",
  recipes: "Recipes",
  gatherables: "Gatherables",
  // plants: "Plants",
});
const typeIDs = initTypesIDs({
  "ball.gim": "deviations_ball",
});

if (Bun.argv.includes("--tiles")) {
  const mapTiles = await readDirSync(
    TEXTURE_DIR + "/ui/texpack/bigmap_res/map/1024/",
  ).map((f) => TEXTURE_DIR + `/ui/texpack/bigmap_res/map/1024/${f}`);
  const canvas = await mergeImages(mapTiles, /(-?\d+)_(-?\d+)/);
  const imagePath = TEMP_DIR + "/" + DEFAULT_SCENARIO + ".png";
  saveImage(imagePath, canvas.toBuffer("image/png"));
}

const TILE_SIZE = 512;
const ORTHOGRAPHIC_WIDTH = 8200 * 2;

const blank = createBlankImage(TILE_SIZE, TILE_SIZE);
saveImage(TEMP_DIR + "/raid.png", blank.toBuffer("image/png"));

const defaultTiles = await generateTiles(
  DEFAULT_SCENARIO,
  TEMP_DIR + "/" + DEFAULT_SCENARIO + ".png",
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
);

const tiles = initTiles({
  [DEFAULT_SCENARIO]: defaultTiles[DEFAULT_SCENARIO],
  [PRISMVERSE_CLASH]: defaultTiles[DEFAULT_SCENARIO],
  [THE_WAY_OF_WINTER]: {
    ...defaultTiles[DEFAULT_SCENARIO],
    fitBounds: [
      [8000, -8000],
      [2600, 8000],
    ] as [[number, number], [number, number]],
  },
  [RAIDS_AND_DUNGEONS]: {
    ...defaultTiles[DEFAULT_SCENARIO],
    url: "/map-tiles/raid/{z}/{y}/{x}.webp",
    fitBounds: [
      [300, -770],
      [-450, 530],
    ] as [[number, number], [number, number]],
  },
});

writeTiles(tiles);

await saveIcon(
  "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_oneself_v4.png",
  "player",
);

const areaMaskDefineData = await readJSON<AreaMaskDefineData>(
  CONTENT_DIR + "/game_common/data/area_mask_define_data.json",
);
const areaMaskData = Object.entries(areaMaskDefineData)
  .filter(([k]) => k !== "area_mask_mapping")
  .map((a) => a[1]) as Omit<AreaMaskDefineData, "area_mask_mapping">[number][];

const areaMasks = areaMaskData.reduce(
  (acc, val) => {
    const id = val.area_name;
    if (!acc[id]) {
      acc[id] = {
        maskFilename: val.mask_filename,
        areaMaskIDs: [],
      };
    }
    acc[id].areaMaskIDs.push([
      val.area_mask_id,
      val.area_mask_id,
      val.area_mask_id,
    ]);
    return acc;
  },
  {} as Record<
    string,
    {
      maskFilename: string;
      areaMaskIDs: [number, number, number][];
    }
  >,
);
const regions = initRegions();
const joinedMaskImages: string[] = [];
for (const [id, areaMask] of Object.entries(areaMasks)) {
  try {
    if (!areaMask.maskFilename || id === "Rift Space") {
      continue;
    }

    const maskImages = await readDirSync(
      TEXTURE_DIR + "/ui/uncompress_tex/" + areaMask.maskFilename,
    ).map(
      (f) => TEXTURE_DIR + `/ui/uncompress_tex/${areaMask.maskFilename}/${f}`,
    );

    const joinedMaskImagePath = `${TEMP_DIR}/__${areaMask.maskFilename}.png`;
    if (!joinedMaskImages.includes(joinedMaskImagePath)) {
      await arrayJoinImages(
        maskImages,
        /(-?\d+)_(-?\d+)/,
        joinedMaskImagePath,
        true,
      );
      joinedMaskImages.push(joinedMaskImagePath);
    }

    const borders = await getBorderFromMaskImage(
      joinedMaskImagePath,
      areaMask.areaMaskIDs,
    );

    // borders.forEach(([x, y]) => {
    //   console.log(x, y);
    // });
    const center = borders.reduce(
      ([x, y], [bx, by]) => [x + bx, y + by],
      [0, 0],
    );
    center[0] /= borders.length;
    center[1] /= borders.length;

    const resizedBorders = borders.map(([x, y]) => {
      const newX = x > center[0] ? x : x;
      const newY = y > center[1] ? y : y;
      return [newX, newY] as [number, number];
    });

    let border = resizedBorders.map(([x, y]) => [
      (-y * 128) / 8 + ORTHOGRAPHIC_WIDTH / 2,
      (x * 128) / 8 - ORTHOGRAPHIC_WIDTH / 2,
    ]) as [number, number][];

    const resizedCenter = border.reduce(
      ([x, y], [bx, by]) => [x + bx, y + by],
      [0, 0],
    );
    resizedCenter[0] /= border.length;
    resizedCenter[1] /= border.length;
    const mapName = MASK_TO_SCENARIO[areaMask.maskFilename];
    if (!mapName) {
      console.error(`Unknown map name for ${areaMask.maskFilename}`);
      continue;
    }
    regions.push({
      id: id,
      center: resizedCenter,
      border,
      mapName,
    });
    enDict[id] = id;
  } catch (e) {
    console.error(`Error processing ${id}`, e);
  }
}
writeRegions(regions);

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
const collectNewTagData = await readJSON<CollectNewTagData>(
  CONTENT_DIR + "/game_common/data/collect_new_tag_data.json",
);
const giftDropNormalDataClient = await readJSON<GiftDropNormalDataClient>(
  CONTENT_DIR + "/client_data/gift_drop_normal_data_client.json",
);
const itemData = await readJSON<ItemData>(
  CONTENT_DIR + "/game_common/data/item_data.json",
);
const deviationBaseData = await readJSON<DeviationBaseData>(
  CONTENT_DIR + "/game_common/data/deviation_base_data.json",
);
const bookCollectModelData = await readJSON<BookCollectModelData>(
  CONTENT_DIR + "/client_data/book_collect_model_data.json",
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
    iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\jigsaw-piece_lorc.webp`;
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
    iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\damaged-house_quoting.webp`;
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
    iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\plain-circle_delapouite.webp`;
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
      // console.warn("No icon path for", key);
      continue;
    }
    try {
      const icon = await saveIcon(iconPath, type, iconProps);
      if (!filters.some((f) => f.group === group)) {
        filters.push({
          group,
          values: [],
          defaultOn: true,
          defaultOpen: false,
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

  const mapMaskNames = Object.entries(value.mask_level_offset);
  for (const [mapMaskName, level] of mapMaskNames) {
    const maskFileName =
      areaMaskDefineData.area_mask_mapping.mapping_datas[mapMaskName];
    if (!maskFileName || !MASK_TO_SCENARIO[maskFileName]) {
      console.warn(`No mask file name for ${mapMaskName}`);
      continue;
    }
    const mapName = MASK_TO_SCENARIO[maskFileName];
    if (!nodes.some((n) => n.type === type && n.mapName === mapName)) {
      nodes.push({
        type,
        spawns: [],
        mapName: mapName,
      });
    }

    const node = nodes.find((n) => n.type === type && n.mapName === mapName)!;
    const spawn: Node["spawns"][0] = {
      p: [value.pos[2], value.pos[0], value.pos[1]],
    };
    if (value.stronghold_name !== enDict[type] || level) {
      const id = key + "_" + mapMaskName;
      enDict[id] = value.stronghold_name;
      if (level) {
        enDict[id + "_desc"] = `Level: ${level}`;
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
    iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\plain-circle_delapouite.webp`;
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
        defaultOpen: false,
      });
    }
    const filter = filters.find((f) => f.group === group)!;
    filter.values.push({
      id: type,
      icon,
      size,
    });
  }

  const mapMaskNames = Object.entries(prefabGroupInfo.mask_level_info);
  for (const [mapMaskName, level] of mapMaskNames) {
    const maskFileName =
      areaMaskDefineData.area_mask_mapping.mapping_datas[mapMaskName];
    if (!maskFileName || !MASK_TO_SCENARIO[maskFileName]) {
      console.warn(`No mask file name for ${mapMaskName}`);
      continue;
    }
    const mapName = MASK_TO_SCENARIO[maskFileName];
    if (!nodes.some((n) => n.type === type && n.mapName === mapName)) {
      nodes.push({
        type,
        spawns: [],
        mapName: mapName,
      });
    }

    const node = nodes.find((n) => n.type === type && n.mapName === mapName)!;
    const spawn: Node["spawns"][0] = {
      p: [
        prefabGroupInfo.prefab_group_pos[2],
        prefabGroupInfo.prefab_group_pos[0],
        prefabGroupInfo.prefab_group_pos[1],
      ],
    };
    if (prefabGroupInfo.prefab_group_show_name !== enDict[type] || level) {
      const id = key;
      enDict[id] = prefabGroupInfo.prefab_group_show_name;
      if (level) {
        enDict[id + "_desc"] = `Level: ${level}`;
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
}

const isValidModelPath = (modelPath: string) => {
  return (
    modelPath &&
    !modelPath.includes("/test/") &&
    !modelPath.includes("/empty/") &&
    !modelPath.includes("/weapon/") &&
    !modelPath.includes("/tool/") &&
    !modelPath.startsWith("editor_res") &&
    !modelPath.startsWith("effect") &&
    !modelPath.startsWith("vehicle") &&
    !modelPath.startsWith("environment")
  );
};

for (const deviation of Object.values(deviationBaseData)) {
  const group = "deviations";
  const type = `deviations_${deviation.name.toLowerCase().replaceAll(" ", "_")}`;
  enDict[type] = deviation.name;
  const iconPath = `/ui/dynamic_texpack/contain_system_ui/containment_icon/${deviation.pal_icon}`;
  enDict[`${type}_desc`] = deviation.skill_info_lst.join("<br>");
  const size = 1.5;
  const iconProps: IconProps = {
    border: true,
    color: "#d1aedd",
  };

  let typeId;
  if (deviation.unit_id) {
    const baseNPC = baseNPCData[deviation.unit_id]!;
    typeId = baseNPC.model_path.replaceAll("/", "\\").split("\\").at(-1)!;
  } else {
    const modelData = Object.values(bookCollectModelData).find(
      (d) => d.name === deviation.name,
    );
    if (!modelData) {
      console.warn(`No model data for ${deviation.name}`);
      continue;
    }

    typeId = modelData.model_path!.replaceAll("/", "\\").split("\\").at(-1)!;
  }
  if (typeIDs[typeId] && typeIDs[typeId] !== type) {
    // console.warn(
    //   `Type ID already exists for ${typeId}. ${typeIDs[typeId]} !== ${type}`,
    // );
  }
  typeIDs[typeId] = type;

  if (!newTypes.includes(type)) {
    newTypes.push(type);
    const icon = await saveIcon(iconPath, type, iconProps);
    if (!filters.some((f) => f.group === group)) {
      filters.push({
        group,
        values: [],
        defaultOn: true,
        defaultOpen: false,
      });
    }
    const filter = filters.find((f) => f.group === group)!;
    filter.values.push({
      id: type,
      icon,
      size,
    });
    if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
      nodes.push({
        type,
        spawns: [],
        mapName: DEFAULT_SCENARIO,
      });
    }
  }
}
const fishData = await readJSON<FishData>(
  CONTENT_DIR + "/game_common/data/fish_data.json",
);
for (const fish of Object.values(fishData)) {
  if (!fish.model_path) {
    continue;
  }
  const group = "fishes";
  const size = 0.75;
  const typeId = fish.model_path.replaceAll("/", "\\").split("\\").at(-1)!;
  const item = itemData[fish.output];
  const type = "fishes_" + item.name.toLowerCase().replaceAll(" ", "_");
  const iconPath =
    "ui/dynamic_texpack/" + textureMap[item.icon] + "/" + item.icon;
  enDict[type] = item.name;
  if (item.short_desc) {
    enDict[`${type}_desc`] = item.short_desc;
  }
  if (!newTypes.includes(type)) {
    newTypes.push(type);
    const icon = await saveIcon(iconPath, type, {});
    if (!filters.some((f) => f.group === group)) {
      filters.push({
        group,
        values: [],
        defaultOn: true,
        defaultOpen: false,
      });
    }
    const filter = filters.find((f) => f.group === group)!;
    filter.values.push({
      id: type,
      icon,
      size,
    });
    if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
      nodes.push({
        type,
        spawns: [],
        mapName: DEFAULT_SCENARIO,
      });
    }
  }
  if (typeIDs[typeId] && typeIDs[typeId] !== type) {
    console.warn(
      `Type ID already exists for ${typeId}. ${typeIDs[typeId]} !== ${type}`,
    );
  }
  typeIDs[typeId] = type;
}

for (const [key, baseNPC] of Object.entries(baseNPCData)) {
  try {
    if (!isValidModelPath(baseNPC.model_path)) {
      continue;
    }

    let title = baseNPC.unit_name;
    let group = baseNPC.model_path.split("/")[1];
    let desc: string | undefined;

    let type = group + "_" + title.toLowerCase().replaceAll(" ", "_");
    if (type.match(/[\u3400-\u9FBF]/)) {
      continue;
    }
    // Remove special characters
    type = type
      .replaceAll(" ", "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    const iconProps: IconProps = {};
    let iconPath;
    let size = 0.75;
    const typeId = baseNPC.model_path.replaceAll("/", "\\").split("\\").at(-1)!;

    if (baseNPC.unit_entity_type === "Deviation") {
      continue;
    } else {
      iconProps.color = uniqolor(type, {
        lightness: [70, 80],
      }).color;
      if (type === "animal_fish") {
        continue;
      } else if (type === "animal_bear") {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\bear-head_delapouite.webp`;
      } else if (type === "animal_rabbit") {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\rabbit-head_delapouite.webp`;
      } else if (type === "animal_small_rabbit") {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\rabbit_delapouite.webp`;
      } else if (type === "animal_small_boar") {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\boar-ensign_cathelineau.webp`;
      } else if (type === "animal_boar") {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\boar_caro-asercion.webp`;
      } else if (type === "animal_capybara") {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\capybara_caro-asercion.webp`;
      } else if (type === "animal_deer") {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\deer_caro-asercion.webp`;
      } else if (type.endsWith("_crocodile")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\croc-jaws_lorc.webp`;
      } else if (type === "animal_eagle") {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\eagle-head_delapouite.webp`;
      } else if (type.endsWith("_wolf")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\wolf-head_lorc.webp`;
      } else if (type === "animal_flamingo") {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\flamingo_delapouite.webp`;
      } else if (type.endsWith("_fox")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\fox_caro-asercion.webp`;
      } else if (type.endsWith("_pelican")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\eating-pelican_delapouite.webp`;
      } else if (type.endsWith("_raccoon")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\raccoon-head_delapouite.webp`;
      } else if (type.endsWith("_turtle")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\sea-turtle_delapouite.webp`;
      } else if (type.endsWith("_swan")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\swan_lorc.webp`;
      } else if (type.endsWith("_squirrel")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\squirrel_delapouite.webp`;
      } else if (type.endsWith("_raven")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\raven_lorc.webp`;
      } else if (type.endsWith("_rat")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\rat_delapouite.webp`;
      } else if (type.endsWith("_seal")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\juggling-seal_delapouite.webp`;
      } else if (type.endsWith("_gull")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\finch_delapouite.webp`;
      } else if (type.endsWith("_lion")) {
        iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\lion_lorc.webp`;
      } else if (group === "monster") {
        iconPath =
          "/ui/dynamic_texpack/all_icon_res/map_icon/small_map_icon/map_icon_s_littlemonster.png";
        iconProps.circle = true;
      } else if (group === "boss") {
        iconPath =
          "/ui/dynamic_texpack/all_icon_res/map_icon/big_map_icon/map_icon_boss.png";
        iconProps.circle = true;
      } else if (group === "animal") {
        iconPath =
          "/ui/dynamic_texpack/all_icon_res/map_icon/small_map_icon/map_icon_enemy.png";
        iconProps.circle = true;
      } else {
        continue;
      }
    }
    if (typeIDs[typeId] && typeIDs[typeId] !== type) {
      console.warn(
        `Type ID already exists for ${typeId}. ${typeIDs[typeId]} !== ${type}`,
      );
    }
    typeIDs[typeId] = type;

    enDict[type] = title;
    if (desc) {
      enDict[type + "_desc"] = desc;
    }

    if (!newTypes.includes(type)) {
      newTypes.push(type);
      const icon = await saveIcon(iconPath, type, iconProps);
      if (!filters.some((f) => f.group === group)) {
        filters.push({
          group,
          values: [],
          defaultOn: true,
          defaultOpen: false,
        });
      }
      const filter = filters.find((f) => f.group === group)!;
      filter.values.push({
        id: type,
        icon,
        size,
      });
      if (
        !nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)
      ) {
        nodes.push({
          type,
          spawns: [],
          mapName: DEFAULT_SCENARIO,
        });
      }
    }
  } catch (e) {
    console.error("Error for", baseNPC.unit_id, e);
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

    const spawn: Node["spawns"][0] = {
      p: [nodeData.pos3[2], nodeData.pos3[0], nodeData.pos3[1]],
    };

    let initialGroup = nodeData.model_path.split("/")[1];
    initialType =
      nodeData.model_path.split("/").at(-1)?.split(".")[0] ??
      nodeData.model_path.split("\\").at(-1)?.split(".")[0] ??
      nodeData.model_path;
    spawn.id = nodeData.unit_id;

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
      } else {
        console.warn("No icon path for", group);
        continue;
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
          defaultOpen: false,
        });
      }
      const filter = filters.find((f) => f.group === group)!;
      filter.values.push({
        id: type,
        icon,
        size,
      });
    }

    if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
      nodes.push({
        type,
        spawns: [],
        mapName: DEFAULT_SCENARIO,
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

console.log("New types", newTypes.length);

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

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  // typeIDs["m_spider_box.gim"] = type;
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

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find(
    (n) => n.type === type && n.mapName === DEFAULT_SCENARIO,
  )!;
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

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find(
    (n) => n.type === type && n.mapName === DEFAULT_SCENARIO,
  )!;
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

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find(
    (n) => n.type === type && n.mapName === DEFAULT_SCENARIO,
  )!;
  node.spawns = [];

  for (const [key, value] of Object.entries(interactResData)) {
    if (value.res_name === "Storage Crate") {
      typeIDs[key] = type;
    }
  }
}
// Treasure Chest
{
  const group = "items";
  const type = "treasure_chest";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    type,
    {
      color: "#746cd7",
      circle: true,
    },
  );

  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    // autoDiscover: true,
  });
  enDict[type] = "Treasure Chest";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find(
    (n) => n.type === type && n.mapName === DEFAULT_SCENARIO,
  )!;
  node.spawns = [];

  for (const [key, value] of Object.entries(interactResData)) {
    if (value.res_name === "Treasure Chest") {
      typeIDs[key] = type;
    }
  }
}

const allModelPaths: string[] = [];
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
  let autoDiscover = false;
  let defaultOn: boolean | undefined;
  const iconProps: IconProps = {};
  typeIDs[key] = type;

  if (value.res_name.endsWith(" Recipe")) {
    group = "recipes";
    iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\full-folder_delapouite.webp`;
    iconProps.color = uniqolor(key, {
      lightness: [70, 80],
    }).color;
    iconProps.circle = true;
    size = 0.76;
  } else if (value.res_name === "Fruit & Veggies") {
    group = "items";
    iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\fruit-bowl_skoll.webp`;
    size = 0.76;
    defaultOn = false;
  } else if (
    value.res_name === "Medkit" ||
    value.res_name === "Emergency Medkit"
  ) {
    group = "items";
    iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\medical-pack_sbed.webp`;
    size = 0.76;
  } else if (value.res_name === "Car Trunk") {
    group = "items";
    iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\city-car_delapouite.webp`;
    size = 0.76;
    defaultOn = false;
    // autoDiscover = true;
  } else if (value.res_name === "Vending Machine") {
    group = "items";
    iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\vending-machine_delapouite.webp`;
    size = 0.76;
    // autoDiscover = true;
    defaultOn = false;
  } else if (value.res_name === "Vending Machine") {
    group = "items";
    iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\vending-machine_delapouite.webp`;
    size = 0.76;
    // autoDiscover = true;
    defaultOn = false;
  } else if (value.res_name === "Long Table" || value.res_name === "Table") {
    group = "items";
    iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\table_delapouite.webp`;
    size = 0.76;
    // autoDiscover = true;
    defaultOn = false;
  } else {
    group = "items";
    iconPath =
      "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png";
    iconProps.color = uniqolor(key, {
      lightness: [70, 80],
    }).color;
    iconProps.circle = true;
    defaultOn = false;
    continue; // Temporary
  }

  const icon = await saveIcon(iconPath, type, iconProps);

  const filter = filters.find((f) => f.group === group)!;
  if (!filter.values.some((v) => v.id === type)) {
    filter.values.push({
      id: type,
      icon,
      size,
      autoDiscover,
      defaultOn,
    });
    enDict[type] = value.res_name;
    const modelPaths = Object.values(collectNewTagData).filter((entry) =>
      entry.model_path1?.endsWith(key),
    );
    allModelPaths.push(...modelPaths.map((entry) => entry.model_path1!));
    const itemNames = [
      ...new Set(
        modelPaths.flatMap((entry) => {
          const drops = Object.entries(entry)
            .filter(([key]) => key.startsWith("drops"))
            .flatMap((entry) => entry[1] as number[]);

          const dropNormalData = drops
            .flatMap((drop) =>
              Object.entries(giftDropNormalDataClient)
                .filter(([key]) => key.startsWith(drop.toString()))
                .map((entry) => entry[1]),
            )
            .filter((drop) => drop);
          const itemIds = [
            ...new Set(dropNormalData.flatMap((drop) => drop.item_no_lst)),
          ];
          const items = itemIds
            .map((id) => itemData[id])
            .filter((item) => item);
          return items.map((item) => item.name);
        }),
      ),
    ];
    if (itemNames.length) {
      // enDict[`${type}_desc`] =
      //   `<b>Drop Items</b><p>${itemNames.sort().join("<br>")}</p>`; // Temporary
    }
  }
  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }
  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
}
// console.log(allModelPaths);
// Mystical Crate
{
  const group = "items";
  const type = "mystical_crate";

  const icon = await saveIcon(
    String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\locked-box_delapouite.webp`,
    type,
    {
      color: "#f2be59",
    },
  );

  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    autoDiscover: false,
  });
  enDict[type] = "Mystical Crate";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["invisible_treasure_01.gim"] = type;
  typeIDs["invisible_treasure_02.gim"] = type;
  typeIDs["invisible_treasure_03.gim"] = type;
  typeIDs["invisible_treasure_04.gim"] = type;
}
{
  const group = "gatherables";
  const type = "copper_ore";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon_new/icon_copper_ore_new.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    defaultOn: false,
  });
  enDict[type] = "Copper Ore";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["cu_l_01.gim"] = type;
}
{
  const group = "gatherables";
  const type = "silver_ore";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon_new/icon_sliver_ore_new.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    defaultOn: false,
  });
  enDict[type] = "Silver Ore";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["sn_l_01.gim"] = type;
}
{
  const group = "gatherables";
  const type = "gold_ore";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon_new/icon_gold_ore_new.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
  });
  enDict[type] = "Gold Ore";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["mine_gold_01.gim"] = type;
  typeIDs["au_l_01.gim"] = type;
}
{
  const group = "gatherables";
  const type = "stardust_ore";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon/icon_crystal_patagium.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
  });
  enDict[type] = "Stardust Ore";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["sd_l_01.gim"] = type;
}
{
  const group = "gatherables";
  const type = "tungsten_ore";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon_new/icon_tungsten_ore_new.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    defaultOn: false,
  });
  enDict[type] = "Tungsten Ore";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["w_l_01.gim"] = type;
}
{
  const group = "gatherables";
  const type = "aluminum_ore";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon_new/icon_aluminum_ore_new.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    defaultOn: false,
  });
  enDict[type] = "Aluminum Ore";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["al_l_01.gim"] = type;
}
{
  const group = "gatherables";
  const type = "iron_ore";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon_new/icon_iron_ore_new.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    defaultOn: false,
  });
  enDict[type] = "Iron Ore";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["fe_s_01.gim"] = type;
  typeIDs["fe_m_01.gim"] = type;
  typeIDs["fe_l_01.gim"] = type;
}
{
  const group = "gatherables";
  const type = "tin_ore";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon_new/icon_stannum_ore_new.png.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    defaultOn: false,
  });
  enDict[type] = "Tin Ore";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["ag_l_01.gim"] = type;
}
{
  const group = "gatherables";
  const type = "sulfur";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon_new/icon_sulfur_ore_new.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    defaultOn: false,
  });
  enDict[type] = "Sulfur";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["s_s_01.gim"] = type;
  typeIDs["s_m_01.gim"] = type;
  typeIDs["s_l_01.gim"] = type;
}
{
  const group = "gatherables";
  const type = "seaweed_rock";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon_new/icon_kelp_new.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    defaultOn: false,
  });
  enDict[type] = "Seaweed Rock";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["mossy_l_01.gim"] = type;
}
{
  const group = "gatherables";
  const type = "shell_rock";
  const icon = await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/item_icon_new/icon_kelp_new.png",
    type,
  );
  const filter = filters.find((f) => f.group === group)!;
  filter.values.push({
    id: type,
    icon,
    size: 1,
    defaultOn: false,
  });
  enDict[type] = "Shell Rock";

  if (!nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)) {
    nodes.push({
      type,
      spawns: [],
      mapName: DEFAULT_SCENARIO,
    });
  }

  const node = nodes.find((n) => n.type === type)!;
  node.spawns = [];
  typeIDs["conch_l_01.gim"] = type;
}
{
  const previousNodes = await readJSON<Node[]>(
    OUTPUT_DIR + "/coordinates/nodes.json",
  );
  for (const node of previousNodes) {
    if (
      !Object.values(typeIDs).includes(node.type) &&
      node.type !== "morphic_crate"
    ) {
      continue;
    }
    let prevNode = nodes.find(
      (n) => n.type === node.type && n.mapName === node.mapName,
    );
    if (!prevNode) {
      nodes.push({
        type: node.type,
        spawns: [],
        mapName: node.mapName,
      });
      prevNode = nodes.find(
        (n) => n.type === node.type && n.mapName === node.mapName,
      )!;
    }
    prevNode.spawns = node.spawns;
  }
}

const sortPriority = [
  "items",
  "recipes",
  "gatherables",
  "plants",
  "deviations",
  "locations",
  "riddles",
  "boss",
  "monster",
  "animal",
  "notes",
];

const items = filters.find((f) => f.group === "items")!;
const recipes = filters.find((f) => f.group === "recipes")!;

{
  const group = "notes";
  const filter = filters.find((f) => f.group === group)!;
  enDict[group] = "Collectable Notes";

  for (const [key, value] of Object.entries(collectNewTagData)) {
    if (key.startsWith("collectable_notes_")) {
      const typeId = value.model_path1.split("/").at(-1);
      if (!typeId) {
        console.warn("No type for", key);
        continue;
      }
      const type = typeId.replace(".gim", "");
      typeIDs[typeId] = type;

      if (!newTypes.includes(type)) {
        enDict[type] = capitalizeWords(type.replaceAll("_", " "));
        newTypes.push(type);
        const icon = await saveIcon(
          String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\open-book_lorc.webp`,
          type,
          {
            color: uniqolor(type, {
              lightness: [70, 80],
            }).color,
          },
        );
        filter.values.push({
          id: type,
          icon,
          size: 1,
        });
        if (
          !nodes.some((n) => n.type === type && n.mapName === DEFAULT_SCENARIO)
        ) {
          nodes.push({
            type: type,
            spawns: [],
            mapName: DEFAULT_SCENARIO,
            static: true,
          });
        }
      }
    }
  }
}

const filteredNodes = nodes
  .map((n) => {
    const isStatic =
      items.values.some((v) => v.id === n.type) ||
      recipes.values.some((v) => v.id === n.type);

    let id = typeIDs[n.type];
    const isItem = items.values.some((v) => v.id === id);

    // let minDistance;
    // if (n.mapName === "raid") {
    //   minDistance = isItem ? 1 : 3;
    // } else {
    //   minDistance = isItem ? 5 : 75;
    // }

    const targetSpawnNodes = n.spawns.filter((s, i) => {
      // if (n.mapName !== "raid") {
      //   const isNotOnWorldMap =
      //     s.p[0] < -8100 ||
      //     s.p[0] > 3050 ||
      //     s.p[1] > 8200 ||
      //     s.p[1] < -2000 ||
      //     (s.p[0] > -600 && s.p[1] < 600);
      //   if (isNotOnWorldMap) {
      //     return false;
      //   }
      // }
      // const isCloseToOtherSpawn = n.spawns.slice(i + 1).some((other) => {
      //   const distance = Math.sqrt(
      //     (other.p[0] - s.p[0]) ** 2 + (other.p[1] - s.p[1]) ** 2,
      //   );
      //   return distance < minDistance;
      // });
      // if (isCloseToOtherSpawn) {
      //   return false;
      // }
      return true;
    });
    //console.log(targetSpawnNodes.length, n.spawns.length);

    return {
      ...n,
      static: !Object.values(typeIDs).includes(n.type) || isStatic,
      spawns: targetSpawnNodes,
    };
  })
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
  enDict["name"] = "Name";
  enDict["durability"] = "Durability";
  enDict["quality"] = "Quality";
  enDict["weight"] = "Weight";

  for (const [key, item] of Object.entries(itemData)) {
    if (item.item_type_name !== "Weapon") {
      continue;
    }
    if (item.name.startsWith("#t")) {
      continue;
    }
    const type = "weapon";
    if (!database.some((i) => i.type === type)) {
      database.push({
        type,
        items: [],
      });
    }
    const items = database.find((i) => i.type === type)!;

    const iconPath =
      "ui/dynamic_texpack/" + textureMap[item.icon] + "/" + item.icon;
    const id = "weapon_" + key;
    if (
      items.items.some(
        (i) =>
          i.props.name === item.name &&
          i.props.durability === item.durability &&
          i.props.quality === item.quality &&
          i.props.weight === item.weight,
      )
    ) {
      continue;
    }
    items.items.push({
      id,
      icon: await saveIcon(iconPath, id, {
        noResize: true,
      }),
      props: {
        name: item.name,
        durability: item.durability,
        quality: item.quality,
        weight: item.weight,
      },
    });
  }
}
{
  const bigWorldCollectableNotesData =
    await readJSON<BigWorldCollectableNotesData>(
      CONTENT_DIR + "/client_data/big_world_collectable_notes_data.json",
    );

  const bookCollectSeriesData = await readJSON<BookCollectSeriesData>(
    CONTENT_DIR + "/game_common/data/book_collect_series_data.json",
  );
  const bookCollectAreaEnterClientData =
    await readJSON<BookCollectAreaEnterClientData>(
      CONTENT_DIR + "/client_data/book_collect_area_enter_client_data.json",
    );
  const LOCATIONS_BY_NAME: Record<string, [number, number]> = {
    "A Securement Mission": [5639, -4621],
    "A Promising Start": [3966, -6348],
    "Temporary Notice": [6594, -3393],
    "Star-0427": [7151, -2590],
    Targetless: [298, -7148],
    "Is a Symbiosis Possible?": [2996, -6646],
    "Denise Cooper's Journal": [6580, -6954],
    "Expedition Memo": [4635, -3035],
    "Unfamiliar Homeland": [2236, -4931],
    Roadblock: [1244, -4990],
    "Rogue Brother": [6250, -2536],
    "Choosing to Leave": [6301, -2500],
    "Steady Flow": [5036, -4862],
    "Caged Bird": [6061, -6154],
    Gravestone: [5567, -6304],
    "So Much Has Changed": [5661, -6332],
    "Covert Operation": [3989, -5707],
    "Over the Threshold": [7350, -4729],
    "A New Start": [7092, -4564],
    "The Rise of Bloodbeak": [5516, -4786],
    "Everything Going Wrong": [6021, -4524],
  };

  for (const [collectionId, seriesIds] of Object.entries(
    bookCollectSeriesData.extra_info.super_no2series_no_map,
  )) {
    if (!collectionId.startsWith("area_")) {
      continue;
    }
    const area = bookCollectAreaEnterClientData[collectionId];
    if (!area) {
      console.warn("No area for", collectionId);
      continue;
    }
    const baseType = "regional_records_";
    const name = area.area_name;
    const type =
      baseType +
      name
        .replaceAll(" ", "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();
    enDict[type] = name;
    if (!database.some((i) => i.type === type)) {
      database.push({
        type,
        items: [],
      });
    }
    const items = database.find((i) => i.type === type)!;

    for (const seriesId of seriesIds) {
      const seriesData = bookCollectSeriesData[seriesId];
      const bookIds =
        bigWorldCollectableNotesData.extra_info.corr_series_id2text_no_map[
          seriesId
        ];
      if (!bookIds) {
        console.warn("No book ids for", collectionId);
        continue;
      }
      for (const bookId of bookIds) {
        const book = bigWorldCollectableNotesData[bookId];
        const item: (typeof database)[number]["items"][number] = {
          id: bookId,
          props: {
            title: book.title,
            subtitle: seriesData.series_name,
            title1: book.title1,
            title2: book.title2,
            title3: book.title3,
            content: book.content_lst.join("\n\n"),
            location: LOCATIONS_BY_NAME[book.title],
            // sortPriority: book.sort_priority,
          },
        };

        items.items.push(item);
      }
    }
  }

  for (const [seriesId, bookIds] of Object.entries(
    bigWorldCollectableNotesData.extra_info.corr_series_id2text_no_map,
  )) {
    const seriesData = bookCollectSeriesData[seriesId];
    if (!seriesData) {
      console.warn("No series data for", seriesId);
      continue;
    }

    let type;
    let name;
    let baseType;
    if (seriesData.corr_super_no.startsWith("area_")) {
      continue;
    } else if (seriesData.corr_super_no === "collection_1") {
      baseType = "echoes_of_stardust_";
      name = seriesData.series_name
        .replace(/<[^>]*>/g, "")
        .replaceAll("\b", "")
        .trim();
      type =
        baseType +
        name
          .replaceAll(" ", "_")
          .replace(/[^a-zA-Z0-9_]/g, "")
          .toLowerCase();
    } else if (
      seriesData.corr_super_no === "collection_3" ||
      seriesData.corr_super_no === "colleciton_3"
    ) {
      baseType = "remnants_";
      name = seriesData.series_name
        .replace(/<[^>]*>/g, "")
        .replaceAll("\b", "")
        .trim();
      type =
        baseType +
        name
          .replaceAll(" ", "_")
          .replace(/[^a-zA-Z0-9_]/g, "")
          .toLowerCase();
    } else {
      console.warn("Unknown series", seriesData.corr_super_no);
      continue;
    }

    enDict[type] = name;
    if (!database.some((i) => i.type === type)) {
      database.push({
        type,
        items: [],
      });
    }
    const items = database.find((i) => i.type === type)!;
    for (const bookId of bookIds) {
      const book = bigWorldCollectableNotesData[bookId];

      const item: (typeof database)[number]["items"][number] = {
        id: bookId,
        props: {
          title: book.title,
          title1: book.title1,
          title2: book.title2,
          title3: book.title3,
          content: book.content_lst.join("\n\n"),
          location: LOCATIONS_BY_NAME[book.title],
          // sortPriority: book.sort_priority,
        },
      };

      items.items.push(item);
    }
  }
}

writeFilters(sortedFilters);
writeDict(enDict, "en");
writeTypesIDs(typeIDs);
writeDatabase(database);

console.log("Done!");
