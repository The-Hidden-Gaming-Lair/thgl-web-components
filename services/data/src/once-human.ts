import { initDict } from "./lib/dicts.js";
import { initDirs, OUTPUT_DIR, TEMP_DIR, TEXTURE_DIR } from "./lib/dirs.js";
import { initFilters } from "./lib/filters.js";
import { encodeToFile, readDirSync, readJSON, saveImage } from "./lib/fs.js";
import {
  adjustBrightnessAndContrast,
  mergeImages,
  saveIcon,
} from "./lib/image.js";
import { initNodes } from "./lib/nodes.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initTypesIDs } from "./lib/types-ids.js";

initDirs(
  "/mnt/c/dev/OnceHuman/Extracted/Data",
  "/mnt/c/dev/OnceHuman/Extracted/Texture",
  "/home/devleon/the-hidden-gaming-lair/static/once-human",
);

const nodes = initNodes(await readJSON(OUTPUT_DIR + "/coordinates/nodes.json"));
const filters = initFilters();
const typesIDs = initTypesIDs();
const enDict = initDict();
const addedFilterIDs: string[] = [];
const addedIcons: string[] = [];

const savedIcons: string[] = [];
const icons: Record<string, string> = {
  weapon_crate: await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "weapon_crate",
    { color: "yellow", circle: true },
  ),
  gear_crate: await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "gear_crate",
    { color: "green", circle: true },
  ),
  storage_crate: await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "storage_crate",
    { color: "blue", circle: true },
  ),
  morphic_crate: await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "morphic_crate",
    { color: "purple", circle: true },
  ),
  mystical_chest: await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "mystical_chest",
    { color: "red", circle: true },
  ),
  treasure_chest: await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "treasure_chest",
    { color: "orange", circle: true },
  ),
  recipe: await saveIcon(
    "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/notebook_delapouite.webp",
    "recipe",
  ),
  accessory: await saveIcon(
    "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/ink-swirl_lorc.webp",
    "accessory",
  ),
  deviant: await saveIcon(
    "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/lightning-dissipation_lorc.webp",
    "deviant",
  ),
  railway: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_jiaotongshuniu.png",
    "railway",
  ),
  hospital: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_hospital.png",
    "hospital",
  ),
  prime_wars: await saveIcon(
    "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/hud_icon_cluster_excitation.png",
    "prime_wars",
  ),
  silvershore_resort: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_gouwuzhongxin.png",
    "silvershore_resort",
  ),
  green_lake_hill: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_guanniaoyingdi.png",
    "green_lake_hill",
  ),
  school: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_school.png",
    "school",
  ),
  factory: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_gongchang.png",
    "factory",
  ),
  hamlet: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_juluo.png",
    "hamlet",
  ),
  lea_research_lab: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_raidlea.png",
    "lea_research_lab",
  ),
  military_base: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_junshijidi.png",
    "military_base",
  ),
  monolith: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_juxie.png",
    "monolith",
  ),
  real_estate: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_zhongzhiyuan.png",
    "real_estate",
  ),
  refinery: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_cistern.png",
    "refinery",
  ),
  research_institute: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_yanjiusuo.png",
    "research_institute",
  ),
  securement_silo: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_securementsilos.png",
    "securement_silo",
  ),
  teleportation_tower: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_transport.png",
    "teleportation_tower",
    { brightness: -100, contrast: 1.3 },
  ),
  town: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_chengzhen.png",
    "town",
  ),
  union_stronghold: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_zhongliyingdi_kechuansong.png",
    "union_stronghold",
    { brightness: -100, contrast: 1.3 },
  ),
  boss: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/big_map_icon/map_icon_boss.png",
    "boss",
  ),
  elite: await saveIcon(
    "/ui/dynamic_texpack/all_icon_res/map_icon/big_map_icon/map_icon_elite.png",
    "elite",
  ),
};

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
Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    nodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});

// const regions = await getRegionsFromImage(
//   TEXTURE_DIR + "/ui/texpack/bigmap_res/grade_area.png",
//   tiles[mapName].transformation!
// );
