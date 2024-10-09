import uniqolor from "uniqolor";
import { CONTENT_DIR, initDirs, TEMP_DIR, TEXTURE_DIR } from "./lib/dirs.js";
import { initFilters, writeFilters } from "./lib/filters.js";
import { readDirSync, readJSON, saveImage } from "./lib/fs.js";
import { arrayJoinImages, mergeImages, saveIcon } from "./lib/image.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initDict, writeDict } from "./lib/dicts.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import {
  Bounties,
  GlobalMarkers,
  HiddenCaches,
  MarkerSet,
  Quest,
  Sanctuary_Eastern_Continent,
  StringList,
  Subzone,
  TrackedReward,
} from "./diablo4.types.js";

initDirs(
  String.raw`C:\dev\DiabloIV\d4data\json`,
  // String.raw`C:\dev\DiabloIV\d4data_ptr\json`,
  String.raw`C:\dev\DiabloIV\d4-texture-extractor\png`,
  String.raw`C:\dev\the-hidden-gaming-lair\static\diablo4`,
);

const tiles = initTiles({
  Sanctuary: {
    url: "/map-tiles/Sanctuary/{z}/{y}/{x}.webp",
    options: {
      minNativeZoom: 0,
      maxNativeZoom: 6,
      bounds: [
        [-8, -50],
        [-247, 188],
      ],
      tileSize: 512,
      threshold: 127,
    },
    minZoom: 0,
    maxZoom: 6,
    fitBounds: [
      [0, 0],
      [-184, 184],
    ],
    transformation: [1.65, 86.6, -1.65, -11.35],
  },
});

const mapImages = await readDirSync(TEXTURE_DIR).filter(
  (f) => f.startsWith("zmap_") && f.match(/_\d\d_\d\d.png$/),
);
const mapImagesByName = mapImages.reduce(
  (acc, f) => {
    const mapName = f
      .match(/(.+)_\d\d_\d\d.png$/)![1]
      .replace("zmap_", "")
      .replace("_Eastern_Continent", "");
    if (mapName !== "Sanctuary") {
      return acc;
    }
    const fileName = TEXTURE_DIR + "/" + f;
    if (!acc[mapName]) {
      acc[mapName] = [];
    }
    acc[mapName].push(fileName);
    return acc;
  },
  {} as Record<string, string[]>,
);

for (const [mapName, images] of Object.entries(mapImagesByName)) {
  if (Bun.argv.includes("--tiles")) {
    await arrayJoinImages(
      images,
      /_(-?\d+)_(-?\d+)/,
      `${TEMP_DIR}/${mapName}.png`,
    );
  }

  // tiles[mapName] = (
  await generateTiles(
    mapName,
    `${TEMP_DIR}/${mapName}.png`,
    301,
    512,
    [150, 150],
    undefined,
    undefined,
    undefined,
    [1, -1],
  );
  // )[mapName];
}
writeTiles(tiles);

await saveIcon("/slices/2DUIMinimapIcons/4248556590.png", "player");

