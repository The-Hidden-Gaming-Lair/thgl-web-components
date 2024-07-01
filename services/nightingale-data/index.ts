import { $ } from "bun";
import { createMap } from "./lib/image.js";
import {
  readDirRecursive,
  readDirSync,
  readJSON,
  saveImage,
  writeJSON,
} from "./lib/fs.js";
import {
  CDT_BPCreatureData,
  CDT_CreatureUIData,
  ST_Y1S1_Creatures,
} from "./types.js";

const CONTENT_DIR = "/mnt/c/dev/Nightingale/Extracted/Data";
const TEXTURE_DIR = "/mnt/c/dev/Nightingale/Extracted/Texture";
const TEMP_DIR =
  "/home/devleon/the-hidden-gaming-lair/services/nightingale-data/out";
const OUT_DIR = "/home/devleon/the-hidden-gaming-lair/static/nightingale";
const allMaps: string[] = [];
const emptyMaps: string[] = [];

const temporals = readDirSync(
  "/mnt/c/dev/Nightingale/Extracted/Data/NWX/Content/NWX/Maps/Temporal",
);
for (const temporal of temporals) {
  console.log("Temporal", temporal);
  const maps = readDirSync(
    `/mnt/c/dev/Nightingale/Extracted/Data/NWX/Content/NWX/Maps/Temporal/${temporal}`,
  );
  for (const map of maps) {
    console.log("Map", map);
    const name = map.split("/").at(-1);
    try {
      const tempPath = TEMP_DIR + "/" + name + ".png";
      allMaps.push(map);
      if (Bun.env.TILES === "true") {
        const canvas = await createMap(
          TEXTURE_DIR + `/NWX/Content/NWX/Maps/Temporal/${temporal}/${map}`,
          CONTENT_DIR + `/NWX/Content/NWX/Maps/Temporal/${temporal}/${map}`,
        );
        saveImage(tempPath, canvas.toBuffer("image/png"));
        const outDir = `${OUT_DIR}/map-tiles/${map}`;
        await $`vips dzsave ${tempPath} ${outDir} --tile-size 512 --background 0 --overlap 0 --layout google --suffix .jpg[Q=100]`;
        for (const file of readDirRecursive(outDir)) {
          if (file.includes("blank")) {
            await $`rm ${file}`;
            continue;
          }
          if (file.endsWith(".jpg") || file.endsWith(".png")) {
            await $`cwebp ${file} -o ${file.replace(".jpg", ".webp").replace(".png", ".webp")} -quiet`;
            await $`rm ${file}`;
          }
        }
        await $`rm ${tempPath}`;
      }
    } catch (e) {
      console.error(`Failed to process ${map} due to ${e}`);
      emptyMaps.push(map);
    }
  }
}

const creatureData = readJSON<CDT_BPCreatureData>(
  CONTENT_DIR +
    "/NWX/Content/NWX/Creatures/Wildlife/Data/CDT_BPCreatureData.json",
);
const creatures = creatureData[0].Rows;

const creatureUIData = readJSON<CDT_CreatureUIData>(
  CONTENT_DIR +
    "/NWX/Content/NWX/Creatures/Wildlife/Data/CDT_CreatureUIData.json",
);
const creatureUIRows = creatureUIData[0].Rows;

const creatureStrings = readJSON<ST_Y1S1_Creatures>(
  CONTENT_DIR + "/NWX/Content/NWX/StringTables/Y1S1/ST_Y1S1_Creatures.json",
);
const strings = creatureStrings[0].StringTable.KeysToMetaData;

const files = readDirRecursive(
  CONTENT_DIR + "/NWX/Content/NWX/Creatures",
  ".json",
);

const dict: Record<string, string> = {};
const typesMap: Record<string, string> = {
  BP_PortalCardMachine_Small_C: "portal_card_machine",
  BP_Creature_NPC_Puck_C: "puck",
  BP_Structure_DeathChest_C: "death_chest",
  BP_CodexActor_C: "codex",
  BP_Structure_Functional_Container_NoPlayerDestruct_C: "chest",
  BP_Structure_Functional_Container_C: "chest",
  BP_TargetPoint_PuzzleMemory_Piece_C: "PuzzleMemory",
  BP_TargetPoint_PuzzleMemory_Center_C: "PuzzleMemoryCentre",
};
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
}[] = [
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
];

for (const file of files) {
  if (!file.includes("BP_")) {
    continue;
  }
  const bpName = file.split("/").at(-1)?.replace(".json", "") + "_C";
  // console.log(`Processing ${bpName}`);

  const json = readJSON(file);
  if (!Array.isArray(json)) {
    continue;
  }
  const entry = json.find((entry) => entry.Properties?.BPCreatureData?.RowName);
  if (!entry) {
    // console.warn(`No entry for ${bpName} in ${file}`);
    continue;
  }
  const creatureName = entry.Properties.BPCreatureData.RowName;

  let uiRowName = creatureName;
  let isBoss = false;
  const creature = creatures[creatureName];
  if (creature) {
    const uiDataKey = Object.keys(creature).find((key) =>
      key.startsWith("UIData"),
    );
    if (!uiDataKey) {
      console.warn(`No UIData for ${creatureName}`);
      continue;
    }
    uiRowName = creature[uiDataKey].RowName;
    const tagsKey = Object.keys(creature).find((key) =>
      key.startsWith("AddedTags"),
    );
    if (!tagsKey) {
      console.warn(`No AddedTags for ${creatureName}`);
      continue;
    }
    if (creature[tagsKey].includes("Creature.Hero")) {
      isBoss = true;
    }
  }

  const uiRow = creatureUIRows[uiRowName];
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
  const uiItem = uiRow[nameDataKey];
  let name;
  if (uiItem.SourceString) {
    name = uiItem.SourceString;
  } else {
    const nameKey = uiItem.Key;
    name = strings[nameKey];
  }
  const iconKey = Object.keys(uiRow).find((key) =>
    key.startsWith("CreatureIcon"),
  );
  let icon = uiRow[iconKey].AssetPathName.split(".").at(-1);
  const isNPC = bpName.includes("NPC");
  if (isBoss) {
    icon += "_boss";
  } else if (isNPC && icon.includes("Target")) {
    icon += "_npc";
  }
  icon += ".webp";
  dict[creatureName] = name;
  typesMap[bpName] = creatureName;

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

writeJSON(OUT_DIR + "/dicts/en.json", dict);
writeJSON(OUT_DIR + "/coordinates/types_id_map.json", typesMap);
writeJSON(OUT_DIR + "/coordinates/filters.json", filters);
writeJSON(TEMP_DIR + "/all.json", allMaps);
writeJSON(TEMP_DIR + "/emptyMaps.json", emptyMaps);
