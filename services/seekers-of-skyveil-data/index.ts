import { $ } from "bun";
import {
  readDirRecursive,
  readDirSync,
  readJSON,
  saveImage,
  writeJSON,
} from "./lib/fs.js";
import { addCircleToImage, mergeImages } from "./lib/image.js";

const CONTENT_DIR = "/mnt/c/dev/Seekers of Skyveil/Extracted/Data";
const TEXTURE_DIR = "/mnt/c/dev/Seekers of Skyveil/Extracted/Texture";
const TEMP_DIR =
  "/home/devleon/the-hidden-gaming-lair/services/seekers-of-skyveil-data/out";
const OUT_DIR =
  "/home/devleon/the-hidden-gaming-lair/static/seekers-of-skyveil";

/*
CD = Creature Den
BG = Blooming Grove
GL = Grasslands
HF = Heart of the Forest
*/
const textures = await readDirSync(
  TEXTURE_DIR +
    "/blueberry/Content/BB/Maps/Forest/Dungeons/AncientThicket/Textures",
);

const surfaces = textures
  .filter((t) => t.includes("_AncientThicket_"))
  // .filter((t) => t.includes("_BG"))
  .map(
    (t) =>
      TEXTURE_DIR +
      "/blueberry/Content/BB/Maps/Forest/Dungeons/AncientThicket/Textures/" +
      t,
  )
  .sort((a) => (a.includes("Key") ? -1 : 1));
const tunnels = textures
  .filter((t) => t.includes("_Tunnels_"))
  // .filter((t) => t.includes("_BG"))
  .map(
    (t) =>
      TEXTURE_DIR +
      "/blueberry/Content/BB/Maps/Forest/Dungeons/AncientThicket/Textures/" +
      t,
  );
const surface = await mergeImages(surfaces);
const tunnel = await mergeImages(tunnels);
const maps = { surface, tunnel };

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
const TILE_SIZE = 512;

const SURFACE = {
  ORTHOGRAPHIC_WIDTH: 90000,
  OFFSET_X: 950,
  OFFSET_Y: 26000,
  CAMERA_ANGLE: 45,
};

const TUNNEL = {
  ORTHOGRAPHIC_WIDTH: 35200,
  OFFSET_X: -43065,
  OFFSET_Y: -28260,
  CAMERA_ANGLE: 45,
};

// static constexpr float OrthographicWidth = 35200.0f;
// static constexpr float OffsetX = -43065.0f;
// static constexpr float OffsetY = -28260.0f;
// static constexpr float CameraAngle = 45.0f;
// static constexpr float MapAnchorCoordinatesX = -25000.0f;
// static constexpr float MapAnchorCoordinatesY = -10000.0f;

for (const [mapName, canvas] of Object.entries(maps)) {
  const imagePath = TEMP_DIR + "/" + mapName + ".png";
  saveImage(imagePath, canvas.toBuffer("image/png"));

  const WIDTH =
    mapName === "surface"
      ? SURFACE.ORTHOGRAPHIC_WIDTH
      : TUNNEL.ORTHOGRAPHIC_WIDTH;
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
    await $`mkdir -p ${outDir}`;
    await $`vips dzsave ${imagePath} ${outDir} --tile-size 512 --background 0 --overlap 0 --layout google --suffix .jpg[Q=100]`;

    for (const file of readDirRecursive(outDir)) {
      if (file.includes("blank")) {
        await $`rm ${file}`;
        continue;
      }
      if (file.endsWith(".jpg") || file.endsWith(".png")) {
        await $`cwebp ${file} -o ${file.replace(".jpg", ".webp").replace(".png", ".webp")}`;
        await $`rm ${file}`;
      }
    }
  }
  tiles[mapName] = {
    url: `/map-tiles/${mapName}/{z}/{y}/{x}.webp`,
    options: {
      minNativeZoom: 0,
      maxNativeZoom: 3,
      bounds: MAP_BOUNDS,
      tileSize: TILE_SIZE,
    },
    minZoom: 0,
    maxZoom: 5,
    fitBounds: MAP_BOUNDS,
    transformation: [1 / MULTIPLE, OFFSET[0], 1 / MULTIPLE, OFFSET[1]],
  };
}