const nodes = initNodes();
const filters = initFilters([
  {
    group: "locations",
    defaultOpen: true,
    defaultOn: true,
    values: [
      {
        id: "altarsOfLilith",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/4194820567.png",
          "altarsOfLilith",
        ),
        size: 1.5,
      },
      {
        id: "tenetOfAkarat",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/3548354396.png",
          "tenetOfAkarat",
        ),
        size: 1.5,
      },
      {
        id: "cellars",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1573024828.png",
          "cellars",
        ),
        size: 1.5,
      },
      {
        id: "dungeons",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1741287201.png",
          "dungeons",
        ),
        size: 1.5,
      },
      {
        id: "sideQuestDungeons",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1287872359.png",
          "sideQuestDungeons",
        ),
        size: 1.5,
      },
      {
        id: "campaignDungeons",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/3566347010.png",
          "campaignDungeons",
        ),
        size: 1.5,
      },
      {
        id: "stash",
        icon: await saveIcon("/slices/2DUIMinimapIcons/523040772.png", "stash"),
        size: 2,
      },
      {
        id: "strongholds",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/3122276994.png",
          "strongholds",
        ),
        size: 2,
      },
      {
        id: "waypoints",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/889034296.png",
          "waypoints",
        ),
        size: 2,
      },
      {
        id: "wardrobes",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/2294324951.png",
          "wardrobes",
        ),
        size: 2,
      },
      {
        id: "worldTierStatue",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1601625104.png",
          "worldTierStatue",
        ),
        size: 2,
      },
    ],
  },
  {
    group: "services",
    defaultOpen: true,
    defaultOn: true,
    values: [
      {
        id: "alchemists",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/828137185.png",
          "alchemists",
        ),
        size: 1.5,
      },
      {
        id: "blacksmiths",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1518318179.png",
          "blacksmiths",
        ),
        size: 1.5,
      },
      {
        id: "healers",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/3927157842.png",
          "healers",
        ),
        size: 1.5,
      },
      {
        id: "gamblers",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/3905225007.png",
          "gamblers",
        ),
        size: 1.5,
      },
      {
        id: "jewelers",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1557137717.png",
          "jewelers",
        ),
        size: 1.5,
      },
      {
        id: "occultists",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1736753223.png",
          "occultists",
        ),
        size: 1.5,
      },
      {
        id: "silversmiths",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/3510500336.png",
          "silversmiths",
        ),
        size: 1.5,
      },
      {
        id: "stableMasters",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1126344873.png",
          "stableMasters",
        ),
        size: 1.5,
      },
      {
        id: "weapons",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1265112984.png",
          "weapons",
        ),
        size: 1.5,
      },
    ],
  },
  {
    group: "quests",
    defaultOpen: true,
    defaultOn: false,
    values: [
      {
        id: "sideQuests",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/360808697.png",
          "sideQuests",
        ),
        size: 1.5,
      },
      {
        id: "campaignQuests",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/3837410649.png",
          "campaignQuests",
        ),
        size: 1.5,
      },
      {
        id: "events",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/503808014.png",
          "events",
        ),
        size: 1.5,
      },
    ],
  },
  {
    group: "Chests",
    defaultOpen: true,
    defaultOn: false,
    values: [
      {
        id: "chestGuardian",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/43109186.png",
          "chestGuardian",
          { color: "#c4a4f6", circle: false, threshold: 100 },
        ),
        size: 2,
      },
      {
        id: "chestT3",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/43109186.png",
          "chestT3",
        ),
        size: 2,
      },
    ],
  },
  {
    group: "enemies",
    defaultOpen: true,
    defaultOn: true,
    values: [
      {
        id: "boss",
        icon: await saveIcon("/slices/2DUIMinimapIcons/3438342714.png", "boss"),
        size: 2,
      },
      {
        id: "unique",
        icon: await saveIcon("/slices/2DUIMinimapIcons/83908665.png", "unique"),
        size: 2,
      },
    ],
  },
  {
    group: "monsters",
    defaultOpen: true,
    defaultOn: false,
    values: [
      {
        id: "bandit",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "bandit",
          { color: uniqolor("bandit").color },
        ),
        size: 1,
      },
      {
        id: "cannibal",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "cannibal",
          { color: uniqolor("cannibal").color },
        ),
        size: 1,
      },
      {
        id: "cultist",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "cultist",
          { color: uniqolor("cultist").color },
        ),
        size: 1,
      },
      {
        id: "demon",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "demon",
          { color: uniqolor("demon").color },
        ),
        size: 1,
      },
      {
        id: "drown",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "drown",
          { color: uniqolor("drown").color },
        ),
        size: 1,
      },
      {
        id: "fallen",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "fallen",
          { color: uniqolor("fallen").color },
        ),
        size: 1,
      },
      {
        id: "ghost",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "ghost",
          { color: uniqolor("ghost").color },
        ),
        size: 1,
      },
      {
        id: "goatman",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "goatman",
          { color: uniqolor("goatman").color },
        ),
        size: 1,
      },
      {
        id: "knight",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "knight",
          { color: uniqolor("knight").color },
        ),
        size: 1,
      },
      {
        id: "skeleton",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "skeleton",
          { color: uniqolor("skeleton").color },
        ),
        size: 1,
      },
      {
        id: "snake",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "snake",
          { color: uniqolor("snake").color },
        ),
        size: 1,
      },
      {
        id: "spider",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "spider",
          { color: uniqolor("spider").color },
        ),
        size: 1,
      },
      {
        id: "vampire",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "vampire",
          { color: uniqolor("vampire").color },
        ),
        size: 1,
      },
      {
        id: "werewolf",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "werewolf",
          { color: uniqolor("werewolf").color },
        ),
        size: 1,
      },
      {
        id: "wildlife",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "wildlife",
          { color: uniqolor("wildlife").color },
        ),
        size: 1,
      },
      {
        id: "zombie",
        icon: await saveIcon(
          "/slices/2DUIMinimapIcons/1393108954.png",
          "zombie",
          { color: uniqolor("zombie").color },
        ),
        size: 1,
      },
    ],
  },
]);

