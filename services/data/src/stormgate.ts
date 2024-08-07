import uniqolor from "uniqolor";
import { createCanvas } from "@napi-rs/canvas";
import { CONTENT_DIR, initDirs, TEMP_DIR } from "./lib/dirs.js";
import { readDirSync, readJSON, saveImage } from "./lib/fs.js";
import {
  loadCanvas,
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
  Archetypes,
  Details,
  Map,
  PreplacedNamedObjects,
  RuntimeSession,
  Terrain,
} from "./stormgate.types.js";
import { splitPascalCase } from "./lib/utils.js";
import { Node } from "./types.js";

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

// const mapNames = ["Boneyard", "IsleOfDread", "JaggedMaw"];
// const mapNames = ["DustDevil2v2", "Boneyard"];
// const mapNames = ["Boneyard", "Boneyard2v2", "BrokenCrown"];
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
  const archetypes = await readJSON<Archetypes>(
    `${CONTENT_DIR}/Stormgate/Content/PublishedMaps/${mapName}/Runtime/artifacts/archetypes.json`,
  );

  const defaultSize = 224;
  const multiplier = details.dimensions[0] / defaultSize;
  const width = 3700000 * multiplier;

  let mapImagePath = "";
  if (Bun.env.TILES === "true") {
    mapImagePath = await createMapImage(
      terrain,
      details.dimensions[0] + 1,
      details.dimensions[1] + 1,
      mapName,
    );
  }
  const tile = await generateTiles(
    mapName,
    mapImagePath,
    width,
    512,
    [50000, 0],
  );
  tiles[mapName] = tile[mapName];
  if (mapName.includes("2v2") || details.map_name.includes("_2v2")) {
    enDict[mapName] = "[2v2] ";
  } else if (details.map_name.includes("_1v1")) {
    enDict[mapName] = "[1v1] ";
  } else if (details.map_name.includes("_coop")) {
    enDict[mapName] = "[coop] ";
  } else if (details.map_name.includes("_campaign")) {
    enDict[mapName] = "[campaign] ";
  } else {
    enDict[mapName] = "";
  }
  enDict[mapName] += t(details.map_name.replace("|", "."));
  for (const preplacedNamedObject of Object.values(preplacedNamedObjects)) {
    try {
      let type = preplacedNamedObject.kind;
      if (
        type.startsWith("_SoundAmbience") ||
        type.startsWith("SoundAmbience") ||
        type.startsWith("SoundEmitter") ||
        type.startsWith("Sound_") ||
        type.startsWith("_Sound_") ||
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
      let id = "";
      if (type === "MinionHealBuffCamp") {
        type = "HealthTower_CreepCamp";
      }
      if (type.includes("ResourceB_Generator")) {
        if (typeof archetype.name !== "string") {
          console.warn("No name for", type);
          continue;
        }
        type = "therium_generator";
      }

      if (type === "locationMarkerPlayerStart" || type === "MegaResourceA") {
        group = "Locations";
        enDict[group] = "Locations";
      } else if (type.startsWith("JournalEntry_")) {
        group = "Journals";
        enDict[group] = "Journals";
        if (typeof archetype.name !== "string") {
          console.warn("No name for", type);
          continue;
        }
        if (typeof archetype.id !== "string") {
          console.warn("No id for", type);
          continue;
        }
        id = archetype.id;
        enDict[`${id}_desc`] = t(`VanguardJournalEntries.${archetype.id}`);
        type = en[archetype.name.replace("|", ".")];
      } else if (type.endsWith("Tower")) {
        group = "Tower";
        enDict[group] = "Tower";
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
        if (type.startsWith("Destructible") && type.endsWith("LightTree")) {
          type = "DestructibleLightTree";
        } else if (type.startsWith("Destructible") && type.endsWith("Tree")) {
          type = "DestructibleTree";
        }
      } else if (archetype.unit_button === "AttackButton") {
        group = "Unit";
        enDict[group] = "Unit";
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

        const processSubArchetype = async (subArchetypeId: string) => {
          const subArchetype = archetypes.find(
            ([, a]) => typeof a === "object" && a.id === subArchetypeId,
          )?.[1];
          if (
            !subArchetype ||
            typeof subArchetype !== "object" ||
            !("icon" in subArchetype)
          ) {
            console.error("No archetype found for", subArchetypeId);
            return;
          }
          let imagePath;
          if (typeof subArchetype.minimap_icon === "string") {
            imagePath =
              subArchetype.minimap_icon
                .split("'")[1]
                .replace("/Game/", "/Stormgate/Content/")
                .split(".")[0] + ".png";
          } else if (
            typeof subArchetype.icon === "string" ||
            typeof subArchetype.Icon === "string"
          ) {
            let iconTexture;
            if (
              typeof subArchetype.icon === "string" &&
              subArchetype.icon !== ""
            ) {
              iconTexture = subArchetype.icon;
            } else if (
              typeof subArchetype.Icon === "string" &&
              subArchetype.Icon !== ""
            ) {
              iconTexture = subArchetype.Icon;
            } else {
              console.error("No icon found for", subArchetypeId);
              return;
            }

            imagePath =
              iconTexture
                .split("'")[1]
                .replace("/Game/", "/Stormgate/Content/")
                .split(".")[0] + ".png";
          } else {
            console.error("No icon found for", subArchetypeId);
            return;
          }
          if (
            type === "HealingFlower" &&
            typeof archetype.unit_info_portrait === "string"
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
          } else if (type.startsWith("Unit_")) {
            icon = await saveIcon(imagePath, type, {
              border: true,
              color: "#aaa",
            });
          } else {
            icon = await saveIcon(imagePath, type);
          }
          if (typeof subArchetype.name == "string" && !enDict[type]) {
            enDict[type] = t(subArchetype.name.replace("|", "."));
          }
          if (
            typeof subArchetype.tooltip == "string" &&
            !enDict[`${type}_desc`]
          ) {
            enDict[`${type}_desc`] = t(subArchetype.tooltip.replace("|", "."));
          }
        };

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
          typeof archetype.minimap_icon === "string" &&
          archetype.minimap_icon &&
          archetype.minimap_icon !== "None" &&
          !type.startsWith("Unit_")
        ) {
          const imagePath =
            archetype.minimap_icon
              .split("'")[1]
              .replace("/Game/", "/Stormgate/Content/")
              .split(".")[0] + ".png";
          icon = await saveIcon(imagePath, type);
        } else if (
          typeof archetype.unit_button === "string" &&
          archetype.unit_button !== "AttackButton" &&
          archetype.unit_button !== "emptyRef"
        ) {
          const subArchetypeId = archetype.unit_button;
          await processSubArchetype(subArchetypeId);
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
        } else if (type === "ExplodingBarrel") {
          icon = await saveIcon(
            `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/plain-circle_delapouite.webp`,
            type,
            {
              color: "#cb0000",
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
        } else if (
          typeof archetype.camp_type === "string" &&
          archetype.camp_type !== "emptyRef"
        ) {
          const subArchetypeId = archetype.camp_type;
          await processSubArchetype(subArchetypeId);
        } else {
          icon = await saveIcon(
            `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/plain-circle_delapouite.webp`,
            type,
          );
        }
        if (icon) {
          filter.values.push({
            id: type,
            icon,
            size,
          });
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
      const spawn: Node["spawns"][0] = {
        p: [
          -preplacedNamedObject.position[1],
          preplacedNamedObject.position[0],
        ],
      };
      if (id) {
        spawn.id = id;
      }
      node.spawns.push(spawn);
    } catch (e) {
      console.error(preplacedNamedObject.kind, e);
    }
  }
  console.log("Processed", mapName);
}

const sortPriority = [
  "Locations",
  "ResourceGeneratorData",
  "CreepCamp",
  "Journals",
  "Tower",
  "Structures",
  "ItemData",
  "Destructible",
];
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
    let priorityA = sortPriority.findIndex((p) =>
      a.group.toLowerCase().startsWith(p.toLowerCase()),
    );
    if (priorityA === -1) {
      priorityA = 1000;
    }
    let priorityB = sortPriority.findIndex((p) =>
      b.group.toLowerCase().startsWith(p.toLowerCase()),
    );
    if (priorityB === -1) {
      priorityB = 1000;
    }
    if (priorityA === priorityB) {
      return a.group.localeCompare(b.group);
    }
    return priorityA - priorityB;
  });
writeFilters(sortedFilters);
writeNodes(nodes);
const sortedTiles = Object.fromEntries(
  Object.entries(tiles).sort(([a], [b]) => enDict[a].localeCompare(enDict[b])),
);
writeTiles(sortedTiles);
writeDict(enDict, "en");
writeRegions(regions);
writeGlobalFilters(globalFilters);

interface Point {
  x: number;
  y: number;
}

async function createMapImage(
  terrain: Terrain,
  width: number,
  height: number,
  mapName: string,
) {
  const nodeSize = 1;
  const mapSize = Math.sqrt(terrain.terrain_nodes.length);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const visited = new Set<string>();

  const floodFill = (x: number, y: number, value: number): Point[] => {
    const queue: Point[] = [{ x, y }];
    const points: Point[] = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 1, y: 0 }, // right
      { x: 0, y: 1 }, // down
      { x: -1, y: 0 }, // left
    ];

    while (queue.length > 0) {
      const point = queue.shift();
      if (!point) continue;

      if (point.x < 0 || point.x >= width || point.y < 0 || point.y >= height) {
        continue;
      }
      const i = point.x + point.y * width;
      const terrainNode = terrain.terrain_nodes[i];
      const heightNode = terrain.height_nodes[i];
      const isWater = terrain.water_data[i] > 0 && heightNode <= 100;
      const isDark = isWater && heightNode <= 0 && terrainNode <= 9;
      const newValue = isDark ? -2 : isWater ? -1 : Math.min(terrainNode, 5000);
      if (newValue !== value) {
        continue;
      }
      if (points.find((p) => p.x === point.x && p.y === point.y)) continue;

      points.push(point);

      for (const direction of directions) {
        queue.push({ x: point.x + direction.x, y: point.y + direction.y });
      }
    }
    return points;
  };

  for (let i = 0; i < terrain.terrain_nodes.length; i++) {
    const x = i % width;
    const y = Math.floor(i / height);

    const terrainNode = terrain.terrain_nodes[i];
    const heightNode = terrain.height_nodes[i];
    const isWater = terrain.water_data[i] > 0 && heightNode <= 100;
    const isDark = isWater && heightNode <= 0 && terrainNode <= 9;
    const value = isDark ? -2 : isWater ? -1 : Math.min(terrainNode, 5000);

    if (!visited.has(`${x},${y}`)) {
      const points = floodFill(x, y, value);

      points.forEach((point) => {
        visited.add(`${point.x},${point.y}`);
      });
      ctx.beginPath();

      if (isDark) {
        ctx.fillStyle = `rgba(50,78,131,1)`;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(50,78,131,1)";

        points.forEach((point) => {
          ctx.rect(point.x * nodeSize, point.y * nodeSize, nodeSize, nodeSize);
        });
        ctx.stroke();
      } else if (isWater) {
        ctx.fillStyle = `rgba(89,145,223,1)`;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(89,145,223,1)";

        points.forEach((point) => {
          ctx.rect(point.x * nodeSize, point.y * nodeSize, nodeSize, nodeSize);
        });
        ctx.stroke();
      } else if (value === 5000) {
        ctx.fillStyle = `rgba(175, 175, 175, 1)`;
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "rgba(175, 175, 175, 1)";

        points.forEach((point) => {
          ctx.rect(point.x * nodeSize, point.y * nodeSize, nodeSize, nodeSize);
        });
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(168, 120, 80,1)`;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";

        points.forEach((point) => {
          ctx.rect(point.x * nodeSize, point.y * nodeSize, nodeSize, nodeSize);
        });
        ctx.stroke();
      }

      points.forEach((point) => {
        ctx.fillRect(
          point.x * nodeSize,
          point.y * nodeSize,
          nodeSize,
          nodeSize,
        );
      });
    }
  }

  saveImage(
    TEMP_DIR + "/" + mapName + ".png",
    mirrorCancas(canvas).toBuffer("image/png"),
  );
  await vectorize(
    TEMP_DIR + "/" + mapName + ".png",
    TEMP_DIR + "/" + mapName + ".svg",
    8000,
    8000,
  );

  const svgCanvas = await loadCanvas(TEMP_DIR + "/" + mapName + ".svg");
  saveImage(
    TEMP_DIR + "/" + mapName + "_final.png",
    svgCanvas.toBuffer("image/png"),
  );

  return TEMP_DIR + "/" + mapName + "_final.png";
}

console.log("Done");
