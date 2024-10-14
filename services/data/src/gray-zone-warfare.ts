import { ExportedMapData } from "./gray-zone-warfare.types.js";
import { initDict, writeDict } from "./lib/dicts.js";
import { initDirs, OUTPUT_DIR } from "./lib/dirs.js";
import {
  initFilters,
  initGlobalFilters,
  writeFilters,
  writeGlobalFilters,
} from "./lib/filters.js";
import { encodeToFile, readJSON } from "./lib/fs.js";
import { IconProps, saveIcon } from "./lib/image.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";
import { Node } from "./types.js";

initDirs(
  String.raw`C:\dev\GrayZoneWarfare\Extracted\Data`,
  String.raw`C:\dev\GrayZoneWarfare\Extracted\Texture`,
  String.raw`C:\dev\the-hidden-gaming-lair\static\gray-zone-warfare`,
);

const exportedMapDataPath = String.raw`C:\dev\GrayZoneWarfare\ExportedMapData.json`;
const exportedMapData = await readJSON<ExportedMapData>(exportedMapDataPath);

const tiles = initTiles();
const enDict = initDict();
const nodes = initNodes();
const filters = initFilters();
const regions = initRegions();
const typesIDs = initTypesIDs();
const globalFilters = initGlobalFilters();

const mapName = exportedMapData.mapName;

const mapImagePath = String.raw`C:\dev\GrayZoneWarfare\map.jpg`;

tiles[mapName] = (
  await generateTiles(
    mapName,
    mapImagePath,
    5000000,
    512,
    [1000000, 2000000],
    undefined,
  )
)[mapName];

const saveSpawn = async ({
  iconPath,
  type,
  iconProps,
  group,
  size,
  id,
  p,
  mapName,
}: {
  iconPath: string;
  type: string;
  iconProps: IconProps;
  group: string;
  size: number;
  id: string;
  p: [number, number, number];
  mapName: string;
}) => {
  const iconName = await saveIcon(iconPath, type, iconProps);
  let category = filters.find((f) => f.group === group);
  if (!category) {
    filters.push({
      group: group,
      defaultOpen: true,
      defaultOn: true,
      values: [],
    });
    category = filters.find((f) => f.group === group)!;
  }
  if (!category.values.some((v) => v.id === type)) {
    category.values.push({
      id: type,
      icon: iconName,
      size,
    });
  }
  let oldNodes = nodes.find((n) => n.type === type && n.mapName === mapName);
  if (!oldNodes) {
    nodes.push({ type: type, mapName, spawns: [], static: true });
    oldNodes = nodes.find((n) => n.type === type && n.mapName === mapName)!;
  }

  const spawn: Node["spawns"][number] = {
    id,
    p,
  };
  if (
    oldNodes.spawns.some((s) => s.p[0] === spawn.p[0] && s.p[1] === spawn.p[1])
  ) {
    return;
  }
  oldNodes.spawns.push(spawn);
};

{
  const group = "locations";
  enDict[group] = "Locations";
  for (const campData of exportedMapData.campDataArray) {
    const type = "faction_camp";
    enDict[type] = "Faction Camp";
    const iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\camping-tent_delapouite.webp`;
    const iconProps: IconProps = {};
    const size = 1.5;
    const id = campData.uId;
    enDict[id] = campData.name;
    const p: [number, number, number] = [
      campData.location.y,
      campData.location.x,
      campData.location.z,
    ];
    await saveSpawn({ iconPath, type, iconProps, group, size, id, p, mapName });
  }
}

{
  const group = "locations";
  enDict[group] = "Locations";
  for (const landingZoneData of exportedMapData.landingZoneDataArray) {
    const type = "landing_zone";
    enDict[type] = "Landing Zone";
    const iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\helicopter_delapouite.webp`;
    const iconProps: IconProps = {};
    const size = 1.5;
    const id = landingZoneData.uId;
    enDict[id] = landingZoneData.name;
    const p: [number, number, number] = [
      landingZoneData.location.y,
      landingZoneData.location.x,
      landingZoneData.location.z,
    ];
    await saveSpawn({ iconPath, type, iconProps, group, size, id, p, mapName });
  }
}

{
  const group = "locations";
  enDict[group] = "Locations";
  for (const landingZoneData of exportedMapData.lootBoxDataArray) {
    const type = "loot_box";
    enDict[type] = "Loot Box";
    const iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\chest_delapouite.webp`;
    const iconProps: IconProps = {};
    const size = 1.5;
    const id = landingZoneData.uId;
    enDict[id] = landingZoneData.name;
    const p: [number, number, number] = [
      landingZoneData.location.y,
      landingZoneData.location.x,
      landingZoneData.location.z,
    ];
    await saveSpawn({ iconPath, type, iconProps, group, size, id, p, mapName });
  }
}

{
  const group = "locations";
  enDict[group] = "Locations";
  for (const landingZoneData of exportedMapData.lockedDoorDataArray) {
    const type = "locked_door";
    enDict[type] = "Locked Door";
    const iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\locked-door_delapouite.webp`;
    const iconProps: IconProps = {};
    const size = 1.5;
    const id = landingZoneData.uId;
    enDict[id] = landingZoneData.name;
    const p: [number, number, number] = [
      landingZoneData.location.y,
      landingZoneData.location.x,
      landingZoneData.location.z,
    ];
    await saveSpawn({ iconPath, type, iconProps, group, size, id, p, mapName });
  }
}

{
  const group = "locations";
  enDict[group] = "Locations";
  for (const landingZoneData of exportedMapData.lootPointDataArray) {
    const type = "loot_point";
    enDict[type] = "Loot Point";
    const iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\open-treasure-chest_skoll.webp`;
    const iconProps: IconProps = {};
    const size = 1.5;
    const id = landingZoneData.uId;
    enDict[id] = landingZoneData.name;
    const p: [number, number, number] = [
      landingZoneData.location.y,
      landingZoneData.location.x,
      landingZoneData.location.z,
    ];
    await saveSpawn({ iconPath, type, iconProps, group, size, id, p, mapName });
  }
}

exportedMapData.interactivePropDataArray;
exportedMapData.explorableAreaDataArray;

{
  const group = "quests";
  enDict[group] = "Quests";
  for (const item of exportedMapData.quests) {
    const type = item.questId;
    enDict[type] = item.name;
    const iconPath = String.raw`C:\dev\the-hidden-gaming-lair\static\global\icons\game-icons\position-marker_delapouite.webp`;
    const iconProps: IconProps = {};
    const size = 1.5;
    let index = 0;
    const total = item.objectives.length;
    for (const objective of item.objectives) {
      index++;
      const id = item.questId + "_" + index;
      enDict[id] = item.name + ` ${index}/${total}`;
      enDict[`${id}_desc`] = objective.description;

      const p: [number, number, number] = [
        objective.targetPosition.y,
        objective.targetPosition.x,
        objective.targetPosition.z,
      ];

      await saveSpawn({
        iconPath,
        type,
        iconProps,
        group,
        size,
        id,
        p,
        mapName,
      });
    }
  }
}

Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    nodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});
writeNodes(nodes);
writeTiles(tiles);
writeDict(enDict, "en");
writeFilters(filters);
writeRegions(regions);
writeTypesIDs(typesIDs);
writeGlobalFilters(globalFilters);

console.log("Done");
