import uniqolor from "uniqolor";

import { $ } from "bun";
import {
  readDirRecursive,
  readDirSync,
  readJSON,
  saveImage,
  writeJSON,
} from "./lib/fs.js";
import { mergeImages, saveIcon } from "./lib/image.js";
import {
  DA_ItemDataAsset,
  PD_Recipes,
  DomainConfig,
  GatherablesDataAsset,
  MapCell,
  MapMarkerTypes,
  NPCDataAssets,
  PDAResourcesGatherables,
  PDAResourcesMineables,
  Resource,
  GlobalFilter,
  PD_Skills,
  PC_Activatable,
  NPCResources,
  RootLevel,
} from "./types.js";
import { initDirs } from "./lib/dirs.js";

const CONTENT_DIR = "/mnt/c/dev/Pax Dei/Extracted/Data";
const TEXTURE_DIR = "/mnt/c/dev/Pax Dei/Extracted/Texture";
const TEMP_DIR =
  "/home/devleon/the-hidden-gaming-lair/services/pax-dei-data/out";
const OUT_DIR = "/home/devleon/the-hidden-gaming-lair/static/pax-dei";
initDirs(CONTENT_DIR, TEXTURE_DIR, OUT_DIR);

const GAME_VERSION = "7/2";
let nodes: {
  type: string;
  static?: boolean;
  mapName: string;
  spawns: {
    id?: string;
    p: [number, number];
    data?: Record<string, string[]>;
  }[];
  data?: Record<string, string[]>;
}[] = readJSON(OUT_DIR + "/coordinates/nodes.json");

