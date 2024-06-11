import uniqolor from "uniqolor";

import { $ } from "bun";
import {
  readDirRecursive,
  readDirSync,
  readJSON,
  saveImage,
  writeJSON,
} from "./lib/fs.js";
import {
  addCircleToImage,
  addOutlineToImage,
  colorizeImage,
  mergeImages,
  rotateImage,
} from "./lib/image.js";
import {
  DomainConfig,
  GatherablesDataAsset,
  MapCell,
  MapMarkerTypes,
  NPCDataAssets,
  PDAResourcesGatherables,
  PDAResourcesMineables,
  Resource,
} from "./types.js";

const CONTENT_DIR = "/mnt/c/dev/Pax Dei/Extracted/Data";
const TEXTURE_DIR = "/mnt/c/dev/Pax Dei/Extracted/Texture";
const TEMP_DIR =
  "/home/devleon/the-hidden-gaming-lair/services/pax-dei-data/out";
const OUT_DIR = "/home/devleon/the-hidden-gaming-lair/static/pax-dei";

let nodes: {
  type: string;
  spawns: { id?: string; p: [number, number]; mapName: string }[];
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
const savedIcons: string[] = [];
const icons: Record<string, string> = {
  // portal: await saveIcon(
  //   `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/portal_lorc.webp`
  // ),
};

const mapMarkerTypes = readJSON<MapMarkerTypes>(
  CONTENT_DIR + "/PaxDei/Content/_PD/Game/UX/Map/D_MapMarkerTypes.json",
);

const enDict: Record<string, string> = {
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
  mineables: "Mineables",
  Berries: "Berries",
  Flowers: "Flowers",
  HerbsFlowersPotions: "Potions Flowers & Herbs",
  GrassCloth: "Clothes Grass",
  HerbsCooking: "Cooking Herbs",
  Mushrooms_Poisonous: "Poisonous Mushrooms",
  Mushrooms_Cooking: "Cooking Mushrooms",
  Mushrooms_Magic: "Magic Mushrooms",
  // GatherableDebris: "Debris",
  CorruptAnimals: "Corrupt Animals",
  Cult_of_Zeb: "Cult of Zeb",
  LostSouls: "Lost Souls",
  "Named CorruptAnimals": "Named Corrupt Animals",
  "Named Cult_of_Zeb": "Named Cult of Zeb",
  "Named LostSouls": "Named Lost Souls",
};
const locations: (typeof filters)[number] = {
  group: "locations",
  defaultOpen: false,
  defaultOn: true,
  values: [],
};

const mineables: (typeof filters)[number] = {
  group: "mineables",
  defaultOpen: false,
  defaultOn: false,
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

await saveIcon(
  TEXTURE_DIR + "/PaxDei/Content/_PD/Game/UX/Map/T_MapPointer.png",
  { rotate: 90 },
  "player",
  "player",
);

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
    fitBounds: MAP_BOUNDS,
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
          TEXTURE_DIR +
            value.icon_14_79B580D74A39832FAFDC3AA545CFCB48.AssetPathName.replace(
              "/Game",
              "/PaxDei/Content",
            ).split(".")[0] +
            ".png",
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
      if (!nodes.some((n) => n.type === mapCellIcon.icon)) {
        nodes.push({
          type: mapCellIcon.icon,
          spawns: [],
        });
      }
      const typeNodes = nodes.find((n) => n.type === mapCellIcon.icon)!;
      if (
        !typeNodes.spawns.some(
          (s) =>
            s.p[0] === location.y &&
            s.p[1] === location.x &&
            s.mapName === mapName,
        )
      ) {
        typeNodes.spawns.push({
          id: mapCellIcon.entity,
          p: [location.y, location.x],
          mapName,
        });
      }
    }
  }
}