const enDict: Record<string, string> = {
  locations: "Locations",
  surface: "Surface",
  tunnel: "Tunnel",
  airDrop: "Air Drop",
  // tunnel: "Tunnel",
  items: "Items",
  chestStarter: "Chest Starter",
  chestBackpack: "Chest Backpack",
  chestT1: "Chest T1",
  chestT2: "Chest T2",
  chestT3: "Chest T3",
  shrines: "Shrines",
  shrineAttackSpeed: "Attack Speed",
  shrineCooldownReduction: "Cooldown Reduction",
  shrineMaxHealth: "Max Health",
  shrineMovementSpeed: "Movement Speed",
  shrineShield: "Shield",
  altars: "Altars",
  altarMovementSpeed: "Movement Speed",
  altarHeal: "Heal",
  altarSpiritItem: "Weapon",
  altarItemSink: "Wishing Well",
  monsters: "Monsters",
  creatureCommon: "Common",
  creatureNormal: "Normal",
  creatureEvent: "Event",
  creatureElite: "Elite",
  creatureUnique: "Unique",
  creatureBoss: "Boss",
};
const nodes: {
  type: string;
  mapName: string;
  spawns: { p: [number, number] }[];
}[] = [];
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
}[] = [];
const locationsGroup: (typeof filters)[number] = {
  group: "locations",
  defaultOpen: true,
  defaultOn: true,
  values: [],
};
const itemsGroup: (typeof filters)[number] = {
  group: "items",
  defaultOpen: true,
  defaultOn: true,
  values: [],
};
const shrinesGroup: (typeof filters)[number] = {
  group: "shrines",
  defaultOpen: true,
  defaultOn: true,
  values: [],
};
const altarsGroup: (typeof filters)[number] = {
  group: "altars",
  defaultOpen: true,
  defaultOn: true,
  values: [],
};
const monstersGroup: (typeof filters)[number] = {
  group: "monsters",
  defaultOpen: true,
  defaultOn: true,
  values: [],
};

const mapData = await readDirSync(
  CONTENT_DIR + "/blueberry/Content/BB/Maps/Forest/Dungeons/AncientThicket",
);

