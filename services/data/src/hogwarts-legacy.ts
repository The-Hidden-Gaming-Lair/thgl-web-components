import { CONTENT_DIR, initDirs } from "./lib/dirs.js";
import { sqliteToJSON } from "./lib/db.js";
import {
  readContentJSON,
  readDirRecursive,
  readDirSync,
  writeJSON,
} from "./lib/fs.js";
import { decodeAvaf } from "./lib/avafdict.js";

initDirs(
  "/mnt/c/dev/Hogwarts Legacy/Extracted/Data",
  "/mnt/c/dev/Hogwarts Legacy/Extracted/Texture",
  "/home/devleon/the-hidden-gaming-lair/static/hogwarts-legacy",
);

if (Bun.env.DB === "true") {
  readDirSync(CONTENT_DIR + "/Phoenix/Content/Localization/WIN64").forEach(
    (file) => {
      if (file.endsWith(".bin")) {
        const dict = decodeAvaf(
          CONTENT_DIR + "/Phoenix/Content/Localization/WIN64/" + file,
        );
        writeJSON(
          CONTENT_DIR +
            "/Phoenix/Content/Localization/WIN64/" +
            file.replace(".bin", ".json"),
          dict,
        );
      }
    },
  );
  sqliteToJSON("/Phoenix/Content/SQLiteDB");
}

const FastTravelLocations = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_FastTravelLocations.json",
);
const HogwartsMapIconTable = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_HogwartsMapIconTable.json",
);
const KnowledgeInvestigatable = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_KnowledgeInvestigatable.json",
);
const KnowledgeLocations = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_KnowledgeLocations.json",
);
const Locations = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_Locations.json",
);
const MiscLocations = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_MiscLocations.json",
);
const SphinxPuzzleLocations = readContentJSON(
  "/Phoenix/Content/SQLiteDB/PhoenixGameData_SphinxPuzzleLocations.json",
);
const enDict = readContentJSON(
  "/Phoenix/Content/Localization/WIN64/MAIN-enUS.json",
);
