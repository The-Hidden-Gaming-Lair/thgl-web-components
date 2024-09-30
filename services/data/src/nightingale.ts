import { createCanvas, loadImage } from "@napi-rs/canvas";
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
import { initNodes, writeNodes } from "./lib/nodes.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";
import {
  CDT_BPCreatureData,
  CDT_BPSpawnerData,
  CDT_CreatureUIData,
  DA_Coast,
  ST_Y1S1_Creatures,
} from "./nightingale.types.js";
import { putImageData, rotateCanvas } from "./lib/image.js";

initDirs(
  String.raw`C:\dev\Nightingale\Extracted\Data`,
  String.raw`C:\dev\Nightingale\Extracted\Texture`,
  String.raw`C:\dev\the-hidden-gaming-lair\static\nightingale`,
);

const enDict = initDict({});
const tiles = initTiles();
const filters = initFilters([
  {
    group: "npcs",
    defaultOpen: true,
    defaultOn: true,
    values: [
      {
        id: "puck",
        icon: "puck.webp",
        size: 1.5,
        live_only: true,
      },
    ],
  },
  {
    group: "items",
    defaultOpen: true,
    defaultOn: true,
    values: [
      {
        id: "portal_card_machine",
        icon: "TUI_ico_MapEncounter_Portal.webp",
        size: 1.5,
      },
      {
        id: "chest",
        icon: "TUI_ico_MapPin_Chest.webp",
        size: 1.5,
      },
      {
        id: "death_chest",
        icon: "death_chest.webp",
        size: 1.5,
        live_only: true,
      },
      {
        id: "codex",
        icon: "codex.webp",
        size: 1.5,
      },
      {
        id: "PuzzleMemoryCentre",
        icon: "TUI_ico_MapEncounter_PuzzleGlyph.webp",
        size: 1,
      },
      {
        id: "PuzzleMemory",
        icon: "TUI_ico_MapEncounter_PuzzleMemory.webp",
        size: 1,
      },
    ],
  },
  {
    group: "bosses",
    defaultOpen: false,
    defaultOn: true,
    values: [],
  },
  {
    group: "creatures",
    defaultOpen: false,
    defaultOn: true,
    values: [],
  },
]);
const nodes = initNodes();
const regions = initRegions();
const typesIDs = initTypesIDs({
  BP_PortalCardMachine_Small_C: "portal_card_machine",
  BP_Creature_NPC_Puck_C: "puck",
  BP_Structure_DeathChest_C: "death_chest",
  BP_CodexActor_C: "codex",
  BP_Structure_Functional_Container_NoPlayerDestruct_C: "chest",
  BP_Structure_Functional_Container_C: "chest",
  BP_TargetPoint_PuzzleMemory_Piece_C: "PuzzleMemory",
  BP_TargetPoint_PuzzleMemory_Center_C: "PuzzleMemoryCentre",
});
const globalFilters = initGlobalFilters();

