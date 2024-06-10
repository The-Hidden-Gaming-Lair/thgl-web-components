import { $ } from "bun";
import { readDirRecursive, readDirSync, saveImage, writeJSON } from "./lib/fs";
import {
  adjustBrightnessAndContrast,
  addCircleToImage,
  addOutlineToImage,
  mergeImages,
  getRegionsFromImage,
  loadCanvas,
} from "./lib/image";

const CONTENT_DIR = "/mnt/c/dev/OnceHuman/Extracted/Data";
const TEXTURE_DIR = "/mnt/c/dev/OnceHuman/Extracted/Texture";
const TEMP_DIR =
  "/home/devleon/the-hidden-gaming-lair/services/once-human-data/out";
const OUT_DIR = "/home/devleon/the-hidden-gaming-lair/static/once-human";

const nodes: {
  type: string;
  spawns: { id?: string; p: [number, number]; mapName: string }[];
}[] = [];
const filters: {
  group: string;
  defaultOpen?: boolean;
  defaultOn?: boolean;
  values: {
    id: string;
    icon: string;
    size?: number;
    live_only?: boolean;
  }[];
}[] = [];
const tiles: Record<
  string,
  {
    url?: string;
    options?: {
      minNativeZoom: number;
      maxNativeZoom: number;
      bounds: [[number, number], [number, number]];
      tileSize: number;
    };
    minZoom?: number;
    maxZoom?: number;
    fitBounds?: [[number, number], [number, number]];
    transformation?: [number, number, number, number];
  }
> = {};
const savedIcons: string[] = [];
const icons: Record<string, string> = {
  weapon_crate: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "weapon_crate",
    { color: "yellow" },
  ),
  gear_crate: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "gear_crate",
    { color: "green" },
  ),
  storage_crate: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "storage_crate",
    { color: "blue" },
  ),
  morphic_crate: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "morphic_crate",
    { color: "purple" },
  ),
  mystical_chest: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "mystical_chest",
    { color: "red" },
  ),
  treasure_chest: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/planter_icon_cbt2_03.png",
    "treasure_chest",
    { color: "orange" },
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
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_jiaotongshuniu.png",
    "railway",
  ),
  hospital: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_hospital.png",
    "hospital",
  ),
  prime_wars: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/hud_main_ui/hub_interaction_ui/hud_icon_cluster_excitation.png",
    "prime_wars",
  ),
  silvershore_resort: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_gouwuzhongxin.png",
    "silvershore_resort",
  ),
  green_lake_hill: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_guanniaoyingdi.png",
    "green_lake_hill",
  ),
  school: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_school.png",
    "school",
  ),
  factory: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_gongchang.png",
    "factory",
  ),
  hamlet: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_juluo.png",
    "hamlet",
  ),
  lea_research_lab: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_raidlea.png",
    "lea_research_lab",
  ),
  military_base: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_junshijidi.png",
    "military_base",
  ),
  monolith: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_juxie.png",
    "monolith",
  ),
  real_estate: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_zhongzhiyuan.png",
    "real_estate",
  ),
  refinery: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_cistern.png",
    "refinery",
  ),
  research_institute: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_yanjiusuo.png",
    "research_institute",
  ),
  securement_silo: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_securementsilos.png",
    "securement_silo",
  ),
  teleportation_tower: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_transport.png",
    "teleportation_tower",
    { brightness: -100, contrast: 1.3 },
  ),
  town: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_chengzhen.png",
    "town",
  ),
  union_stronghold: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/map_icon/map_icon_zhongliyingdi_kechuansong.png",
    "union_stronghold",
    { brightness: -100, contrast: 1.3 },
  ),
  boss: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/big_map_icon/map_icon_boss.png",
    "boss",
  ),
  elite: await saveIcon(
    TEXTURE_DIR +
      "/ui/dynamic_texpack/all_icon_res/map_icon/big_map_icon/map_icon_elite.png",
    "elite",
  ),
};

const TILE_SIZE = 512;
const ORTHOGRAPHIC_WIDTH = 8200 * 2;

const WIDTH = ORTHOGRAPHIC_WIDTH;

const HALF_WIDTH = WIDTH / 2;
const MAP_BOUNDS = [
  [-HALF_WIDTH, -HALF_WIDTH],
  [HALF_WIDTH, HALF_WIDTH],
] as [[number, number], [number, number]];
const REAL_SIZE = MAP_BOUNDS[1][0] - MAP_BOUNDS[0][0];
const MULTIPLE = REAL_SIZE / TILE_SIZE;
const OFFSET = [-MAP_BOUNDS[0][0] / MULTIPLE, -MAP_BOUNDS[0][1] / MULTIPLE];

const mapName = "default";
const outDir = `${OUT_DIR}/map-tiles/${mapName}`;