let filters: {
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
const regions: {
  id: string;
  center: [number, number];
  border: [number, number][];
  mapName: string;
}[] = [];
const icons: Record<string, string> = {
  // portal: await saveIcon(
  //   `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/portal_lorc.webp`
  // ),
};
const globalFilters: GlobalFilter[] = [
  {
    group: "v",
    values: [
      {
        id: "7/2",
        defaultOn: true,
      },
      {
        id: "6/26",
        defaultOn: true,
      },
    ],
  },
];

const mapMarkerTypes = readJSON<MapMarkerTypes>(
  CONTENT_DIR + "/PaxDei/Content/_PD/Game/UX/Map/D_MapMarkerTypes.json",
);

const enDict: Record<string, string> = {
  v: "Game Version",
  "7/2": "July 2",
  "6/26": "June 26",
  locations: "Locations",
  respawnsite: "Respawn Site",
  ringfort_small: "Ringfort Small",
  minicamp: "Minicamp",
  quarry_small: "Quarry Small",
  holysite: "Holy Site",
  cave: "Cave",
  ringfort: "Ringfort",
  ringfort_large: "Ringfort Large",
  empire: "Empire",
  empire_small: "Empire Small",
  quarry: "Quarry",
  empire_dungeon: "Empire Dungeon",
  stonecircle: "Stone Circle",
  gatewayclosed: "Gateway Closed",
  windmill: "Windmill",
  empire_large: "Empire Large",
  site: "Site",
  gateway: "Gateway",
  mineables: "All Mineables",
  gatherables: "All Gatherables",
  npcs: "All NPCs",
  named: "Named Enemies",
  // Berries: "Berries",
  // Flowers: "Flowers",
  // HerbsFlowersPotions: "Potions, Flowers & Herbs",
  // GrassCloth: "Grass",
  // HerbsCooking: "Cooking Herbs",
  // Mushrooms_Poisonous: "Poisonous Mushrooms",
  // Mushrooms_Cooking: "Cooking Mushrooms",
  // Mushrooms_Magic: "Magic Mushrooms",
  // GatherableDebris: "Debris",
  // CorruptAnimals: "Corrupt Animals",
  // Cult_of_Zeb: "Cult of Zeb",
  // LostSouls: "Lost Souls",
  // "Named CorruptAnimals": "Named Corrupt Animals",
  // "Named Cult_of_Zeb": "Named Cult of Zeb",
  // "Named LostSouls": "Named Lost Souls",
};
const locations: (typeof filters)[number] = {
  group: "locations",
  defaultOpen: false,
  defaultOn: true,
  values: [],
};

const localisationEN = readJSON<Record<string, string>>(
  CONTENT_DIR +
    "/PaxDei/Content/_PD/StaticData/Localisation/localisation_en.json",
);

const TILE_SIZE = 512;

const LARGE = {
  ORTHOGRAPHIC_WIDTH: 1024000 * 1.6,
  OFFSET_X: (1024000 * 1.6) / 2,
  OFFSET_Y: -(1024000 * 0.4) / 2,
  CAMERA_ANGLE: 0,
};

await saveIcon("/PaxDei/Content/_PD/Game/UX/Map/T_MapPointer.png", "player", {
  rotate: 90,
});

const SMALL = {
  ORTHOGRAPHIC_WIDTH: 409600,
  OFFSET_X: 409600 / 2,
  OFFSET_Y: -409600 / 2,
  CAMERA_ANGLE: 0,
};
for (const mapName of readDirSync(
  CONTENT_DIR + "/PaxDei/Content/_PD/StaticData/Domain",
)) {
  if (
    mapName.includes("test") ||
    mapName.includes("qa") ||
    mapName.includes("dungeon") ||
    mapName.includes("flatworld")
  ) {
    continue;
  }
  console.log("Processing", mapName);
  const domainConfig = readJSON<DomainConfig>(
    CONTENT_DIR +
      `/PaxDei/Content/_PD/StaticData/Domain/${mapName}/domain_config.json`,
  );
  enDict[mapName] = `Province of ${domainConfig.label}`;

  const offset = mapName === "gallia_pve_01" ? SMALL : LARGE;

  const WIDTH = offset.ORTHOGRAPHIC_WIDTH;

  const HALF_WIDTH = WIDTH / 2;
  const MAP_BOUNDS = [
    [-HALF_WIDTH, -HALF_WIDTH],
    [HALF_WIDTH, HALF_WIDTH],
  ] as [[number, number], [number, number]];
  const REAL_SIZE = MAP_BOUNDS[1][0] - MAP_BOUNDS[0][0];
  const MULTIPLE = REAL_SIZE / TILE_SIZE;
  const OFFSET = [-MAP_BOUNDS[0][0] / MULTIPLE, -MAP_BOUNDS[0][1] / MULTIPLE];
  const outDir = `${OUT_DIR}/map-tiles/${mapName}`;
  const FIT_BOUNDS =
    mapName === "gallia_pve_01"
      ? MAP_BOUNDS
      : ([
          [MAP_BOUNDS[0][0], MAP_BOUNDS[0][1]],
          [MAP_BOUNDS[1][0] * 0.25, MAP_BOUNDS[1][1] * 0.25],
        ] as [[number, number], [number, number]]);

  if (Bun.env.TILES === "true") {
    try {
      const tilesFilepaths = await readDirSync(
        TEXTURE_DIR + `/PaxDei/Content/_PD/World/${mapName}/Map`,
      );
      const bigTiles = tilesFilepaths
        .filter((f) => f.includes("bigtile"))
        .map(
          (f) => TEXTURE_DIR + `/PaxDei/Content/_PD/World/${mapName}/Map/${f}`,
        );
      const canvas = await mergeImages(bigTiles);
      const imagePath = TEMP_DIR + "/" + mapName + ".png";
      saveImage(imagePath, canvas.toBuffer("image/png"));
      await $`mkdir -p ${outDir}`;
      await $`vips dzsave ${imagePath} ${outDir} --tile-size ${TILE_SIZE} --background 0 --overlap 0 --layout google --suffix .jpg[Q=100]`;

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
      console.error(e);
      console.warn("No tiles for", mapName);
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
    fitBounds: FIT_BOUNDS,
    transformation: [1 / MULTIPLE, OFFSET[0], 1 / MULTIPLE, OFFSET[1]],
  };

  for (const zone of domainConfig.zones) {
    if (zone.priority === 0) {
      continue;
    }
    enDict[zone.name] = zone.label;
    const border: [number, number][] = zone.poly_verts.map((v) => {
      const location = normalizeLocation(v, offset);
      return [location.y, location.x];
    });

    const center = border.reduce(
      (acc, [x, y]) => [acc[0] + x, acc[1] + y],
      [0, 0],
    );
    center[0] /= border.length;
    center[1] /= border.length;

    regions.push({
      id: zone.name,
      center,
      border,
      mapName,
    });
  }

  // for (const portal of domainConfig.portals) {
  //   if (portal.name.includes("Exit")) {
  //     continue;
  //   }
  //   // enDict[portal.name] = portal.label;
  //   const location = normalizeLocation(portal.location, offset);

  //   nodes.push({
  //     type: "portal",
  //     spawns: [
  //       {
  //         p: [location.y, location.x],
  //         mapName,
  //       },
  //     ],
  //   });
  // }

  const mapCellFilenames = await readDirSync(
    CONTENT_DIR + `/PaxDei/Content/_PD/StaticData/Domain/${mapName}`,
  ).filter((f) => f.includes("map_cell"));
  for (const mapCellFilename of mapCellFilenames) {
    const mapCell = readJSON<MapCell>(
      CONTENT_DIR +
        `/PaxDei/Content/_PD/StaticData/Domain/${mapName}/${mapCellFilename}`,
    );
    for (const mapCellIcon of mapCell.icons) {
      if (!mapCellIcon.icon) {
        continue;
      }
      if (!icons[mapCellIcon.icon]) {
        const value = mapMarkerTypes[0].Rows[mapCellIcon.icon];
        icons[mapCellIcon.icon] = await saveIcon(
          value.icon_14_79B580D74A39832FAFDC3AA545CFCB48.AssetPathName.replace(
            "/Game",
            "/PaxDei/Content",
          ).split(".")[0] + ".png",
          mapCellIcon.icon,
        );
        const id = mapCellIcon.icon;
        const size = id === "minicamp" ? 2.5 : 1.5;
        locations.values.push({
          id: id,
          icon: icons[id],
          size: size,
        });
      }
      const location = normalizeLocation(
        { x: mapCellIcon.pos[0], y: mapCellIcon.pos[1] },
        offset,
      );

      enDict[mapCellIcon.entity] = mapCellIcon.name;
      if (
        !nodes.some((n) => n.type === mapCellIcon.icon && n.mapName === mapName)
      ) {
        nodes.push({
          type: mapCellIcon.icon,
          spawns: [],
          mapName,
        });
      }
      const typeNodes = nodes.find(
        (n) => n.type === mapCellIcon.icon && n.mapName === mapName,
      )!;
      if (
        !typeNodes.spawns.some(
          (s) => s.p[0] === location.y && s.p[1] === location.x,
        )
      ) {
        typeNodes.spawns.push({
          id: mapCellIcon.entity,
          p: [location.y, location.x],
        });
      }
    }
  }
}

filters.push(locations);

const typesIdMap: Record<string, string> = {};
// const daItems = readDirRecursive(
//   CONTENT_DIR + "/PaxDei/Content/_PD/Game/DA_Items",
// ).map((p) => readJSON<DA_Item>(p));
const pdItems = readDirRecursive(
  CONTENT_DIR + "/PaxDei/Content/_PD/StaticData/DataAssets/Items",
).map((p) => readJSON<DA_ItemDataAsset>(p));
const pdRecipes = readDirRecursive(
  CONTENT_DIR + "/PaxDei/Content/_PD/StaticData/DataAssets/Recipes",
).map((p) => readJSON<PD_Recipes>(p));
const pdSkills = readDirRecursive(
  CONTENT_DIR + "/PaxDei/Content/_PD/StaticData/DataAssets/Skills",
).map((p) => readJSON<PD_Skills>(p));
const pdActivatables = readDirRecursive(
  CONTENT_DIR + "/PaxDei/Content/_PD/StaticData/DataAssets/Activatables",
).map((p) => readJSON<PC_Activatable>(p));

const gatherablesPaths = readDirRecursive(
  CONTENT_DIR + "/PaxDei/Content/_PD/StaticData/DataAssets/Gatherables",
);
const gatherablesFilters: string[] = [];
for (const gatherablesPath of gatherablesPaths) {
  const file = readJSON<GatherablesDataAsset>(gatherablesPath);
  const id = file[0].Properties.ResourceName;
  if (file[0].Properties.IsDev) {
    // console.log("Skipping IsDev", id);
    continue;
  }

  enDict[id] = localisationEN[file[0].Properties.LocalizationNameKey];
  enDict[`${id}_desc`] = "";

  let type = id
    .replace("herb_", "")
    .replace("flower_", "")
    .replace("fruit_", "")
    .replace("grass_", "");
  if (
    (type.includes("mushroom") || type.includes("berry")) &&
    type.endsWith("s") &&
    !type.endsWith("is")
  ) {
    if (type.endsWith("ies")) {
      type = type.slice(0, -3) + "y";
    } else {
      type = type.slice(0, -1);
    }
  }

  const skills: string[] = [];

  for (const pdItem of pdItems.filter(
    (i) => i[0].Name.endsWith(`_${type}`) || i[0].Name.includes(`_${type}_`),
  )) {
    for (const pdRecipe of pdRecipes.filter((r) =>
      r[0].Properties.ItemIngredients?.some((i) =>
        i.Key.includes(pdItem[0].Name),
      ),
    )) {
      if (pdRecipe[0].Properties.IsDev) {
        continue;
      }
      const skill =
        pdRecipe[0].Properties.SkillRequired.ObjectName.split("'")[1];
      if (skills.includes(skill)) {
        continue;
      }
      skills.push(skill);

      const pdSkill = pdSkills.find((s) => s[0].Name === skill)!;
      enDict[skill] = localisationEN[pdSkill[0].Properties.LocalizationNameKey];
      enDict[`${id}_desc`] +=
        `<p><span style="color:${uniqolor(enDict[skill]).color}">${enDict[skill]}</span> (${localisationEN[pdItem[0].Properties.LocalizationNameKey]})</p>`;
      // enDict[`${id}_desc`] += `<p>Example Recipe: ${pdRecipe[0].Name}</p>`;
    }
  }
  const activables = pdActivatables.filter(
    (i) => i[0].Name.endsWith(`_${type}`) || i[0].Name.includes(`_${type}_`),
  );
  if (activables.length > 0) {
    skills.push("consumable");
    enDict[`${id}_desc`] +=
      `<p><span style="color:${uniqolor(enDict.consumable).color}">${enDict.consumable}</span> (${localisationEN[activables[0][0].Properties.LocalizationNameKey]})</p>`;
  }

  enDict[`${id}_desc`] +=
    `<p>Respawn Timer: ${formatTimer(file[0].Properties.RespawnTimer)}</p>`;
  enDict[`${id}_desc`] +=
    `<p>Spawn Range: ${file[0].Properties.SpawnRadius / 100}m</p>`;
  enDict[`${id}_desc`] += `<p>Spawn Count: ${file[0].Properties.Instances}</p>`;
  // enDict[`${id}_desc`] +=
  //   `<p>${localisationEN[file[0].Properties.LocalizationDescriptionKey]}</p>`;
  if (skills.length === 0) {
    skills.push("others");
  }

  nodes
    .filter((n) => n.type === id)
    .forEach((n) => {
      n.data = { skills: [...new Set(skills)] };
    });

  const pdaResource = readJSON<PDAResourcesGatherables>(
    CONTENT_DIR +
      `/PaxDei/Content/_PD/Environment/Nature/Resources/DA_Resources/Gatherables/${file[0].Properties.VisualDataAsset}.json`,
  );

  // if (
  //   pdaResource[0].Properties.ResourceMesh.AssetPathName.includes(
  //     "GatherableDebris",
  //   )
  // ) {
  //   continue;
  // }

  const resourcePath =
    CONTENT_DIR +
    pdaResource[0].Properties.ResourceMesh.AssetPathName.replace(
      "/Game",
      "/PaxDei/Content",
    ).split(".")[0] +
    ".json";
  if (resourcePath.includes("Experimental")) {
    continue;
  }
  const resource = readJSON<Resource>(resourcePath);
  const typeId = resource
    .find((r) => r.Outer)!
    .Outer!.replace("SM_Clay_3", "SM_Clay")
    .replace("SM_Chanterelli_11", "SM_Chanterelli");
  if (typesIdMap[typeId] && typesIdMap[typeId] !== id) {
    console.warn("Duplicate Gatherable", typeId, id, typesIdMap[typeId]);
  }
  typesIdMap[typeId] = id;
  const resourcePartName = resourcePath
    .split("/")
    .at(-1)!
    .toLowerCase()
    .replace("sm_", "")
    .replace(".json", "")
    .split("_")
    .at(-1)!;
  const resourceFolder = resourcePath.split("/").slice(0, -1).join("/");
  const iconFilenames = readDirSync(resourceFolder).filter((f) =>
    f.includes("Icon"),
  );

  let iconFilename;
  if (iconFilenames.length === 1) {
    iconFilename = iconFilenames[0];
  } else {
    iconFilename = iconFilenames.find((f) =>
      f.toLowerCase().includes(resourcePartName),
    );
    if (!iconFilename) {
      iconFilename = iconFilenames[0];
    }
  }
  let iconPath;
  if (!iconFilename) {
    if (id === "fruit_apple_red") {
      iconPath =
        "/PaxDei/Content/_PD/Environment/Nature/Resources/Fruit/Red_Apple/T_Red_Apple_INV_state_Icon.png";
    } else if (id === "hops") {
      iconPath =
        "/PaxDei/Content/_PD/Environment/Props/Economy/CraftingProducts/BreadandDrinkProducts/T_Icon_Hops.png";
    } else {
      // console.log("No icon for", id, iconFilenames, resourcePartName);
      iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/berry-bush_delapouite.webp`;
    }
  } else {
    iconPath = (resourceFolder + "/" + iconFilename)
      .replace(CONTENT_DIR, "")
      .replace(".json", ".png");
  }
  let size = 1.15;
  if (id.startsWith("onion_")) {
    size = 0.9;
  }

  const categories = ["gatherables", ...skills];
  for (const category of categories) {
    let filter: (typeof filters)[number];
    if (!filters.find((f) => f.group === category)) {
      filter = {
        group: category,
        defaultOpen: false,
        defaultOn: false,
        values: [],
      };
      filters.push(filter);
      if (!enDict[category]) {
        enDict[category] = category;
      }
      gatherablesFilters.push(category);
    }
    filter = filters.find((f) => f.group === category)!;
    if (!filter.values.some((v) => v.id === id)) {
      filter.values.push({
        id,
        icon: await saveIcon(iconPath, id, {
          glowing: true,
          color: "#fff",
          resize: true,
        }),
        size: size,
      });
    }
  }
}
const mineablesPaths = readDirRecursive(
  CONTENT_DIR + "/PaxDei/Content/_PD/StaticData/DataAssets/Mineables",
);
for (const mineablesPath of mineablesPaths) {
  const file = readJSON<GatherablesDataAsset>(mineablesPath);
  const id = file[0].Properties.ResourceName;

  if (file[0].Properties.IsDev) {
    console.log("Skipping IsDev", id);
    continue;
  }

  enDict[id] = localisationEN[file[0].Properties.LocalizationNameKey];
  enDict[`${id}_desc`] = "";

  let type = id.replace("_deposit", "");

  const skills: string[] = [];
  for (const pdItem of pdItems.filter(
    (i) => i[0].Name.endsWith(`_${type}`) || i[0].Name.includes(`_${type}_`),
  )) {
    for (const pdRecipe of pdRecipes.filter((r) =>
      r[0].Properties.ItemIngredients?.some((i) =>
        i.Key.includes(pdItem[0].Name),
      ),
    )) {
      if (pdRecipe[0].Properties.IsDev) {
        continue;
      }
      const skill =
        pdRecipe[0].Properties.SkillRequired.ObjectName.split("'")[1];
      if (skills.includes(skill)) {
        continue;
      }
      skills.push(skill);

      const pdSkill = pdSkills.find((s) => s[0].Name === skill)!;
      enDict[skill] = localisationEN[pdSkill[0].Properties.LocalizationNameKey];
      enDict[`${id}_desc`] +=
        `<p><span style="color:${uniqolor(enDict[skill]).color}">${enDict[skill]}</span> (${localisationEN[pdItem[0].Properties.LocalizationNameKey]})</p>`;
      // enDict[`${id}_desc`] += `<p>Example Recipe: ${pdRecipe[0].Name}</p>`;
    }
  }

  enDict[`${id}_desc`] +=
    `<p>Respawn Timer: ${formatTimer(file[0].Properties.RespawnTimer)}</p>`;
  enDict[`${id}_desc`] +=
    `<p>Spawn Range: ${file[0].Properties.SpawnRadius / 100}m</p>`;
  enDict[`${id}_desc`] += `<p>Spawn Count: ${file[0].Properties.Instances}</p>`;
  // enDict[`${id}_desc`] +=
  //   localisationEN[file[0].Properties.LocalizationDescriptionKey];
  if (skills.length === 0) {
    skills.push("others");
  }

  nodes
    .filter((n) => n.type === id)
    .forEach((n) => {
      n.data = { skills: [...new Set(skills)] };
    });

  const pdaResource = readJSON<PDAResourcesMineables>(
    CONTENT_DIR +
      `/PaxDei/Content/_PD/Environment/Nature/Resources/DA_Resources/Mineables/${file[0].Properties.VisualDataAsset}.json`,
  );
  const resourcePath =
    CONTENT_DIR +
    pdaResource[0].Properties.ResourceMesh.AssetPathName.replace(
      "/Game",
      "/PaxDei/Content",
    ).split(".")[0] +
    ".json";
  const resource = readJSON<Resource>(resourcePath);
  const typeId = resource.find((r) => r.Outer)!.Outer!;
  if (typesIdMap[typeId] && typesIdMap[typeId] !== id) {
    console.warn("Duplicate Mineable", typeId, id, typesIdMap[typeId]);
  }

  typesIdMap[typeId] = id;

  const resourceFolder = resourcePath.split("/").slice(0, -1).join("/");
  const iconFilename = readDirSync(resourceFolder).filter((f) =>
    f.includes("Icon"),
  )[0];
  let iconPath;
  if (!iconFilename) {
    if (id === "gneiss_deposit") {
      iconPath =
        "/PaxDei/Content/_PD/Environment/Nature/Resources/GatherableDebris/Gneiss/T_Gneiss_02_Icon.png";
    } else if (id === "granite_deposit") {
      iconPath =
        "/PaxDei/Content/_PD/Environment/Nature/Resources/GatherableDebris/Granite/T_Granite_01_Icon.png";
    } else if (id === "iron_deposit_impure") {
      iconPath =
        "/PaxDei/Content/_PD/UX/Inventory/Icons/NewIcons/T_UI_item_material_iron_bar.png";
    } else {
      // console.log("No icon for", id, mineablesPath);
      iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/ore_faithtoken.webp`;
    }
  } else {
    iconPath = (resourceFolder + "/" + iconFilename)
      .replace(CONTENT_DIR, "")
      .replace(".json", ".png");
  }

  const categories = ["mineables", ...skills];
  for (const category of categories) {
    let filter: (typeof filters)[number];
    if (!filters.find((f) => f.group === category)) {
      filter = {
        group: category,
        defaultOpen: false,
        defaultOn: false,
        values: [],
      };
      filters.push(filter);
      if (!enDict[category]) {
        enDict[category] = category;
      }
      gatherablesFilters.push(category);
    }
    filter = filters.find((f) => f.group === category)!;
    if (!filter.values.some((v) => v.id === id)) {
      filter.values.push({
        id,
        icon: await saveIcon(iconPath, id, {
          color: uniqolor(id).color,
          resize: true,
        }),
      });
    }
  }
}

for (const npcsResourcesPath of readDirRecursive(
  CONTENT_DIR + "/PaxDei/Content/_PD/StaticData/NPCs",
)) {
  const npc = readJSON<NPCDataAssets>(npcsResourcesPath);
  if (npc[0].Type !== "NPCDataAsset") {
    continue;
  }
  const id = npc[0].Name;
  if (!npc) {
    console.log("No NPC for", id);
    continue;
  }

  if (npc[0].Properties.display_name.LocalizedString.includes("DEV")) {
    continue;
  }
  // if (npc[0].Type !== "NPCDataAsset") {
  //   continue;
  // }

  // const id = file[0].Name;

  enDict[id] = npc[0].Properties.display_name.LocalizedString.replace(
    /^a\s/,
    "",
  )
    .replace(/^an\s/, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  enDict[`${id}_desc`] = "";

  const type = id.toLowerCase().split("animal_")[1]?.replace(/_t\d+/, "");
  const skills: string[] = [];
  if (npcsResourcesPath.includes("Nameds")) {
    skills.push("named");
  }
  if (type) {
    for (const pdItem of pdItems.filter(
      (i) => i[0].Name.endsWith(`_${type}`) || i[0].Name.includes(`_${type}_`),
    )) {
      for (const pdRecipe of pdRecipes.filter((r) =>
        r[0].Properties.ItemIngredients?.some((i) =>
          i.Key.includes(pdItem[0].Name),
        ),
      )) {
        if (pdRecipe[0].Properties.IsDev) {
          continue;
        }
        const skill =
          pdRecipe[0].Properties.SkillRequired.ObjectName.split("'")[1];
        if (skills.includes(skill)) {
          continue;
        }
        skills.push(skill);

        const pdSkill = pdSkills.find((s) => s[0].Name === skill)!;
        enDict[skill] =
          localisationEN[pdSkill[0].Properties.LocalizationNameKey];
        enDict[`${id}_desc`] +=
          `<p><span style="color:${uniqolor(enDict[skill]).color}">${enDict[skill]}</span> (${localisationEN[pdItem[0].Properties.LocalizationNameKey]})</p>`;
        // enDict[`${id}_desc`] += `<p>Example Recipe: ${pdRecipe[0].Name}</p>`;
      }
    }
  }

  enDict[`${id}_desc`] += `<p>Health: ${npc[0].Properties.MaxHealth}</p>`;

  if (skills.length === 0) {
    skills.push("others");
  }

  nodes
    .filter((n) => n.type === id)
    .forEach((n) => {
      n.data = { skills: [...new Set(skills)] };
    });

  typesIdMap[id] = id;

  let category = npc[0].Properties.Blueprint.AssetPathName.split("/").at(-2)!;
  let iconPath;
  const iconSettings: {
    color?: string;
    outline?: boolean;
  } = {};
  if (npc[0].Name.includes("_Badger_")) {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/badger_caro-asercion.webp`;
  } else if (npc[0].Name.includes("_Bear_")) {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/bear-face_sparker.webp`;
  } else if (npc[0].Name.includes("_Boar_")) {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/boar_caro-asercion.webp`;
  } else if (npc[0].Name.includes("_Fox_")) {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/fox-head_lorc.webp`;
  } else if (npc[0].Name.includes("_Animal_Wolf_")) {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/hound_lorc.webp`;
  } else if (npc[0].Name.includes("_Wolf_")) {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/wolf-head_lorc.webp`;
  } else if (npc[0].Name.includes("_Rabbit_")) {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/rabbit-head_delapouite.webp`;
  } else if (npc[0].Name.includes("_Deer_")) {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/deer_caro-asercion.webp`;
  } else if (npc[0].Name.includes("_Zeb_")) {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/cultist_lorc.webp`;
  } else if (npc[0].Name.includes("_Inq_")) {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/light-helm_delapouite.webp`;
  } else if (category === "Animals") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/animal-hide_delapouite.webp`;
  } else if (category === "CorruptAnimals") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/animal-hide_delapouite.webp`;
    iconSettings.color = "lightgreen";
  } else if (category === "Cult_of_Zeb") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/cultist_lorc.webp`;
  } else if (category === "Named Cult_of_Zeb") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/cultist_lorc.webp`;
    iconSettings.color = "orange";
  } else if (category === "Demons") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/daemon-skull_lorc.webp`;
  } else if (category === "Named Demons") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/daemon-skull_lorc.webp`;
    iconSettings.color = "orange";
  } else if (category === "Fey") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/fairy_delapouite.webp`;
  } else if (category === "Inquisitors") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/templar-shield_delapouite.webp`;
  } else if (category === "Named Inquisitors") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/templar-shield_delapouite.webp`;
    iconSettings.color = "orange";
  } else if (category === "LostSouls") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/soul-vessel_delapouite.webp`;
  } else if (category === "Named LostSouls") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/soul-vessel_delapouite.webp`;
    iconSettings.color = "orange";
  } else if (category === "Named CorruptAnimals") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/animal-hide_delapouite.webp`;
    iconSettings.color = "orange";
  } else if (category === "Monsters") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/monster-grasp_lorc.webp`;
  } else {
    // console.warn("No icon for", id);
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/animal-hide_delapouite.webp`;
  }
  if (npc[0].Name.includes("_Cor_")) {
    iconSettings.color = "lightgreen";
  }

  const categories = ["npcs", ...skills];
  for (const category of categories) {
    let filter: (typeof filters)[number];
    if (!filters.find((f) => f.group === category)) {
      filter = {
        group: category,
        defaultOpen: false,
        defaultOn: false,
        values: [],
      };
      filters.push(filter);
    }
    filter = filters.find((f) => f.group === category)!;
    if (!filter.values.some((v) => v.id === id)) {
      filter.values.push({
        id,
        icon: await saveIcon(iconPath, id, {
          color: uniqolor(id).color,
        }),
      });
    }
  }
}