const savedIcons: string[] = [];
const icons: Record<string, string> = {
  airDrop: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_Icon_DamageDealt.png`,
  ),
  boss: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_Icon_Monsters.png`,
  ),
  specialLoot: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_MinimapIcon_Chest_Special.png`,
  ),
  chestStarter: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_MinimapIcon_Chest.png`,
    "lightgrey",
  ),
  chestBackpack: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_MinimapIcon_Chest.png`,
    "purple",
  ),
  chestT1: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_MinimapIcon_Chest.png`,
    "lightgreen",
  ),
  chestT2: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_MinimapIcon_Chest.png`,
    "lightblue",
  ),
  chestT3: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_MinimapIcon_Chest.png`,
    "orange",
  ),
  tunnel: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/MapIcons/T_UI_Tunnel_Icon.png`,
  ),
  creatureCommon: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_Icon_Monsters.png`,
    "lightgrey",
  ),
  creatureNormal: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_Icon_Monsters.png`,
    "lightblue",
  ),
  creatureEvent: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_Icon_Monsters.png`,
    "gold",
  ),
  creatureElite: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_Icon_Monsters_Special.png`,
    "orange",
  ),
  creatureUnique: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_Icon_Monsters_Special.png`,
    "red",
  ),
  creatureBoss: await saveIcon(
    `${TEXTURE_DIR}/blueberry/Content/BB/UI/Textures/Icons/T_Icon_Monsters_Special.png`,
    "lightgreen",
  ),
  shrineAttackSpeed: await saveIcon(
    `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/star-altar_delapouite.webp`,
    "green",
  ),
  shrineCooldownReduction: await saveIcon(
    `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/star-altar_delapouite.webp`,
    "turquoise",
  ),
  shrineMaxHealth: await saveIcon(
    `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/star-altar_delapouite.webp`,
    "red",
  ),
  shrineMovementSpeed: await saveIcon(
    `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/star-altar_delapouite.webp`,
    "yellow",
  ),
  shrineShield: await saveIcon(
    `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/star-altar_delapouite.webp`,
    "blue",
  ),
  altarMovementSpeed: await saveIcon(
    `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/shinto-shrine-mirror_delapouite.webp`,
    "yellow",
  ),
  altarHeal: await saveIcon(
    `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/shinto-shrine-mirror_delapouite.webp`,
    "red",
  ),
  altarSpiritItem: await saveIcon(
    `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/sword-altar_delapouite.webp`,
    // "purple"
  ),
  altarItemSink: await saveIcon(
    `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/well_delapouite.webp`,
    // "gold"
  ),
};
const types = new Set<string>();
for (const map of mapData) {
  if (!map.endsWith(".json")) {
    continue;
  }
  // if (!map.includes("_BG_") && !map.includes("_GL_") && !map.includes("_HF_")) {
  //   continue;
  // }
  const items = readJSON<any[]>(
    CONTENT_DIR +
      `/blueberry/Content/BB/Maps/Forest/Dungeons/AncientThicket/${map}`,
  );
  let mapName = map.includes("_TN") ? "tunnel" : "surface";
  for (const item of items) {
    if (!item.Properties?.RelativeLocation) {
      continue;
    }
    const id = item.Outer;
    types.add(id);
    let target;

    let size = 2;
    let type = item.Name;
    if (item.Outer.startsWith("BP_AirDrop_EventMarker_")) {
      target = locationsGroup;
      type = "airDrop";
    } else if (item.Outer.includes("BP_Teleport")) {
      mapName = item.Outer.includes("Exit") ? "tunnel" : "surface";
      target = locationsGroup;
      type = "tunnel";
    } else if (item.Outer.includes("TreasureChest")) {
      target = itemsGroup;
      // if (item.Outer.includes("P_")) {
      //   type = "SpecialLoot";
      // } else
      if (item.Outer.includes("Starter")) {
        type = "chestStarter";
      } else if (item.Outer.includes("Backpack")) {
        type = "chestBackpack";
      } else if (item.Outer.includes("Tier1")) {
        type = "chestT1";
      } else if (item.Outer.includes("Tier2")) {
        type = "chestT2";
      } else if (item.Outer.includes("Tier3")) {
        type = "chestT3";
      } else {
        throw new Error("Unknown chest type: " + item.Outer);
      }
      if (item.Outer.includes("_Linked_")) {
        const main = items.find((i) => i.Name === item.Outer)!;
        const extractionSpawnPoint = items.find(
          (i) =>
            i.Name ===
            main.Properties.LinkedSpawnPoint.ObjectName.split(".")[1].split(
              "'",
            )[0],
        )!;

        const creaturesToSpawnData = readJSON<any[]>(
          CONTENT_DIR +
            `/${extractionSpawnPoint.Properties.CreaturesToSpawnData.ObjectPath.replace(/\.\d+/, ".json")}`,
        );
        const targetCreatures =
          creaturesToSpawnData[0].Properties.CreaturesToSpawn.map(
            (creatureToSpawn) => {
              // creatureToSpawn.SpawnLevel
              const creature = readJSON<any[]>(
                CONTENT_DIR +
                  `/${creatureToSpawn.CreatureToSpawn.ObjectPath.replace(/\.\d+/, ".json")}`,
              );
              const subData = creature.find(
                (c) => c.Properties?.CreatureCharacterData,
              );
              const creatureCharacterData = readJSON<any[]>(
                CONTENT_DIR +
                  `/${subData.Properties.CreatureCharacterData.ObjectPath.replace(/\.\d+/, ".json")}`,
              );
              return `${creatureCharacterData[0].Properties.Name.LocalizedString}`;
            },
          );
        enDict[`${id}_desc`] =
          `<b>Defeat to unlock this chest:</b><br>${targetCreatures.join("<br>")}`;
      }
    } else if (item.Outer.startsWith("BP_CreatureSpawnPoint")) {
      target = monstersGroup;
      if (item.Outer.includes("Unique")) {
        size = 2;
        type = "creatureUnique";
      } else if (item.Outer.includes("Elite")) {
        size = 1.5;
        type = "creatureElite";
      } else if (item.Outer.includes("Boss")) {
        size = 1.5;
        type = "creatureBoss";
      } else if (item.Outer.includes("Event")) {
        size = 1.5;
        type = "creatureEvent";
      } else if (item.Outer.includes("Normal")) {
        size = 1.5;
        type = "creatureNormal";
      } else {
        size = 1.5;
        type = "creatureCommon";
      }

      const base = items.find((i) => i.Name === item.Outer);
      const objectPath = base.Properties.CreaturesToSpawnData.ObjectPath;
      const creatureSpawnData = readJSON<any[]>(
        CONTENT_DIR + `/${objectPath.replace(/\.\d+/, ".json")}`,
      );

      for (const creatureToSpawn of creatureSpawnData[0].Properties
        .CreaturesToSpawn) {
        const id = creatureToSpawn.CreatureToSpawn.ObjectName.split("'")[1];
        // creatureToSpawn.SpawnLevel
        if (!enDict[id]) {
          const creature = readJSON<any[]>(
            CONTENT_DIR +
              `/${creatureToSpawn.CreatureToSpawn.ObjectPath.replace(/\.\d+/, ".json")}`,
          );
          const subData = creature.find(
            (c) => c.Properties?.CreatureCharacterData,
          );
          const creatureCharacterData = readJSON<any[]>(
            CONTENT_DIR +
              `/${subData.Properties.CreatureCharacterData.ObjectPath.replace(/\.\d+/, ".json")}`,
          );

          enDict[id] = creatureCharacterData[0].Properties.Name.LocalizedString;
          if (creatureCharacterData[0].Properties.Description) {
            enDict[`${id}_desc`] =
              creatureCharacterData[0].Properties.Description.LocalizedString;
          }
        }
        pushSpawnPoint(type, mapName, item, id, target, size);
      }
      continue;
    } else if (item.Outer.startsWith("BP_ExtractionAltar_")) {
      target = item.Outer.includes("Perm") ? shrinesGroup : altarsGroup;

      if (item.Outer.includes("AttackSpeedPerm")) {
        type = "shrineAttackSpeed";
      } else if (item.Outer.includes("CooldownReductionPerm")) {
        type = "shrineCooldownReduction";
      } else if (item.Outer.includes("MaxHealthPerm")) {
        type = "shrineMaxHealth";
      } else if (item.Outer.includes("MoveSpeedPerm")) {
        type = "shrineMovementSpeed";
      } else if (item.Outer.includes("ShieldPerm")) {
        type = "shrineShield";
      } else if (item.Outer.includes("MoveSpeedTemp")) {
        type = "altarMovementSpeed";
      } else if (item.Outer.includes("Heal")) {
        type = "altarHeal";
      } else if (item.Outer.includes("ItemSink")) {
        type = "altarItemSink";
      } else if (item.Outer.includes("SpiritItem")) {
        type = "altarSpiritItem";
      } else {
        throw new Error("Unknown altar type: " + item.Outer);
      }
    } else {
      continue;
    }
    pushSpawnPoint(type, mapName, item, id, target, size);
  }
}