if (Bun.env.TILES === "true") {
  try {
    const tilesParts = await readDirSync(
      TEXTURE_DIR + "/ui/texpack/bigmap_res/map/2048/",
    ).map((f) => TEXTURE_DIR + `/ui/texpack/bigmap_res/map/2048/${f}`);
    let canvas = await mergeImages(tilesParts);
    canvas = adjustBrightnessAndContrast(canvas, -40, 1.1);
    const imagePath = TEMP_DIR + "/" + mapName + ".png";
    saveImage(imagePath, canvas.toBuffer("image/png"));

    await $`mkdir -p ${outDir}`;
    await $`vips dzsave ${imagePath} ${outDir} --tile-size ${TILE_SIZE} --background 0 --overlap 0 --layout google`;

    for (const file of readDirRecursive(outDir)) {
      if (file.includes("blank")) {
        await $`rm ${file}`;
        continue;
      }
      if (file.endsWith(".jpg") || file.endsWith(".png")) {
        await $`cwebp ${file} -quiet -o ${file.replace(".jpg", ".webp").replace(".png", ".webp")}`;
        await $`rm ${file}`;
      }
    }
    console.log("Tiles generated for", mapName);
  } catch (e) {
    console.warn("No tiles for", mapName);
    console.error(e);
  }
}

let maxNativeZoom = 3;
try {
  maxNativeZoom = Math.max(...(await readDirSync(outDir).map((f) => +f)));
} catch (e) {}
tiles[mapName] = {
  url: `/map-tiles/${mapName}/{z}/{y}/{x}.webp`,
  options: {
    minNativeZoom: 0,
    maxNativeZoom: maxNativeZoom,
    bounds: MAP_BOUNDS,
    tileSize: TILE_SIZE,
  },
  minZoom: -5,
  maxZoom: 7,
  fitBounds: [
    [2500, -1200],
    [-8200, 8200],
  ],
  transformation: [1 / MULTIPLE, OFFSET[0], -1 / MULTIPLE, OFFSET[1]],
};

// const regions = await getRegionsFromImage(
//   TEXTURE_DIR + "/ui/texpack/bigmap_res/grade_area.png",
//   tiles[mapName].transformation!
// );

writeJSON(OUT_DIR + "/coordinates/tiles.json", tiles);
// writeJSON(OUT_DIR + "/coordinates/nodes.json", nodes);
// writeJSON(OUT_DIR + "/coordinates/filters.json", newFilters);
// writeJSON(OUT_DIR + "/coordinates/regions.json", regions);
// writeJSON(OUT_DIR + "/dicts/en.json", enDict);

console.log("Done");

async function saveIcon(
  assetPath: string,
  outputName: string,
  props: {
    color?: string;
    outline?: boolean;
    contrast?: number;
    brightness?: number;
  } = {},
) {
  const id = outputName;
  if (savedIcons.includes(id)) {
    return `${id}.webp`;
  }
  if (props.outline) {
    // console.log("Saving icon", id, assetPath, color);
    const canvas = await addOutlineToImage(assetPath);
    saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
    await $`cwebp ${TEMP_DIR}/${id}.png -o ${OUT_DIR}/icons/${id}.webp -quiet`;
  } else if (props.color) {
    // console.log("Saving icon", id, assetPath, color);
    const canvas = await addCircleToImage(assetPath, props.color);
    saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
    await $`cwebp ${TEMP_DIR}/${id}.png -o ${OUT_DIR}/icons/${id}.webp -quiet`;
  } else if (
    typeof props.brightness !== "undefined" &&
    typeof props.contrast !== "undefined"
  ) {
    const canvas = await adjustBrightnessAndContrast(
      await loadCanvas(assetPath),
      props.brightness,
      props.contrast,
    );
    saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
    await $`cwebp ${TEMP_DIR}/${id}.png -o ${OUT_DIR}/icons/${id}.webp -quiet`;
  } else {
    // console.log("Saving icon", id, assetPath);
    await $`cwebp ${assetPath} -o ${OUT_DIR}/icons/${id}.webp -quiet`;
  }

  savedIcons.push(id);
  return `${id}.webp`;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function normalizeLocation(
  location: { x: number; y: number },
  {
    OFFSET_X,
    OFFSET_Y,
    CAMERA_ANGLE,
  }: { OFFSET_X: number; OFFSET_Y: number; CAMERA_ANGLE: number },
): { x: number; y: number } {
  const x = location.x - OFFSET_X;
  const y = location.y - OFFSET_Y;
  const angle = toRadians(-CAMERA_ANGLE);
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  const newX = x * cosAngle - y * sinAngle;
  const newY = x * sinAngle + y * cosAngle;
  return { x: newX, y: newY };
}