const enDict = initDict({
  frac: "Fractured Peaks",
  hawe: "Hawezar",
  scos: "Scosglen",
  step: "Dry Steppes",
  kehj: "Kehjistan",
  altarsOfLilith: "Altars of Lilith",
  tenetOfAkarat: "Tenet of Akarat",
  cellars: "Cellars",
  dungeons: "Dungeons",
  sideQuestDungeons: "Side Quest Dungeons",
  campaignDungeons: "Campaign Dungeons",
  locations: "Locations",
  stash: "Stash",
  strongholds: "Strongholds",
  waypoints: "Waypoints",
  wardrobes: "Wardrobes",
  worldTierStatue: "World Tier Statue",
  services: "Services",
  alchemists: "Alchemists",
  blacksmiths: "Blacksmiths",
  healers: "Healers",
  gamblers: "Gamblers",
  jewelers: "Jewelers",
  occultists: "Occultists",
  silversmiths: "Rings & Amulets",
  stableMasters: "Stable Masters",
  weapons: "Weapons",
  quests: "Quests",
  chestGuardian: "Living Steel",
  chestT3: "Mystery",
  sideQuests: "Side Quests",
  campaignQuests: "Campaign Quests",
  events: "Events",
  enemies: "Enemies",
  boss: "Bosses",
  unique: "Unique Elites",
  monsters: "Monsters",
  bandit: "Bandits",
  cannibal: "Cannibals",
  cultist: "Cultists",
  demon: "Demons",
  drown: "Drowns",
  fallen: "Fallen",
  ghost: "Ghosts",
  goatman: "Goatmen",
  knight: "Knights",
  skeleton: "Skeletons",
  snake: "Snakes",
  spider: "Spiders",
  vampire: "Vampires",
  werewolf: "Werewolves",
  wildlife: "Wildlife",
  zombie: "Zombies",
});

const regions = initRegions();

const continent = await readJSON<Sanctuary_Eastern_Continent>(
  CONTENT_DIR + "/base/meta/World/Sanctuary_Eastern_Continent.wrl.json",
);
const globalMarkers = await readJSON<GlobalMarkers>(
  CONTENT_DIR + "/base/meta/Global/global_markers.glo.json",
);
const hiddenCaches = await readJSON<HiddenCaches>(
  CONTENT_DIR + "/base/meta/GameBalance/HiddenCaches.gam.json",
);
const bounties = await readJSON<Bounties>(
  CONTENT_DIR + "/base/meta/Global/bounties.glo.json",
);

// const SCALE = continent.unk_d9c79d2.unk_ae5bfbd;

const toCamelCase = (str: string) => {
  return (
    str[0].toLowerCase() +
    str.slice(1).replace(/_\w/g, (m) => m[1].toUpperCase())
  );
};

const SCALE = 0.083492;
const DEG_45 = Math.PI / 4; // 45 degrees in radians
const OFFSET = {
  x: 113.2,
  y: -227.4,
};
const normalizePoint = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const scaledX = x * SCALE;
  const scaledY = y * SCALE;
  const rotatedX = scaledX * Math.cos(DEG_45) - scaledY * Math.sin(DEG_45);
  const rotatedY = scaledX * Math.sin(DEG_45) + scaledY * Math.cos(DEG_45);
  return [
    +((-rotatedY + OFFSET.y) / 1.65).toFixed(5),
    +((-rotatedX + OFFSET.x) / 1.65).toFixed(5),
    Number(z.toFixed(5)),
  ] as [number, number, number];
};

function normalizeTerm(str: string) {
  return str.replace(/.*]/, "").replace(/.*}/, "").replace(".", "").trim();
}