filters.push(locations);
const typesIdMap: Record<string, string> = {};
const gatherablesPaths = readDirRecursive(
  CONTENT_DIR + "/PaxDei/Content/_PD/StaticData/DataAssets/Gatherables",
);
for (const gatherablesPath of gatherablesPaths) {
  const file = readJSON<GatherablesDataAsset>(gatherablesPath);
  const id = file[0].Properties.ResourceName;

  if (file[0].Properties.IsDev) {
    console.log("Skipping IsDev", id);
    continue;
  }
  // if (resources.values.find((r) => r.id === id)) {
  //   console.warn("Duplicate!", id, gatherablesPath);
  //   continue;
  // }
  enDict[id] = localisationEN[file[0].Properties.LocalizationNameKey];
  enDict[`${id}_desc`] =
    localisationEN[file[0].Properties.LocalizationDescriptionKey];
  enDict[`${id}_desc`] +=
    `<br><br><b>Respawn Timer:</b> ${formatTimer(file[0].Properties.RespawnTimer)}`;

  const pdaResource = readJSON<PDAResourcesGatherables>(
    CONTENT_DIR +
      `/PaxDei/Content/_PD/Environment/Nature/Resources/DA_Resources/Gatherables/${file[0].Properties.VisualDataAsset}.json`,
  );
  const category =
    pdaResource[0].Properties.ResourceMesh.AssetPathName.split("/")[6] ??
    "Other";

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
    .Outer!.replace("SM_Clay_3", "SM_Clay");
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
        TEXTURE_DIR +
        "/PaxDei/Content/_PD/Environment/Nature/Resources/Fruit/Red_Apple/T_Red_Apple_INV_state_Icon.png";
    } else if (id === "hops") {
      iconPath =
        TEXTURE_DIR +
        "/PaxDei/Content/_PD/Environment/Props/Economy/CraftingProducts/BreadandDrinkProducts/T_Icon_Hops.png";
    } else {
      console.log("No icon for", id, iconFilenames, resourcePartName);
      iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/berry-bush_delapouite.webp`;
    }
  } else {
    iconPath = (resourceFolder + "/" + iconFilename)
      .replace(CONTENT_DIR, TEXTURE_DIR)
      .replace(".json", ".png");
  }
  let size = 1.15;
  if (category === "locations") {
    size = 2;
  } else if (id.startsWith("onion_")) {
    size = 0.9;
  }
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
  filter.values.push({
    id,
    icon: await saveIcon(iconPath, { outline: true }, id),
    size: size,
  });
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
  enDict[`${id}_desc`] =
    localisationEN[file[0].Properties.LocalizationDescriptionKey];
  enDict[`${id}_desc`] +=
    `<br><br><b>Respawn Timer:</b> ${formatTimer(file[0].Properties.RespawnTimer)}`;

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
  typesIdMap[resource.find((r) => r.Outer)!.Outer!] = id;

  const resourceFolder = resourcePath.split("/").slice(0, -1).join("/");
  const iconFilename = readDirSync(resourceFolder).filter((f) =>
    f.includes("Icon"),
  )[0];
  let iconPath;
  if (!iconFilename) {
    if (id === "gneiss_deposit") {
      iconPath =
        TEXTURE_DIR +
        "/PaxDei/Content/_PD/Environment/Nature/Resources/GatherableDebris/Gneiss/T_Gneiss_02_Icon.png";
    } else if (id === "granite_deposit") {
      iconPath =
        TEXTURE_DIR +
        "/PaxDei/Content/_PD/Environment/Nature/Resources/GatherableDebris/Granite/T_Granite_01_Icon.png";
    } else if (id === "iron_deposit_impure") {
      iconPath =
        TEXTURE_DIR +
        "/PaxDei/Content/_PD/UX/Inventory/Icons/NewIcons/T_UI_item_material_iron_bar.png";
    } else {
      console.log("No icon for", id, mineablesPath);
      iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/ore_faithtoken.webp`;
    }
  } else {
    iconPath = (resourceFolder + "/" + iconFilename)
      .replace(CONTENT_DIR, TEXTURE_DIR)
      .replace(".json", ".png");
  }

  if (mineables.values.some((m) => m.id === id)) {
    continue;
  }
  mineables.values.push({
    id,
    icon: await saveIcon(iconPath, {}, id),
  });
}