// for (const mapName of readDirSync(CONTENT_DIR + "/PaxDei/Content/_PD/World")) {
//   if (mapName !== "gallia_province_02") {
//     continue;
//   }
//   if (!mapName.startsWith("gallia") && !mapName.startsWith("small")) {
//     continue;
//   }
//   console.log("Processing", mapName);
//   for (const folderName of readDirSync(
//     CONTENT_DIR + "/PaxDei/Content/_PD/World/" + mapName,
//   )) {
//     if (
//       !folderName.startsWith("AA_RootLevel_") ||
//       folderName.endsWith("json")
//     ) {
//       continue;
//     }
//     for (const levelName of readDirSync(
//       CONTENT_DIR +
//         "/PaxDei/Content/_PD/World/" +
//         mapName +
//         "/" +
//         folderName +
//         "/_Generated_",
//     )) {

//       const level = readJSON<RootLevel>(
//         CONTENT_DIR +
//           "/PaxDei/Content/_PD/World/" +
//           mapName +
//           "/" +
//           folderName +
//           "/_Generated_/" +
//           levelName,
//       );
//       for (const actor of level) {
//         if (!actor.Properties?.RelativeLocation) {
//           continue;
//         }
//         // if (actor.Type === "BP_NPCSpawnPoint_C") {
//         const offset = mapName === "gallia_pve_01" ? SMALL : LARGE;
//         // const id = actor.Properties!.NPC_DA!.ObjectName.split("'")[1];
//         const id = "flower_loios_tears";
//         // const spawn = level.find(
//         //   (a) => a.Outer === actor.Name && a.Properties?.RelativeLocation,
//         // );
//         // if (!spawn) {
//         //   console.warn(`No spawn for ${id} (${actor.Name})`);
//         //   continue;
//         // }