async function readTerms(name: string) {
  try {
    const terms = await readJSON<StringList>(
      CONTENT_DIR + `/enUS_Text/meta/StringList/${name}.stl.json`,
    );
    if (!terms) {
      return [];
    }
    return terms.arStrings;
  } catch (e) {
    console.warn("Missing terms", name);
    return [];
  }
}

for (const regionBoundary of continent.arRegionBoundaries) {
  const stringId = regionBoundary.snoTerritory.name;
  const id = `territories:${stringId}`;
  enDict[id] = (await readTerms(`Territory_${stringId}`))[0].szText;
  const border = regionBoundary.arPoints
    .map((vector) => normalizePoint({ x: vector.x, y: vector.y, z: 0 }))
    .map(([x, y]) => [x, y] as [number, number]);
  const center = border.reduce(
    (acc, [x, y]) => [acc[0] + x, acc[1] + y],
    [0, 0],
  );
  center[0] /= border.length;
  center[1] /= border.length;

  const region = {
    id,
    center,
    border,
    mapName: "Sanctuary",
  };

  const parts = stringId.split("_");
  parts[0] = parts[0].slice(0, 4);
  const filename =
    CONTENT_DIR + `/base/meta/Subzone/${parts.join("_")}.sbz.json`;
  try {
    const subzone = await readJSON<Subzone>(filename);
    if (subzone) {
      const { nLevelScalingMin, nLevelScalingMax } =
        subzone.tPrivateLevelScalingDataOverride;
      enDict[`${id}_desc`] = `${nLevelScalingMin}-${nLevelScalingMax}`;
    }
  } catch (err) {
    console.error(filename);
  }

  regions.push(region);
}