async function createMap(textureFilePath: string, dataFilePath: string) {
  const hillshade = await loadImage(
    textureFilePath + "/MapMasks/map_rock_tree_hillshade.png",
  );

  const dir = textureFilePath.split("/").at(-1);
  const roadPOIWater = await loadImage(
    textureFilePath + "/MapMasks/map_road_poi_water.png",
  );
  const heatmap = await loadImage(textureFilePath + "/MapMasks/map_height.png");

  const width = hillshade.width;
  const height = hillshade.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, hillshade.width, hillshade.height);
  // ctx.drawImage(bg, 0, 0, width, height);
  let coastImageData: ImageData | null = null;
  let padding = 0;
  let offset = 0;
  try {
    const coastInfo = await readJSON<DA_Coast>(
      dataFilePath + `/DA_Coast_${dir}.json`,
    );
    const areaSize = coastInfo[0].Properties.AreaSize.X;
    const coast = await loadImage(
      textureFilePath + `/DA_Coast_${dir}_Ground.png`,
    );
    const coastCanvas = createCanvas(width, height);
    const coastCtx = coastCanvas.getContext("2d");
    if (areaSize === 256000) {
      // coastCtx.drawImage(coast, 0, 0, width, height);
      padding = 150;
      offset = 50;
      coastCtx.drawImage(
        coast,
        offset,
        offset,
        coast.width - offset * 2,
        coast.height - offset * 2,
        0,
        0,
        width,
        height,
      );
    } else {
      padding = 80;
      coastCtx.drawImage(coast, 0, 0, width, height);
      // coastCtx.drawImage(
      //   coast,
      //   10,
      //   10,
      //   coast.width - 20,
      //   coast.height - 20,
      //   0,
      //   0,
      //   width,
      //   height
      // );
    }

    coastImageData = coastCtx.getImageData(0, 0, width, height);
  } catch (e) {
    console.warn("No coast image found for", textureFilePath);
  }

  const hillShadeCanvas = createCanvas(width, height);
  const hillshadeCtx = hillShadeCanvas.getContext("2d");
  hillshadeCtx.drawImage(
    hillshade,
    offset,
    offset,
    width - offset * 2,
    height - offset * 2,
  );

  const roadPOIWaterCanvas = createCanvas(width, height);
  const roadPOIWaterCtx = roadPOIWaterCanvas.getContext("2d");
  roadPOIWaterCtx.drawImage(
    roadPOIWater,
    offset,
    offset,
    width - offset * 2,
    height - offset * 2,
  );

  const heatmapCanvas = createCanvas(width, height);
  const heatmapCtx = heatmapCanvas.getContext("2d");
  heatmapCtx.drawImage(
    heatmap,
    offset,
    offset,
    width - offset * 2,
    height - offset * 2,
  );

  const hillshadeImageData = hillshadeCtx.getImageData(0, 0, width, height);
  const roadPOIWaterImageData = roadPOIWaterCtx.getImageData(
    0,
    0,
    width,
    height,
  );
  const heatmapImageData = heatmapCtx.getImageData(0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor(i / 4 / width);
    const isEdge =
      coastImageData &&
      (x < padding ||
        y < padding ||
        x > width - padding ||
        y > height - padding);

    const isCost = coastImageData && coastImageData.data[i] < 112;
    const isWater = roadPOIWaterImageData.data[i + 2] === 255;
    const isPOI = roadPOIWaterImageData.data[i + 1] === 255;
    const isRoad = roadPOIWaterImageData.data[i + 0] === 255;
    const isRock = hillshadeImageData.data[i] === 255;
    const isTree = hillshadeImageData.data[i + 1] === 255;
    const heightMap = heatmapImageData.data[i];

    if (isEdge || isCost || isWater) {
      pixels[i] = 96;
      pixels[i + 1] = 140;
      pixels[i + 2] = 138;
      pixels[i + 3] = 255;
    } else if (isRoad) {
      pixels[i] = 108;
      pixels[i + 1] = 64;
      pixels[i + 2] = 69;
      pixels[i + 3] = 255;
    } else if (isRock) {
      pixels[i] = 150;
      pixels[i + 1] = 150;
      pixels[i + 2] = 150;
      pixels[i + 3] = hillshadeImageData.data[i + 2];
    } else if (isTree) {
      pixels[i] = 195;
      pixels[i + 1] = 203;
      pixels[i + 2] = 121;
      pixels[i + 3] = hillshadeImageData.data[i + 2];
    } else {
      pixels[i] = 150 + heightMap;
      pixels[i + 1] = 140 + heightMap;
      pixels[i + 2] = 117 + heightMap;
      pixels[i + 3] = 255;
    }
  }

  putImageData(canvas, imageData, 0, 0);
  const rotatedCanvas = rotateCanvas(canvas, -90);

  return rotatedCanvas;
}

const temporals = readDirSync(CONTENT_DIR + "/NWX/Content/NWX/Maps/Temporal");
for (const temporal of temporals) {
  console.log("Temporal", temporal);
  const maps = readDirSync(
    CONTENT_DIR + `/NWX/Content/NWX/Maps/Temporal/${temporal}`,
  );
  for (const map of maps) {
    console.log("Map", map);
    const name = map.split("/").at(-1);
    try {
      const tempPath = TEMP_DIR + "/" + name + ".png";
      if (Bun.argv.includes("--tiles")) {
        const canvas = await createMap(
          TEXTURE_DIR + `/NWX/Content/NWX/Maps/Temporal/${temporal}/${map}`,
          CONTENT_DIR + `/NWX/Content/NWX/Maps/Temporal/${temporal}/${map}`,
        );
        saveImage(tempPath, canvas.toBuffer("image/png"));
      }

      const SIZE_A = 102400 * 2;
      const SIZE_B = 128000 * 2;
      const TILE_SIZE = 512;

      tiles[map] = (await generateTiles(map, tempPath, SIZE_A, TILE_SIZE))[map];
    } catch (e) {
      console.error(`Failed to process ${map} due to ${e}`);
    }
  }
}