const npcsPaths = readDirRecursive(
  CONTENT_DIR + "/PaxDei/Content/_PD/StaticData/NPCs",
);
for (const npcsPath of npcsPaths) {
  const file = readJSON<NPCDataAssets>(npcsPath);
  if (file[0].Type !== "NPCDataAsset") {
    continue;
  }
  let category = npcsPath.split("/").at(-2)!;
  if (category === "CNameds" || category === "Nameds") {
    category = "Named " + npcsPath.split("/").at(-3)!;
  }

  const id = file[0].Name;

  if (file[0].Properties.display_name.LocalizedString.includes("DEV")) {
    continue;
  }
  enDict[id] = file[0].Properties.display_name.LocalizedString.replace("a ", "")
    .replace("an ", "")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  if (file[0].Properties.Description) {
    enDict[`${id}_desc`] =
      file[0].Properties.Description.LocalizedString + "<br><br>";
  } else {
    enDict[`${id}_desc`] = "";
  }
  enDict[`${id}_desc`] += `<b>Health:</b> ${file[0].Properties.MaxHealth}`;

  const bpName = file[0].Properties.Blueprint.AssetPathName.split(".").at(-1)!;
  typesIdMap[bpName] = id;

  let iconPath;
  const iconSettings: {
    color?: string;
    outline?: boolean;
  } = {};
  if (id === "PD_NPC_Animal_Badger_T2") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/badger_caro-asercion.webp`;
  } else if (id === "PD_NPC_Animal_Bear_T18") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/bear-face_sparker.webp`;
  } else if (id === "PD_NPC_Animal_Bear_T32") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/bear-head_delapouite.webp`;
  } else if (id === "PD_NPC_Animal_Boar_T3") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/boar_caro-asercion.webp`;
  } else if (id === "PD_NPC_Animal_Boar_T5") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/boar_caro-asercion.webp`;
  } else if (id === "PD_NPC_Animal_Fox_T1") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/fox-head_lorc.webp`;
  } else if (id === "PD_NPC_Animal_Wolf_T10") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/hound_lorc.webp`;
  } else if (id === "PD_NPC_Animal_Rabbit_T1") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/rabbit-head_delapouite.webp`;
  } else if (id === "PD_NPC_Animal_Wolf_T6") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/wolf-head_lorc.webp`;
  } else if (id === "PD_NPC_Cor_Wolf_T42") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/wolf-head_lorc.webp`;
    iconSettings.color = "lightgreen";
  } else if (id === "PD_NPC_Animal_Deer_T2") {
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/deer_caro-asercion.webp`;
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
    console.warn("No icon for", id);
    iconPath = `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/animal-hide_delapouite.webp`;
  }

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
  filter.values.push({
    id,
    icon: await saveIcon(iconPath, {}, id),
  });
}

filters.push(mineables);

const response = await fetch(
  "http://116.203.249.187:3000/nodes?type=spawnNodes",
);
const data = (await response.json()) as Record<
  string,
  [number, number, number, string][]
>;
Object.entries(data).forEach(([type, spawnNodes]) => {
  let id = typesIdMap[type] || type;

  spawnNodes.forEach(([x, y, z, path]) => {
    const mapName = path.split("/")[4];
    const offset = mapName === "gallia_pve_01" ? SMALL : LARGE;

    if (id === "iron_deposit" && mapName === "gallia_pve_01") {
      id = "iron_deposit_pure";
    }
    let oldNodes = nodes.find((n) => n.type === id);
    if (!oldNodes) {
      oldNodes = { type: id, spawns: [] };
      nodes.push(oldNodes);
      oldNodes = nodes.find((n) => n.type === id);
      console.log("New type", id);
    }

    const location = normalizeLocation({ x, y }, offset);
    if (
      oldNodes!.spawns.some(
        (s) =>
          s.p[0] === location.y &&
          s.p[1] === location.x &&
          s.mapName === mapName,
      )
    ) {
      return;
    }
    oldNodes!.spawns.push({
      p: [+location.y.toFixed(0), +location.x.toFixed(0)],
      mapName,
    });
  });
});

nodes = nodes.filter(
  (n) => !["tree_branch", "flint_stones", "gneiss_stones"].includes(n.type),
);
filters = filters
  .filter((n) => n.group !== "GatherableDebris")
  .sort((a, b) => {
    if (a.group === "locations") {
      return -1;
    }
    if (b.group === "locations") {
      return 1;
    }
    return a.group.localeCompare(b.group);
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

const filtersWithNodes: (typeof filters)[number][] = [];
for (const filter of filters) {
  // filter.values = filter.values.filter((v) =>
  //   nodes.some((n) => n.type === v.id)
  // );
  console.log(filter.values.length, filter.group);
  if (filter.values.length > 0) {
    filtersWithNodes.push(filter);
  }
}

writeJSON(TEMP_DIR + "/actors.json", Object.keys(typesIdMap));
writeJSON(OUT_DIR + "/coordinates/tiles.json", tiles);
writeJSON(OUT_DIR + "/coordinates/nodes.json", nodes);
writeJSON(OUT_DIR + "/coordinates/filters.json", filters);
// writeJSON(OUT_DIR + "/coordinates/filters.json", filtersWithNodes);
writeJSON(OUT_DIR + "/coordinates/regions.json", regions);
writeJSON(OUT_DIR + "/coordinates/types_id_map.json", typesIdMap);
writeJSON(OUT_DIR + "/dicts/en.json", enDict);

console.log("Done");

async function saveIcon(
  assetPath: string,
  props: { color?: string; outline?: boolean; rotate?: number } = {},
  name: string = "",
  fileName?: string,
) {
  const targetFileName =
    fileName || assetPath.split("/").at(-1)?.split(".")[0]!;
  const originalID = targetFileName + (props.color ? `_${props.color}` : "");
  let id = originalID;
  let i = 1;
  while (savedIcons.includes(id)) {
    id = originalID + "_" + i++;
  }
  if (props.rotate) {
    const canvas = await rotateImage(assetPath, props.rotate);
    saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
    await $`cwebp ${TEMP_DIR}/${id}.png -o ${OUT_DIR}/icons/${id}.webp -quiet`;
  } else if (props.outline) {
    // console.log("Saving icon", id, assetPath, color);
    const canvas = await addOutlineToImage(assetPath);
    saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
    if (originalID !== id) {
      const randomColor = uniqolor(name).color;
      const canvas = await colorizeImage(TEMP_DIR + `/${id}.png`, randomColor);
      saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
    }
    await $`cwebp ${TEMP_DIR}/${id}.png -o ${OUT_DIR}/icons/${id}.webp -quiet`;
  } else if (props.color) {
    // console.log("Saving icon", id, assetPath, color);
    const canvas = await addCircleToImage(assetPath, props.color);
    saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
    if (originalID !== id) {
      const randomColor = uniqolor(name).color;
      const canvas = await colorizeImage(TEMP_DIR + `/${id}.png`, randomColor);
      saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
    }
    await $`cwebp ${TEMP_DIR}/${id}.png -o ${OUT_DIR}/icons/${id}.webp -quiet`;
  } else if (originalID !== id) {
    const randomColor = uniqolor(name).color;
    const canvas = await colorizeImage(assetPath, randomColor);
    saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
    await $`cwebp ${TEMP_DIR + `/${id}.png`} -o ${OUT_DIR}/icons/${id}.webp -quiet`;
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