//         let oldNodes = nodes.find((n) => n.type === id);
//         if (!oldNodes) {
//           oldNodes = { type: id, spawns: [] };
//           nodes.push(oldNodes);
//           oldNodes = nodes.find((n) => n.type === id);
//           console.log("New type", id);
//         }
//         const location = normalizeLocation(
//           {
//             x: actor.Properties!.RelativeLocation!.X,
//             y: actor.Properties!.RelativeLocation!.Y,
//           },
//           offset,
//         );
//         // if (
//         //   oldNodes!.spawns.some(
//         //     (s) =>
//         //       s.p[0] === location.y &&
//         //       s.p[1] === location.x &&
//         //       s.mapName === mapName,
//         //   )
//         // ) {
//         //   continue;
//         // }
//         oldNodes!.spawns.push({
//           p: [+location.y.toFixed(0), +location.x.toFixed(0)],
//           mapName,
//         });
//         // }
//       }
//     }
//   }
// }
if (Bun.env.NODES === "true") {
  const response = await fetch(
    "https://pax-dei-api.th.gl/nodes?type=spawnNodes",
  );
  const data = (await response.json()) as Record<
    string,
    [number, number, number, string][]
  >;
  await fetch("https://pax-dei-api.th.gl/nodes?type=spawnNodes", {
    method: "DELETE",
    headers: {
      Authorization: "thgl",
    },
  });

  const newMapSpawns = Object.values(data).flatMap((spawnNodes) =>
    spawnNodes.map(([x, y, z, path]) => {
      const mapName = path.split("/")[4];
      return [x, y, mapName] as [number, number, string];
    }),
  );
  console.log(`Newly tracked locations: ${newMapSpawns.length}`);

  // Remove old nodes in tracked areas'
  const totalSpawnCount = nodes.reduce((acc, n) => acc + n.spawns.length, 0);
  const isNear = (a: [number, number], b: [number, number]) => {
    const distance = Math.sqrt(
      // Euclidean distance
      Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2),
    );
    return distance < 10000;
  };

  nodes = nodes.map((n) => {
    const isLocation = locations.values.some((v) => v.id === n.type);
    const isNPC = filters
      .find((f) => f.group === "npcs")
      ?.values.some((v) => v.id === n.type)!;

    return {
      ...n,
      spawns: n.spawns.filter((s) => {
        if (isLocation) {
          return true;
        }
        if (isNPC && s.data?.v.includes(GAME_VERSION)) {
          return true;
        }

        const hasSpawnTop = newMapSpawns.find(([y, x, mapName]) => {
          if (n.mapName !== mapName) {
            return false;
          }
          if (s.p[0] > y) {
            return false;
          }
          return isNear(s.p, [y, x]);
        });
        if (!hasSpawnTop) {
          return true;
        }
        const hasSpawnBottom = newMapSpawns.find(([y, x, mapName]) => {
          if (n.mapName !== mapName) {
            return false;
          }
          if (s.p[0] <= y) {
            return false;
          }
          return isNear(s.p, [y, x]);
        });
        if (!hasSpawnBottom) {
          return true;
        }

        const hasSpawnRight = newMapSpawns.find(([y, x, mapName]) => {
          if (n.mapName !== mapName) {
            return false;
          }
          if (s.p[1] > x) {
            return false;
          }
          return isNear(s.p, [y, x]);
        });
        if (!hasSpawnRight) {
          return true;
        }

        const hasSpawnLeft = newMapSpawns.find(([y, x, mapName]) => {
          if (n.mapName !== mapName) {
            return false;
          }
          if (s.p[1] <= x) {
            return false;
          }
          return isNear(s.p, [y, x]);
        });
        if (!hasSpawnLeft) {
          return true;
        }

        return false;
      }),
    };
  });
  const newTotalSpawnCount = nodes.reduce((acc, n) => acc + n.spawns.length, 0);
  console.log(
    `Removed ${totalSpawnCount - newTotalSpawnCount} deprecated locations spawns in tracked areas`,
  );

  // Add new nodes
  Object.entries(data).forEach(([type, spawnNodes]) => {
    let id = typesIdMap[type];
    if (!typesIdMap[type]) {
      console.warn("No type for", type);
      return;
      // id = type;
    }

    spawnNodes.forEach(([x, y, z, path]) => {
      const mapName = path.split("/")[4];
      // const offset = mapName === "gallia_pve_01" ? SMALL : LARGE;

      if (id === "iron_deposit" && mapName === "gallia_pve_01") {
        id = "iron_deposit_pure";
      }
      let oldNodes = nodes.find((n) => n.type === id && n.mapName === mapName);
      if (!oldNodes) {
        oldNodes = { type: id, spawns: [], mapName };
        nodes.push(oldNodes);
        oldNodes = nodes.find((n) => n.type === id);
        console.log("New type", id);
      }

      if (oldNodes!.spawns.some((s) => s.p[0] === y && s.p[1] === x)) {
        console.log("Already exists", id, x, y, mapName);
        return;
      }
      const location = { x: y, y: x };
      oldNodes!.spawns.push({
        p: [+location.y.toFixed(0), +location.x.toFixed(0)],
        data: { v: [GAME_VERSION] },
      });
    });
  });
}
nodes = nodes.filter(
  (n) => !["tree_branch", "flint_stones", "gneiss_stones"].includes(n.type),
);
const totalSpawnCount = nodes.reduce((acc, n) => acc + n.spawns.length, 0);
console.log(`New total locations of ${totalSpawnCount}`);

