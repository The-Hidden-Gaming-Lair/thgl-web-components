import uniqolor from "uniqolor";
import { createCanvas } from "@napi-rs/canvas";
import { CONTENT_DIR, initDirs, TEMP_DIR } from "./lib/dirs.js";
import { readDirSync, readJSON, saveImage } from "./lib/fs.js";
import {
  mirrorCancas,
  rotateCanvas,
  saveIcon,
  vectorize,
} from "./lib/image.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import {
  initFilters,
  initGlobalFilters,
  writeFilters,
  writeGlobalFilters,
} from "./lib/filters.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initDict, writeDict } from "./lib/dicts.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import {
  Details,
  Map,
  PreplacedNamedObjects,
  RuntimeSession,
  Terrain,
} from "./stormgate.types.js";
import { splitPascalCase } from "./lib/utils.js";

initDirs(
  "/mnt/c/dev/Stormgate/Extracted/Data",
  "/mnt/c/dev/Stormgate/Extracted/Texture",
  "/home/devleon/the-hidden-gaming-lair/static/stormgate",
);

const enDict = initDict();
const nodes = initNodes();
const filters = initFilters();
const tiles = initTiles();
const regions = initRegions();
const globalFilters = initGlobalFilters();

const en = await readJSON<Record<string, string>>(
  `${CONTENT_DIR}/Stormgate/Content/Localization/Pegasus/en/Pegasus.json`,
);
const t = (key: string) => {
  const lowerCase = key.toLocaleLowerCase();
  let value = Object.entries(en).find(
    ([k]) => k.toLocaleLowerCase() === lowerCase,
  )?.[1];
  if (!value) {
    const coreKey = `pegasus_core.${key.split(".")[1]}`;
    value = Object.entries(en).find(
      ([k]) => k.toLocaleLowerCase() === coreKey,
    )?.[1];
  }
  if (!value) {
    return key.replace("pegasus_core.", "");
  }
  return value;
};