const isPointInsidePolygon = (
  point: readonly [number, number, number],
  polygon: readonly (readonly [number, number])[],
) => {
  const x = point[0];
  const y = point[1];

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

export const getRegionByPoint = (point: [number, number, number]) => {
  return regions.find((region) => isPointInsidePolygon(point, region.border));
};

const DUNGEON_TYPES = ["Portal_Dungeon_Generic", "Portal_Dungeon_Cellar"];
const CELLAR_TYPES = ["Portal_Cellar_Generic", "Portal_Cellar_Flat"];

for (const actor of globalMarkers.ptContent[0].arGlobalMarkerActors) {
  if (!actor.snoActor.name) {
    continue;
  }
  const spawn: (typeof category.spawns)[number] = {
    p: normalizePoint(actor.tWorldTransform.wp),
  };
  let type;
  if (actor.snoActor.name === "Waypoint_Temp") {
    const stringId = `${actor.snoLevelArea!.groupName}_${actor.snoLevelArea!.name}`;
    spawn.id = stringId;
    const term = (await readTerms(stringId))[0];
    enDict[spawn.id] = term.szText;
    type = "waypoints";
  } else if (
    DUNGEON_TYPES.includes(actor.snoActor.name) ||
    CELLAR_TYPES.includes(actor.snoActor.name)
  ) {
    const stringId = actor.ptData[0].snoSpecifiedWorld!.name!;
    if (!stringId) {
      console.warn("Missing snoSpecifiedWorld", actor.snoActor.name);
      continue;
    }
    // const groupName = actor.ptData[0].snoSpecifiedWorld!.groupName!;
    const isCellar =
      !stringId.startsWith("DGN_") &&
      CELLAR_TYPES.includes(actor.snoActor.name);
    const isDungeon = stringId.startsWith("DGN_");
    const isSideQuestDungeon = stringId.startsWith("QST_");
    const isCampaignDungeon = stringId.startsWith("CSD");
    if (isCellar) {
      type = "cellars";
    } else if (isDungeon) {
      type = "dungeons";
    } else if (isSideQuestDungeon) {
      type = "sideQuestDungeons";
    } else if (isCampaignDungeon) {
      type = "campaignDungeons";
    } else {
      console.warn("Unknown dungeon type", stringId);
      continue;
    }
    spawn.id = stringId;
    const worldTerms = await readTerms(`World_${stringId}`);
    const name = worldTerms
      .find((term) => term.szLabel === "Name")
      ?.szText.trim();
    const description = worldTerms.find(
      (term) => term.szLabel === "Desc",
    )?.szText;

    if (name) {
      enDict[spawn.id] = name;
    }
    if (description) {
      enDict[`${spawn.id}_desc`] = description + "<br>";
    } else {
      enDict[`${spawn.id}_desc`] = "";
    }
    const rewardName =
      actor.ptData[0].snoPortalDestObjectiveTrackedReward?.name;
    if (rewardName) {
      const trackedReward = await readJSON<TrackedReward>(
        CONTENT_DIR + `/base/meta/TrackedReward/${rewardName}.trd.json`,
      );
      const aspect = trackedReward.snoAspect!;
      const aspectId = aspect.name.replace("Asp_", "");
      const termId = aspectId.includes("Spiritborn")
        ? `Affix_${aspectId.toLowerCase()}_x1`
        : `Affix_${aspectId.toLowerCase()}`;
      const aspectTerms = await readTerms(termId);
      const aspectName = aspectTerms.find(
        (term) => term.szLabel === "Name",
      )!.szText;
      enDict[`${spawn.id}_desc`] += `<b>Aspect ${aspectName}</b>`;
      enDict[`${spawn.id}_tags`] = `Aspect ${aspectName}`;

      let color;
      let iconName = `dungeons_`;
      if (aspectId.includes("Barb")) {
        iconName += "Barbarian";
        color = uniqolor("Barbarian").color;
        enDict[`${spawn.id}_desc`] +=
          `<p style="color: ${color}">Barbarian</p>`;
        enDict[`${spawn.id}_tags`] += " Barbarian";
      } else if (aspectId.includes("Druid")) {
        iconName += "Druid";
        color = uniqolor("Druid").color;
        enDict[`${spawn.id}_desc`] += `<p style="color: ${color}">Druid</p>`;
        enDict[`${spawn.id}_tags`] += " Druid";
      } else if (aspectId.includes("Necro")) {
        iconName += "Necromancer";
        color = uniqolor("Necromancer").color;
        enDict[`${spawn.id}_desc`] +=
          `<p style="color: ${color}">Necromancer</p>`;
        enDict[`${spawn.id}_tags`] += " Necromancer";
      } else if (aspectId.includes("Sorc")) {
        iconName += "Sorcerer";
        color = uniqolor("Sorcerer").color;
        enDict[`${spawn.id}_desc`] += `<p style="color: ${color}">Sorcerer</p>`;
        enDict[`${spawn.id}_tags`] += " Sorcerer";
      } else if (aspectId.includes("Rogue")) {
        iconName += "Rogue";
        color = uniqolor("Rogue").color;
        enDict[`${spawn.id}_desc`] += `<p style="color: ${color}">Rogue</p>`;
        enDict[`${spawn.id}_tags`] += " Rogue";
      } else if (aspectId.includes("Generic")) {
        iconName += "Generic";
        color = uniqolor("Generic").color;
        enDict[`${spawn.id}_desc`] += `<p style="color: ${color}">Generic</p>`;
        enDict[`${spawn.id}_tags`] += " Generic";
      }
      if (color) {
        spawn.icon = {
          name: iconName,
          url: await saveIcon(
            "/slices/2DUIMinimapIcons/1741287201.png",
            iconName,
            {
              color,
              circle: true,
            },
          ),
        };
      }
    }
  } else if (actor.snoActor.name.includes("AkaratShrine")) {
    const stringId = actor.snoLevelArea!.name!;
    spawn.id = stringId;
    const worldTerms = await readTerms(`LevelArea_${stringId}`);
    enDict[spawn.id] = worldTerms[0].szText;
    type = "tenetOfAkarat";
  } else if (actor.snoActor.name.includes("LilithShrine")) {
    const stringId = actor.snoLevelArea!.name!;
    spawn.id = stringId;
    const worldTerms = await readTerms(`LevelArea_${stringId}`);
    enDict[spawn.id] = worldTerms[0].szText;
    type = "altarsOfLilith";
    const pData = actor.ptData.find((data) => data.gbidHiddenCache)!;
    const hiddenCache = hiddenCaches.ptData[0].tEntries.find(
      (entry) => entry.tHeader?.szName === pData.gbidHiddenCache!.name,
    )!;
    const attribute = hiddenCache.snoTrackedReward.name.match(/TR_(.*)_/)![1];
    let color;
    if (attribute === "Dexterity") {
      color = "#FFC107";
    } else if (attribute === "Strength") {
      color = "#FF5722";
    } else if (attribute === "Obol_Cap") {
      color = "#9C27B0";
    } else if (attribute === "Intelligence") {
      color = "#3F51B5";
    } else if (attribute === "Willpower") {
      color = "#4CAF50";
    } else {
      color = null;
    }
    enDict[`${spawn.id}_desc`] = `<p style="color: ${color}">`;
    if (attribute === "Obol_Cap") {
      const attributeDescriptions = await readTerms(`Map`);
      const term = attributeDescriptions.find(
        (term) => term.szLabel === "RegionProgress_Reward_GamblingCurrency",
      )!;
      enDict[`${spawn.id}_desc`] += normalizeTerm(term.szText);
      enDict[`${spawn.id}_tags`] = normalizeTerm(term.szText);
    } else if (attribute === "Cache_Paragon") {
      const attributeDescriptions = await readTerms(`SkillsUI`);
      const term = attributeDescriptions.find(
        (term) => term.szLabel === "ParagonPointsAvailable",
      )!;
      enDict[`${spawn.id}_desc`] += normalizeTerm(term.szText);
      enDict[`${spawn.id}_tags`] = normalizeTerm(term.szText);
    } else {
      const attributeDescriptions = await readTerms(`AttributeDescriptions`);
      const term = attributeDescriptions.find(
        (term) => term.szLabel === attribute,
      )!;
      enDict[`${spawn.id}_desc`] += normalizeTerm(term.szText);
      enDict[`${spawn.id}_tags`] = normalizeTerm(term.szText);
    }

    const trackedReward = await readJSON<TrackedReward>(
      CONTENT_DIR +
        `/base/meta/TrackedReward/${hiddenCache.snoTrackedReward.name}.trd.json`,
    );
    enDict[`${spawn.id}_desc`] += ` +${trackedReward.flAmount}</p>`;

    if (color) {
      const iconName = `altarsOfLilith_${attribute}`;
      spawn.icon = {
        name: iconName,
        url: await saveIcon(
          "/slices/2DUIMinimapIcons/4194820567.png",
          iconName,
          { color, circle: true },
        ),
      };
    }
  } else {
    continue;
  }

  if (!nodes.some((n) => n.type === type && n.mapName === "Sanctuary")) {
    nodes.push({
      type: type,
      mapName: "Sanctuary",
      spawns: [],
      static: true,
    });
  }
  const category = nodes.find((n) => n.type === type)!;

  category.spawns.push(spawn);
}

const unknownRoles: string[] = [];
const families = [
  "Bandit",
  "Cannibal",
  "Cultist",
  "Demon",
  "Drown",
  "Fallen",
  "Ghost",
  "Goatman",
  "Knight",
  "Skeleton",
  "Snake",
  "Spider",
  "Vampire",
  "Werewolf",
  "Wildlife",
  "Zombie",
].map((family) => family.toLowerCase());
const skippable = [
  "Arrangement",
  "Chest",
  "Cluster",
  "Collection",
  "Intro",
  "prologue",
  "Wall",
].map((skip) => skip.toLowerCase());

for (const fileName of readDirSync(CONTENT_DIR + "/base/meta/MarkerSet")) {
  if (!fileName.endsWith(".mrk.json")) {
    continue;
  }
  if (fileName.includes("Private")) {
    continue;
  }
  const markerSet = await readJSON<MarkerSet>(
    CONTENT_DIR + "/base/meta/MarkerSet/" + fileName,
  );

  for (const marker of markerSet.tMarkerSet) {
    const snoName = marker.snoname?.name ? marker.snoname : null;

    const point = normalizePoint(marker.transform.wp);
    let type;
    let id;

    if (snoName?.name.includes("CampIcon")) {
      type = "strongholds";
      id = `strongholds:${snoName.name}@${point[0]},${point[1]}`;
      enDict[id] = enDict[getRegionByPoint(point)!.id];
    } else if (snoName?.name.startsWith("TWN")) {
      // TWN_Frac_Nevesk_Service_Healer
      const matched = snoName.name.match(
        /TWN_(?<name>.*)_(?<type>.*)_(?<role>.*)/,
      );
      const role = matched?.groups?.role;
      if (!role) {
        // console.warn("Unknown type", snoName.name);
        continue;
      }
      if (
        ![
          "Alchemist",
          "Blacksmith",
          "Healer",
          "Gambler",
          "GamblingTable",
          "GamblingBoard",
          "Jeweler",
          "Occultist",
          "Silversmith",
          "StableMaster",
          "Weapons",
        ].includes(role)
      ) {
        if (!unknownRoles.includes(role)) {
          console.warn("Unknown role", role, fileName, snoName.name);
          unknownRoles.push(role);
        }
        continue;
      }
      type = toCamelCase(role)
        .replace("gamblingTable", "gambling")
        .replace("gamblingBoard", "gambling");
      if (!type.endsWith("s")) {
        type += "s";
      }
      id = `${snoName.name}@${point[0]},${point[1]}`;
      const stringId = `${snoName.groupName}_${snoName.name}`;
      enDict[id] = (await readTerms(stringId))[0].szText;
    } else if (
      snoName &&
      families.some((family) => `${snoName.name}_`.startsWith(family))
    ) {
      if (skippable.some((skip) => snoName.name.includes(skip))) {
        continue;
      }
      const family = families.find((family) =>
        `${snoName.name}_`.startsWith(family),
      )!;
      id = `${family}:${snoName.name}`;
      if (snoName.name.toLowerCase().includes("_unique")) {
        type = "unique";
      } else if (snoName.name.toLowerCase().includes("_boss")) {
        type = "boss";
      } else {
        type = family.toLowerCase();
      }
      try {
        const stringId = `${snoName.groupName}_${snoName.name}`;
        enDict[id] = (await readTerms(stringId))[0].szText;
      } catch (err) {
        id = undefined;
      }
    } else if (
      marker.ptBase.some((a) => a.gbidSpawnLocType?.name.includes("_Chest"))
    ) {
      const name = marker.ptBase[0].gbidSpawnLocType?.name;
      if (name === "UberSubzone_ChestGuardian") {
        type = "chestGuardian";
      } else if (name === "UberSubzone_Chest_t3") {
        id = fileName.split("_")[0].toLowerCase();
        type = "chestT3";
      } else {
        // console.log("Unknown chest", name);
        continue;
      }
    } else if (snoName?.name === "Gizmo_World_Tier_Select") {
      type = "worldTierStatue";
      id = snoName.name;
      enDict[id] = (await readTerms("Actor_Gizmo_World_Tier_Select"))[0].szText;
    } else if (snoName?.name === "Stash") {
      type = "stash";
      id = snoName.name;
      enDict[id] = (await readTerms("Stash"))[0].szText;
    } else if (snoName?.name === "Gizmo_Wardrobe") {
      type = "wardrobes";
      id = snoName.name;
      enDict[id] = (await readTerms("Actor_Gizmo_Wardrobe"))[0].szText;
    } else {
      continue;
    }
    if (!nodes.some((n) => n.type === type && n.mapName === "Sanctuary")) {
      nodes.push({
        type: type,
        mapName: "Sanctuary",
        spawns: [],
      });
    }
    const category = nodes.find((n) => n.type === type)!;
    const spawn: (typeof nodes)[number]["spawns"][number] = id
      ? { id, p: point }
      : { p: point };
    category.spawns.push(spawn);
  }
}

for (const fileName of readDirSync(CONTENT_DIR + "/base/meta/Quest")) {
  if (!fileName.endsWith(".qst.json")) {
    continue;
  }
  const quest = await readJSON<Quest>(
    CONTENT_DIR + "/base/meta/Quest/" + fileName,
  );

  let point;
  if (quest.vecStartLocation.x !== 0 && quest.vecStartLocation.y !== 0) {
    point = normalizePoint(quest.vecStartLocation);
  } else if (
    quest.vecDevStartLocation.x !== 0 &&
    quest.vecDevStartLocation.y !== 0
  ) {
    point = normalizePoint(quest.vecDevStartLocation);
  } else {
    continue;
  }
  const stringId = fileName.replace(".qst.json", "");
  if (
    stringId.includes("_Template_") ||
    stringId.includes("_Test_") ||
    stringId.endsWith("_hidden")
  ) {
    continue;
  }

  const isBounty =
    stringId.startsWith("Bounty_") &&
    quest.arQuestPhases.some(
      (questPhase) => questPhase.snoReward?.groupName === "TreasureClass",
    );
  const isSideQuest = !stringId.startsWith("Bounty_") && quest.eQuestType === 0;
  const isCampaignQuest =
    !stringId.startsWith("Bounty_") && quest.eQuestType === 2;

  let type;
  if (isBounty) {
    continue;
  } else if (isSideQuest) {
    type = "sideQuests";
  } else if (isCampaignQuest) {
    type = "campaignQuests";
  } else {
    console.log(`Unknown type for ${stringId}`);
    continue;
  }

  const id = `${type}:${stringId}@${point[0]},${point[1]}`;

  try {
    const terms = await readTerms(`Quest_${stringId}`);
    const name = terms.find((term) => term.szLabel === "Name");
    const toast =
      terms.find((term) => term.szLabel === "Toast") ||
      terms.find((term) => term.szLabel !== "Name");
    if (!name || !toast) {
      console.log(`Missing terms for ${stringId}`);
      continue;
    }
    enDict[id] = name.szText;
    enDict[`${id}_desc`] = toast.szText;
  } catch (err) {
    console.error(`Error reading terms for ${stringId}`);
    continue;
  }

  if (!nodes.some((n) => n.type === type && n.mapName === "Sanctuary")) {
    nodes.push({
      type: type,
      mapName: "Sanctuary",
      spawns: [],
    });
  }
  const category = nodes.find((n) => n.type === type)!;
  const spawn: (typeof nodes)[number]["spawns"][number] = id
    ? { id, p: point }
    : { p: point };
  category.spawns.push(spawn);
}

const HELLTIDE_WORLD_STATES = [
  "Bounty_LE_Tier1_Frac_Tundra",
  "Bounty_LE_Tier1_Scos_Coast",
  "Bounty_LE_Tier1_Scos_DeepForest",
  "Bounty_LE_Tier1_Step_Central",
  "Bounty_LE_Tier1_Step_South",
  "Bounty_LE_Tier1_Hawe_Verge",
  "Bounty_LE_Tier1_Hawe_Wetland",
  "Bounty_LE_Tier1_Kehj_HighDesert",
  "Bounty_LE_Tier1_Kehj_LowDesert",
  "Bounty_LE_Tier1_Kehj_Oasis",
];
for (const bountyZone of [
  ...bounties.ptContent[0].arBountyZones,
  ...bounties.ptContent[0].arBountyGroups,
]) {
  for (const bounty of bountyZone.arBounties) {
    const [, , , zone, subzone] = bounty.snoWorldState.name.split("_");
    const stringId = bounty.snoQuest.name;
    if (!stringId) {
      console.warn(
        "Missing quest name",
        bounty.snoWorldState.name,
        bounty.snoQuest,
      );
      continue;
    }
    const quest = await readJSON<Quest>(
      CONTENT_DIR + "/base/meta/Quest/" + stringId + ".qst.json",
    );
    const point = normalizePoint(quest.vecStartLocation);
    const id = bounty.snoQuest.name;
    const terms = await readTerms(`Quest_${stringId}`);

    const name = terms.find((term) => term.szLabel === "Name")?.szText;
    if (!name) {
      console.warn(`Missing name for ${stringId}`);
      continue;
    }
    const description = terms.find((term) => term.szLabel === "Toast")?.szText;
    enDict[id] = normalizeTerm(name);
    if (description) {
      enDict[`${id}_desc`] = description;
    }
    const type = "events";
    if (!nodes.some((n) => n.type === type && n.mapName === "Sanctuary")) {
      nodes.push({
        type: type,
        mapName: "Sanctuary",
        spawns: [],
      });
    }
    const category = nodes.find((n) => n.type === type)!;
    const spawn: (typeof nodes)[number]["spawns"][number] = id
      ? { id, p: point }
      : { p: point };
    category.spawns.push(spawn);
  }
}

const flatFilters = Object.values(filters).flatMap((f) => f.values);
nodes.sort((a, b) => {
  const aSize = flatFilters.find((f) => f.id === a.type)?.size || 0;
  const bSize = flatFilters.find((f) => f.id === b.type)?.size || 0;
  return aSize - bSize;
});

writeNodes(nodes);
writeFilters(filters);
writeDict(enDict, "en");
writeRegions(regions);

console.log("Done!");