const filtersOrder = ["locations", "gatherables", "mineables", "npcs", "named"];
const lastFiltersOrder = ["others"];
filters = filters.sort((a, b) => {
  const aIndex = filtersOrder.indexOf(a.group);
  const bIndex = filtersOrder.indexOf(b.group);

  if (aIndex === -1 && bIndex === -1) {
    const lastAIndex = lastFiltersOrder.indexOf(a.group);
    const lastBIndex = lastFiltersOrder.indexOf(b.group);
    if (lastAIndex !== -1 && lastBIndex !== -1) {
      return lastAIndex - lastBIndex;
    }
    if (lastAIndex !== -1) {
      return 1;
    }
    if (lastBIndex !== -1) {
      return -1;
    }

    return enDict[a.group]?.localeCompare(enDict[b.group]);
  }

  if (aIndex === -1) {
    return 1;
  }
  if (bIndex === -1) {
    return -1;
  }

  return aIndex - bIndex;
});

nodes.forEach((n) => {
  const minDistance = n.type.includes("_NPC_") ? 2000 : 100;

  n.spawns = n.spawns.filter((s1, i, arr) => {
    for (let j = i + 1; j < arr.length; j++) {
      const s2 = arr[j];
      const distance = Math.sqrt(
        Math.pow(s1.p[0] - s2.p[0], 2) + Math.pow(s1.p[1] - s2.p[1], 2),
      );
      if (distance < minDistance) {
        return false;
      }
    }
    return true;
  });
});
nodes = nodes.filter((n) => n.spawns.length > 0);