const bpSpawnerData = await readJSON<CDT_BPSpawnerData>(
  CONTENT_DIR +
    "/NWX/Content/NWX/Creatures/Wildlife/Data/CDT_BPSpawnerData.json",
);
const spawnerData = bpSpawnerData[0].Rows;

const creatureUIData = await readJSON<CDT_CreatureUIData>(
  CONTENT_DIR +
    "/NWX/Content/NWX/Creatures/Wildlife/Data/CDT_CreatureUIData.json",
);
const creatureUIRows = creatureUIData[0].Rows;

const creatureStrings = await readJSON<ST_Y1S1_Creatures>(
  CONTENT_DIR + "/NWX/Content/NWX/StringTables/Y1S1/ST_Y1S1_Creatures.json",
);
const strings = creatureStrings[0].StringTable.KeysToMetaData;

const files = readDirRecursive(
  CONTENT_DIR + "/NWX/Content/NWX/Creatures",
  ".json",
);

for (const file of files) {
  if (!file.includes("BP_")) {
    continue;
  }
  const bpName = file.split("\\").at(-1)?.replace(".json", "") + "_C";
  // console.log(`Processing ${bpName}`);

  const spawner = Object.entries(spawnerData).find(([, entry]) =>
    entry.Spawning_22_2823F2B64D945B8C7CBE299F4E256506.DefaultCreatureClasses_31_69C2283C4871D391730C1C9D84F6B848.some(
      (d) => d.AssetPathName.endsWith(bpName),
    ),
  );
  if (!spawner) {
    console.warn(`No spawner for ${bpName}`);
    continue;
  }
  const creatureName =
    spawner[1].UIData_32_B2B931744F13DF1E453EAD95FE07B7E4.RowName;

  let uiRowName = creatureName;
  let isBoss = spawner[0].endsWith("Hero");

  const uiRow = creatureUIRows[uiRowName as keyof typeof creatureUIRows];
  if (!uiRow) {
    console.warn(`No UI Row for ${uiRowName}`);
    continue;
  }
  const nameDataKey = Object.keys(uiRow).find((key) =>
    key.startsWith("CreatureName"),
  );
  if (!nameDataKey) {
    console.warn(`No CreatureName for ${uiRowName}`);
    continue;
  }
  const uiItem = uiRow[nameDataKey as keyof typeof uiRow];
  let name;
  if (typeof uiItem !== "object") {
    throw new Error("uiItem is not an object");
  }
  if ("SourceString" in uiItem) {
    name = uiItem.SourceString;
  } else if ("Key" in uiItem) {
    const nameKey = uiItem.Key;
    name = strings[nameKey as keyof typeof strings];
  }
  const iconKey = Object.keys(uiRow).find((key) =>
    key.startsWith("CreatureIcon"),
  );
  const uiRowIcon = uiRow[iconKey as keyof typeof uiRow];
  let icon =
    typeof uiRowIcon === "object" && "AssetPathName" in uiRowIcon
      ? uiRowIcon.AssetPathName.split(".").at(-1)
      : undefined;
  if (!icon) {
    console.warn(`No icon for ${uiRowName}`);
    continue;
  }
  const isNPC = bpName.includes("NPC");
  if (isBoss) {
    icon += "_boss";
  } else if (isNPC && icon.includes("Target")) {
    icon += "_npc";
  }
  icon += ".webp";
  if (name) {
    enDict[creatureName] = name;
  }
  typesIDs[bpName] = creatureName;

  if (isBoss) {
    const filter = filters.find((f) => f.group === "bosses")!;
    filter.values.push({
      id: creatureName,
      icon,
      size: 1.5,
    });
  } else if (isNPC) {
    const filter = filters.find((f) => f.group === "npcs")!;
    filter.values.push({
      id: creatureName,
      icon,
      size: 1,
    });
  } else {
    const filter = filters.find((f) => f.group === "creatures")!;
    filter.values.push({
      id: creatureName,
      icon,
      size: 1,
    });
  }
}

const sortPriority: string[] = [];
const sortedFilters = filters.sort(
  (a, b) => sortPriority.indexOf(a.group) - sortPriority.indexOf(b.group),
);

writeTiles(tiles);
writeFilters(sortedFilters);
writeDict(enDict, "en");
writeNodes(nodes);
Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    nodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});

writeRegions(regions);
writeTypesIDs(typesIDs);
writeGlobalFilters(globalFilters);

console.log("Done");