// const mapName = "Vanguard01";
const mapNames = readDirSync(`${CONTENT_DIR}/Stormgate/Content/PublishedMaps`);
for (const mapName of mapNames) {
  const map = await readJSON<Map>(
    `${CONTENT_DIR}/Stormgate/Content/PublishedMaps/${mapName}/Runtime/map.json`,
  );
  const details = await readJSON<Details>(
    `${CONTENT_DIR}/Stormgate/Content/PublishedMaps/${mapName}/Runtime/${map.__attr.details.__fref}`,
  );
  const terrain = await readJSON<Terrain>(
    `${CONTENT_DIR}/Stormgate/Content/PublishedMaps/${mapName}/Runtime/${map.__attr.terrain.__fref}`,
  );
  const preplacedNamedObjects = await readJSON<PreplacedNamedObjects>(
    `${CONTENT_DIR}/Stormgate/Content/PublishedMaps/${mapName}/Runtime/${map.__attr.preplaced_named_objects.__fref}`,
  );
  const runtimeSession = await readJSON<RuntimeSession>(
    `${CONTENT_DIR}/Stormgate/Content/PublishedMaps/${mapName}/Runtime/runtime_session.json`,
  );

  let mapImagePath = "";
  if (Bun.env.TILES === "true") {
    mapImagePath = await createMapImage(
      terrain,
      details.dimensions[0],
      details.dimensions[1],
      mapName,
    );
  }
  const tile = await generateTiles(mapName, mapImagePath, 2000000);
  tiles[mapName] = tile[mapName];
  enDict[mapName] =
    Object.entries(en).find(([k]) => k.endsWith(`MapName_${mapName}`))?.[1] ||
    mapName;
  for (const preplacedNamedObject of Object.values(preplacedNamedObjects)) {
    try {
      let type = preplacedNamedObject.kind;
      if (
        type.startsWith("_SoundAmbience") ||
        type.startsWith("SoundAmbience") ||
        type.startsWith("_BasicWorldPoint") ||
        type.startsWith("_Region") ||
        type.startsWith("_WorldPoint") ||
        type.startsWith("_TempleDoor") ||
        type.startsWith("BasicWorldPoint")
      ) {
        continue;
      }
      if (type.startsWith("_") && !type.startsWith("_Resource")) {
        type = type.slice(1);
        type = type.replace(/\d$/, "");
      }
      const archetypes = Object.values(runtimeSession.archetypes);
      const archetype = archetypes.find(
        ([, a]) => typeof a === "object" && a.id === type,
      )?.[1];
      if (
        !archetype ||
        typeof archetype !== "object" ||
        typeof archetype.__base_type !== "string"
      ) {
        console.error("No archetype found for", type);
        continue;
      }
      let group;
      let defaultOpen = true;
      let defaultOn = true;
      if (type === "locationMarkerPlayerStart" || type === "MegaResourceA") {
        group = "Locations";
        enDict[group] = "Locations";
      } else if (
        (Array.isArray(archetype.starting_snowtags) &&
          archetype.starting_snowtags.includes("entity_unit_structure")) ||
        (typeof archetype.capture_filter === "object" &&
          "excluded" in archetype.capture_filter &&
          Array.isArray(archetype.capture_filter.excluded) &&
          archetype.capture_filter.excluded.includes("entity_unit_structure"))
      ) {
        group = "Structures";
        enDict[group] = "Structures";
      } else if (
        Array.isArray(archetype.starting_snowtags) &&
        archetype.starting_snowtags.includes("entity_destructible_tree")
      ) {
        group = "Destructible";
        enDict[group] = "Destructible";
        defaultOpen = false;
        if (type.startsWith("Destructible") && type.endsWith("LightTree")) {
          type = "DestructibleLightTree";
        } else if (type.startsWith("Destructible") && type.endsWith("Tree")) {
          type = "DestructibleTree";
        }
      } else if (archetype.unit_button === "AttackButton") {
        group = "Unit";
      } else {
        group = archetype.__base_type;
        enDict[group] = splitPascalCase(group);
      }
      if (!filters.some((f) => f.group === group)) {
        filters.push({
          group,
          values: [],
          defaultOpen,
          defaultOn,
        });
      }
      const filter = filters.find((f) => f.group === group)!;

      if (!filter.values.some((v) => v.id === type)) {
        let icon;
        let size = 2;
        if (type === "locationMarkerPlayerStart") {
          icon = await saveIcon(
            `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/plain-circle_delapouite.webp`,
            type,
            {
              color: "#1ccdd1",
            },
          );
          size = 2;
          enDict[type] = "Player Start";
        } else if (
          typeof archetype.unit_info_portrait === "string" &&
          archetype.unit_info_portrait !== "None"
        ) {
          const imagePath =
            archetype.unit_info_portrait
              .split("'")[1]
              .replace("/Game/", "/Stormgate/Content/")
              .split(".")[0] + ".png";
          icon = await saveIcon(imagePath, type, {
            border: true,
            color: "#aaa",
          });
        } else if (type === "DestructibleTree") {
          icon = await saveIcon(
            `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/plain-circle_delapouite.webp`,
            type,
            {
              color: "#59b082",
            },
          );
          size = 0.7;
        } else if (type === "DestructibleLightTree") {
          icon = await saveIcon(
            `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/plain-circle_delapouite.webp`,
            type,
            {
              color: "#82ffbd",
            },
          );
          size = 0.7;
        } else if (type.startsWith("Destructible")) {
          icon = await saveIcon(
            `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/plain-circle_delapouite.webp`,
            type,
            {
              color: uniqolor(type).color,
            },
          );
          size = 0.7;
        } else if (
          typeof archetype.minimap_icon === "string" &&
          archetype.minimap_icon &&
          archetype.minimap_icon !== "None"
        ) {
          const imagePath =
            archetype.minimap_icon
              .split("'")[1]
              .replace("/Game/", "/Stormgate/Content/")
              .split(".")[0] + ".png";
          icon = await saveIcon(imagePath, type, {
            border: true,
            color: "#aaa",
          });
        } else if (typeof archetype.icon === "string") {
          const imagePath =
            archetype.icon
              .split("'")[1]
              .replace("/Game/", "/Stormgate/Content/")
              .split(".")[0] + ".png";
          icon = await saveIcon(imagePath, type, {
            border: true,
            color: "#aaa",
          });
        } else if (typeof archetype.camp_type === "string") {
          const campType = archetype.camp_type;
          const campArchetype = archetypes.find(
            ([, a]) => typeof a === "object" && a.id === campType,
          )?.[1];
          if (
            !campArchetype ||
            typeof campArchetype !== "object" ||
            !("icon" in campArchetype)
          ) {
            console.error("No archetype found for", campType);
            continue;
          }
          let imagePath;
          if (typeof campArchetype.minimap_icon === "string") {
            imagePath =
              campArchetype.minimap_icon
                .split("'")[1]
                .replace("/Game/", "/Stormgate/Content/")
                .split(".")[0] + ".png";
          } else if (typeof campArchetype.icon === "string") {
            imagePath =
              campArchetype.icon
                .split("'")[1]
                .replace("/Game/", "/Stormgate/Content/")
                .split(".")[0] + ".png";
          } else {
            console.error("No icon found for", campType);
            continue;
          }
          icon = await saveIcon(imagePath, type);
          if (typeof campArchetype.name == "string") {
            enDict[type] = t(campArchetype.name.replace("|", "."));
          }
        } else {
          icon = await saveIcon(
            `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/plain-circle_delapouite.webp`,
            type,
          );
        }

        filter.values.push({
          id: type,
          icon,
          size,
        });
        if (typeof archetype.name == "string") {
          if (
            type === "Rewardless_CreepCampType" &&
            archetype.name === "UNNAMED"
          ) {
            enDict[type] = "Rewardless Camp";
          } else if (
            type === "DestructibleHavocWallHorizontal" &&
            archetype.name === "NO_NAME"
          ) {
            enDict[type] = "Havoc Wall";
          } else {
            enDict[type] = t(archetype.name.replace("|", "."));
          }
        }
        if (archetype.unit_button === "AttackButton") {
          //.log(archetype.vital_health);
        } else if (
          typeof archetype.unit_button === "string" &&
          archetype.unit_button !== "AttackButton"
        ) {
          const action = t(`pegasus_core.Button_name_${archetype.unit_button}`);
          const actionTooltip = t(
            `pegasus_core.Button_tooltip_${archetype.unit_button}`,
          );
          enDict[`${type}_desc`] = `${action} - ${actionTooltip}`;
        }
        if (
          typeof archetype.vital_health === "object" &&
          "starting" in archetype.vital_health
        ) {
          if (enDict[`${type}_desc`]) {
            enDict[`${type}_desc`] += "<br>";
          } else {
            enDict[`${type}_desc`] = "";
          }
          enDict[`${type}_desc`] +=
            `Health: ${archetype.vital_health.starting}`;
        }
      }
      if (!nodes.some((n) => n.type === type && n.mapName === mapName)) {
        nodes.push({
          type,
          mapName,
          spawns: [],
        });
      }
      const node = nodes.find((n) => n.type === type && n.mapName === mapName)!;
      node.spawns.push({
        p: [preplacedNamedObject.position[0], preplacedNamedObject.position[1]],
      });
    } catch (e) {
      console.error(preplacedNamedObject.kind, e);
    }
  }
}