filters.push(locationsGroup);
filters.push(shrinesGroup);
filters.push(altarsGroup);
filters.push(itemsGroup);
filters.push(monstersGroup);

writeJSON(OUT_DIR + "/coordinates/tiles.json", tiles);
writeJSON(OUT_DIR + "/coordinates/filters.json", filters);
writeJSON(OUT_DIR + "/coordinates/nodes.json", nodes);
writeJSON(OUT_DIR + "/dicts/en.json", enDict);
writeJSON(TEMP_DIR + "/types.json", Array.from(types).sort());

function pushSpawnPoint(
  type: string,
  mapName: string,
  item: any,
  id: string,
  target: any,
  size: number,
) {
  if (!nodes.some((n) => n.type === type && n.mapName === mapName)) {
    nodes.push({
      type: type,
      mapName,
      spawns: [],
    });
  }
  const category = nodes.find((n) => n.type === type && n.mapName === mapName)!;
  const offset = mapName === "surface" ? SURFACE : TUNNEL;
  const location = normalizeLocation(item.Properties.RelativeLocation, offset);
  const spawn = {
    id,
    p: [-location.X, location.Y] as [number, number],
  };
  if (
    !category.spawns.some(
      (s) =>
        "id" in s &&
        s.id === id &&
        s.p[0] === spawn.p[0] &&
        s.p[1] === spawn.p[1],
    )
  ) {
    category.spawns.push(spawn);
  } else {
    // console.log("Duplicate spawn point", spawn);
  }

  if (!target.values.some((v) => v.id === type)) {
    target.values.push({
      id: type,
      icon: icons[type],
      size,
    });
  }
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function normalizeLocation(
  location: { X: number; Y: number; Z: number },
  {
    OFFSET_X,
    OFFSET_Y,
    CAMERA_ANGLE,
  }: { OFFSET_X: number; OFFSET_Y: number; CAMERA_ANGLE: number },
): { X: number; Y: number; Z: number } {
  const x = location.X - OFFSET_X;
  const y = location.Y - OFFSET_Y;
  const angle = toRadians(-CAMERA_ANGLE);
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  const newX = x * cosAngle - y * sinAngle;
  const newY = x * sinAngle + y * cosAngle;
  return { X: newX, Y: newY, Z: location.Z };
}

async function saveIcon(assetPath: string, color?: string) {
  const fileName = assetPath.split("/").at(-1)?.split(".")[0]!;

  const id = fileName + (color ? `_${color}` : "");
  if (savedIcons.includes(id)) {
    return `${id}.webp`;
  }

  if (color) {
    console.log("Saving icon", id, assetPath, color);
    const canvas = await addCircleToImage(assetPath, color);
    saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
    await $`cwebp ${TEMP_DIR}/${id}.png -o ${OUT_DIR}/icons/${id}.webp -short`;
  } else {
    console.log("Saving icon", id, assetPath);
    await $`cwebp ${assetPath} -o ${OUT_DIR}/icons/${id}.webp -short`;
  }

  savedIcons.push(id);
  return `${id}.webp`;
}