const filtersWithNodes: (typeof filters)[number][] = [];
for (const filter of filters) {
  filter.values = filter.values.filter((v) =>
    nodes.some((n) => n.type === v.id),
  );
  // console.log(filter.values.length, filter.group);
  if (filter.values.length > 0) {
    filtersWithNodes.push(filter);
  }
}

// nodes = nodes.map((n) => {
//   if (locations.values.some((v) => v.id === n.type)) {
//     return {
//       ...n,
//       static: true,
//       spawns: n.spawns.map(({ data, ...s }) => {
//         return s;
//       }),
//     };
//   }
//   return n;
// });

writeJSON(TEMP_DIR + "/actors.json", Object.keys(typesIdMap));
writeJSON(OUT_DIR + "/coordinates/tiles.json", tiles);
writeJSON(OUT_DIR + "/coordinates/nodes.json", nodes);
// writeJSON(OUT_DIR + "/coordinates/filters.json", filters);
writeJSON(OUT_DIR + "/coordinates/filters.json", filtersWithNodes);
writeJSON(OUT_DIR + "/coordinates/regions.json", regions);
const sortedTypesIdMap = Object.entries(typesIdMap)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .reduce((acc, [k, v]) => {
    acc[k] = v;
    return acc;
  }, {});
writeJSON(OUT_DIR + "/coordinates/types_id_map.json", sortedTypesIdMap);
writeJSON(OUT_DIR + "/coordinates/global-filters.json", globalFilters);
writeJSON(OUT_DIR + "/dicts/en.json", enDict);

console.log("Done");

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

function formatTimer(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsLeft = seconds % 60;
  let result = "";
  if (hours > 0) {
    result += `${hours}h `;
  }
  if (minutes > 0) {
    result += `${minutes}m `;
  }
  if (secondsLeft > 0) {
    result += `${secondsLeft}s`;
  }
  return result.trim();
}
