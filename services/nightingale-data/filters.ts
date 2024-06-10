import { fileURLToPath } from "url";
import { readDirRecursive, readJSON, saveImage, writeJSON } from "./lib/fs.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const OUT_DIR = __dirname + "../out";
const TEMP_DIR =
  "/home/devleon/the-hidden-gaming-lair/services/nightingale-data/out";
const PROD_OUT_DIR = "/home/devleon/the-hidden-gaming-lair/static/nightingale";

const creatureData = readJSON(
  "/mnt/c/dev/Nightingale/Extracted/Data/NWX/Content/NWX/Creatures/Wildlife/Data/CDT_BPCreatureData.json",
);
const creatures = creatureData[0].Rows;

const creatureUIData = readJSON(
  "/mnt/c/dev/Nightingale/Extracted/Data/NWX/Content/NWX/Creatures/Wildlife/Data/CDT_CreatureUIData.json",
);
const creatureUIRows = creatureUIData[0].Rows;

const creatureStrings = readJSON(
  "/mnt/c/dev/Nightingale/Extracted/Data/NWX/Content/NWX/StringTables/Y1S1/ST_Y1S1_Creatures.json",
);
const strings = creatureStrings[0].StringTable.KeysToMetaData;

const files = readDirRecursive(
  "/mnt/c/dev/Nightingale/Extracted/Data/NWX/Content/NWX/Creatures",
  ".json",
);

const dict: Record<string, string> = {};
const typesMap: Record<string, string> = {};
const filters: Record<string, { id: string; icon: string; size: number }[]> = {
  npcs: [],
  bosses: [],
  creatures: [],
};
for (const file of files) {
  if (!file.includes("BP_")) {
    continue;
  }
  const bpName = file.split("/").at(-1).replace(".json", "") + "_C";
  // console.log(`Processing ${bpName}`);

  const json = readJSON(file);
  if (!Array.isArray(json)) {
    continue;
  }
  const entry = json.find((entry) => entry.Properties?.BPCreatureData?.RowName);
  if (!entry) {
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
    uiRowName = creature[uiDataKey].RowName;
    const tagsKey = Object.keys(creature).find((key) =>
      key.startsWith("AddedTags"),
    );
    if (creature[tagsKey].includes("Creature.Hero")) {
      isBoss = true;
    }
  }

  const uiRow = creatureUIRows[uiRowName];
  const nameDataKey = Object.keys(uiRow).find((key) =>
    key.startsWith("CreatureName"),
  );
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
    filters.bosses.push({
      id: creatureName,
      icon,
      size: 1.5,
    });
  } else if (isNPC) {
    filters.npcs.push({
      id: creatureName,
      icon,
      size: 1,
    });
  } else {
    filters.creatures.push({
      id: creatureName,
      icon,
      size: 1,
    });
  }
}
writeJSON(PROD_OUT_DIR + "/dicts/en.json", dict);
writeJSON(OUT_DIR + "/creatures/typesMap.json", typesMap);
writeJSON(PROD_OUT_DIR + "/coordinates/filters.json", filters);