const sortPriority = ["Locations", "CreepCamp", "ItemData", "Destructible"];
const sortedFilters = filters
  .map((f) => {
    return {
      ...f,
      values: f.values.filter((v) => nodes.some((n) => n.type === v.id)),
    };
  })
  .sort((a, b) => {
    if (a.group === b.group) {
      return 0;
    }
    const priorityA = sortPriority.findIndex((p) =>
      a.group.toLowerCase().startsWith(p.toLowerCase()),
    );
    const priorityB = sortPriority.findIndex((p) =>
      b.group.toLowerCase().startsWith(p.toLowerCase()),
    );
    if (priorityA === priorityB) {
      return a.group.localeCompare(b.group);
    }
    return priorityA - priorityB;
  });
writeFilters(sortedFilters);
writeNodes(nodes);
writeTiles(tiles);
writeDict(enDict, "en");
writeRegions(regions);
writeGlobalFilters(globalFilters);

async function createMapImage(
  terrain: Terrain,
  width: number,
  height: number,
  mapName: string,
) {
  const terrainNodesSize = Math.sqrt(terrain.terrain_nodes.length);
  const terrainNodesCanvas = createCanvas(terrainNodesSize, terrainNodesSize);
  const terrainNodesCtx = terrainNodesCanvas.getContext("2d");
  for (let i = 0; i < terrain.terrain_nodes.length; i++) {
    const terrainNode = terrain.terrain_nodes[i];
    const x = i % terrainNodesSize;
    const y = Math.floor(i / terrainNodesSize);
    if (terrainNode === 8) {
      terrainNodesCtx.fillStyle = `rgba(89,145,223,1)`;
    } else if (terrainNode === 9) {
      terrainNodesCtx.fillStyle = `rgba(41,30,20,1)`;
    } else if (terrainNode === 10) {
      terrainNodesCtx.fillStyle = `rgba(93,68,45,1)`;
    } else if (terrainNode === 11) {
      terrainNodesCtx.fillStyle = `rgba(168,121,82,1)`;
    } else if (terrainNode === 12) {
      terrainNodesCtx.fillStyle = `rgba(91,56,33,1)`;
    } else {
      terrainNodesCtx.fillStyle = `rgba(${terrainNode}, ${terrainNode}, ${terrainNode}, 1)`;
    }
    terrainNodesCtx.fillRect(x, y, 1, 1);
  }
  saveImage(
    TEMP_DIR + "/" + mapName + "_terrain_nodes.png",
    mirrorCancas(terrainNodesCanvas).toBuffer("image/png"),
  );

  const waterDataSize = Math.sqrt(terrain.water_data.length);
  const waterDataCanvas = createCanvas(waterDataSize, waterDataSize);
  const waterDataCtx = waterDataCanvas.getContext("2d");
  for (let i = 0; i < terrain.water_data.length; i++) {
    const waterNode = terrain.water_data[i];
    const x = i % waterDataSize;
    const y = Math.floor(i / waterDataSize);
    waterDataCtx.fillStyle = `rgba(${waterNode}, ${waterNode}, ${waterNode}, 1)`;
    waterDataCtx.fillRect(x, y, 1, 1);
  }
  const waterDataImageData = waterDataCtx.getImageData(
    0,
    0,
    waterDataSize,
    waterDataSize,
  );
  saveImage(
    TEMP_DIR + "/" + mapName + "_water_data.png",
    mirrorCancas(waterDataCanvas).toBuffer("image/png"),
  );

  const heightNodesSize = Math.sqrt(terrain.height_nodes.length);
  const heightNodesCanvas = createCanvas(heightNodesSize, heightNodesSize);
  const heightNodesCtx = heightNodesCanvas.getContext("2d");
  for (let i = 0; i < terrain.height_nodes.length; i++) {
    const heightNode = Math.max(terrain.height_nodes[i], 256);
    const x = i % heightNodesSize;
    const y = Math.floor(i / heightNodesSize);
    heightNodesCtx.fillStyle = `rgba(${heightNode}, ${heightNode}, ${heightNode}, 1)`;
    heightNodesCtx.fillRect(x, y, 1, 1);
  }
  saveImage(
    TEMP_DIR + "/" + mapName + "_height_nodes.png",
    mirrorCancas(heightNodesCanvas).toBuffer("image/png"),
  );

  const canvas = createCanvas(waterDataSize, waterDataSize);
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, waterDataSize, waterDataSize);
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const j = i / 4;
    // const x = (i / 4) % width;
    // const y = Math.floor(i / 4 / width);
    const terrainNode = terrain.terrain_nodes[j];
    const waterNode = terrain.water_data[j];
    const heightNode = terrain.height_nodes[j];

    const isWater = waterDataImageData.data[i] > 0;

    if (isWater) {
      pixels[i] = 5;
      pixels[i + 1] = 49;
      pixels[i + 2] = 140;
      pixels[i + 3] = 255;
    } else {
      pixels[i] = 0;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  saveImage(
    TEMP_DIR + "/" + mapName + ".png",
    mirrorCancas(canvas).toBuffer("image/png"),
  );
  vectorize(
    TEMP_DIR + "/" + mapName + "_terrain_nodes.png",
    TEMP_DIR + "/" + mapName + "_terrain_nodes.svg",
  );
  return TEMP_DIR + "/" + mapName + "_terrain_nodes.png";
}

console.log("Done");
