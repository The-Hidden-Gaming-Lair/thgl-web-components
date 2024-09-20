import { initDict, writeDict } from "./lib/dicts.js";
import { CONTENT_DIR, initDirs, OUTPUT_DIR, TEXTURE_DIR } from "./lib/dirs.js";
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
} from "./lib/fs.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";
import { DA_WorldMapGlobalConfig } from "./palia.types.js";

initDirs(
  String.raw`C:\dev\Palia\Extracted\Data`,
  String.raw`C:\dev\Palia\Extracted\Texture`,
  String.raw`C:\dev\the-hidden-gaming-lair\static\palia`,
);

const dict = initDict({
  VillageWorld: "Kilima Village",
  AdventureZoneWorld: "Bahari Bay",
  MajiMarket: "Fairgrounds",
  HousingPlot: "Housing Plot",
  AirTemple: "Air Temple",
  FireTemple: "Fire Temple",
  EarthTemple: "Earth Temple",
  WaterTemple: "Water Temple",
});

const worldMapGlobalConfig = await readJSON<DA_WorldMapGlobalConfig>(
  CONTENT_DIR + "/Palia/Content/Configs/DA_WorldMapGlobalConfig.json",
);
const tiles = initTiles();
const filters = initFilters();
const nodes = initNodes();
const regions = initRegions();
const typeIDs = initTypesIDs();
const globalFilters = initGlobalFilters();

const worldMaps = worldMapGlobalConfig[0].Properties.WorldMaps;
for (const worldMap of worldMaps) {
  if (
    ![
      "Village_Root",
      "AZ1_01_Root",
      "Fairgrounds_MajiMarket",
      "HousingPlot",
      // 'AZ2_01_Root', // Ghost Village
    ].includes(worldMap.Key)
  ) {
    continue;
  }

  const image = worldMap.Value.Image;
  const name =
    worldMap.Key === "HousingPlot"
      ? "Map_HousingPlot"
      : image.AssetPathName.split("/").at(-1)!.split(".")[0];
  const path = `${TEXTURE_DIR}/Palia/Content/UI/WorldMap/Assets/${name}.png`;
  const bounds = [
    [worldMap.Value.TopLeftCorner.X, worldMap.Value.TopLeftCorner.Y],
    [worldMap.Value.BottomRightCorner.X, worldMap.Value.BottomRightCorner.Y],
  ];
  const width =
    Math.max(...bounds.map((b) => b[0])) - Math.min(...bounds.map((b) => b[0]));

  const offset = [
    (bounds[0][1] + bounds[1][1]) / 2,
    (bounds[0][0] + bounds[1][0]) / 2,
  ];
  tiles[worldMap.Value.Name] = (
    await generateTiles(worldMap.Value.Name, path, width, 512, offset)
  )[worldMap.Value.Name];
}

const privateSpaceMaps = worldMapGlobalConfig[0].Properties.PrivateSpaceMaps;
for (const privateSpaceMap of privateSpaceMaps) {
  const image = privateSpaceMap.Value.Image;
  const name = image.AssetPathName.split("/").at(-1)!.split(".")[0];
  const path = `${TEXTURE_DIR}/Palia/Content/UI/WorldMap/Assets/${name}.png`;

  const width = 15000;
  tiles[privateSpaceMap.Value.Name] = (
    await generateTiles(privateSpaceMap.Value.Name, path, width, 512)
  )[privateSpaceMap.Value.Name];
}
writeTiles(tiles);

const mapsData = readDirRecursive(CONTENT_DIR + "/Maps");
for (const mapData of mapsData) {
}

writeFilters(filters);
writeDict(dict, "en");
writeNodes(nodes);
Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    nodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});

writeRegions(regions);
writeTypesIDs(typeIDs);
writeGlobalFilters(globalFilters);

console.log("Done");
