import { $ } from "bun";
import uniqolor from "uniqolor";
import { readDirSync, readJSON, saveImage, writeJSON } from "./lib/fs.js";
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
} from "./types.js";
import { addCircleToImage, colorizeImage } from "./lib/image.js";

const CONTENT_DIR = "/mnt/c/dev/Diablo IV/d4data";
const TEXTURE_DIR = "/mnt/c/dev/Diablo IV/d4-texture-extractor/webp";
const TEMP_DIR =
  "/home/devleon/the-hidden-gaming-lair/services/diablo4-data/out";
const OUT_DIR = "/home/devleon/the-hidden-gaming-lair/static/diablo4";
const savedIcons: string[] = [];

await saveIcon(
  TEXTURE_DIR + "/slices/2DUIMinimapIcons/4248556590.webp",
  "player"
);

const nodes: {
  type: string;
  spawns: {
    id?: string;
    p: [number, number];
    mapName: string;
    icon?: {
      name: string;
      url: string;
    };
  }[];
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
}[] = [
  {
    group: "locations",
    defaultOpen: true,
    defaultOn: true,
    values: [
      {
        id: "altarsOfLilith",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/4194820567.webp",
          "altarsOfLilith"
        ),
        size: 1.5,
      },
      {
        id: "cellars",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1573024828.webp",
          "cellars"
        ),
        size: 1.5,
      },
      {
        id: "dungeons",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1741287201.webp",
          "dungeons"
        ),
        size: 1.5,
      },
      {
        id: "sideQuestDungeons",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1287872359.webp",
          "sideQuestDungeons"
        ),
        size: 1.5,
      },
      {
        id: "campaignDungeons",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/3566347010.webp",
          "campaignDungeons"
        ),
        size: 1.5,
      },
      {
        id: "stash",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/523040772.webp",
          "stash"
        ),
        size: 2,
      },
      {
        id: "strongholds",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/3122276994.webp",
          "strongholds"
        ),
        size: 2,
      },
      {
        id: "waypoints",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/889034296.webp",
          "waypoints"
        ),
        size: 2,
      },
      {
        id: "wardrobes",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/2294324951.webp",
          "wardrobes"
        ),
        size: 2,
      },
      {
        id: "worldTierStatue",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1601625104.webp",
          "worldTierStatue"
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
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/828137185.webp",
          "alchemists"
        ),
        size: 1.5,
      },
      {
        id: "blacksmiths",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1518318179.webp",
          "blacksmiths"
        ),
        size: 1.5,
      },
      {
        id: "healers",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/3927157842.webp",
          "healers"
        ),
        size: 1.5,
      },
      {
        id: "gamblers",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/3905225007.webp",
          "gamblers"
        ),
        size: 1.5,
      },
      {
        id: "jewelers",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1557137717.webp",
          "jewelers"
        ),
        size: 1.5,
      },
      {
        id: "occultists",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1736753223.webp",
          "occultists"
        ),
        size: 1.5,
      },
      {
        id: "silversmiths",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/3510500336.webp",
          "silversmiths"
        ),
        size: 1.5,
      },
      {
        id: "stableMasters",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1126344873.webp",
          "stableMasters"
        ),
        size: 1.5,
      },
      {
        id: "weapons",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1265112984.webp",
          "weapons"
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
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/360808697.webp",
          "sideQuests"
        ),
        size: 1.5,
      },
      {
        id: "campaignQuests",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/3837410649.webp",
          "campaignQuests"
        ),
        size: 1.5,
      },
      {
        id: "events",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/503808014.webp",
          "events"
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
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/43109186.webp",
          "chestGuardian",
          "#c4a4f6",
          false,
          100
        ),
        size: 2,
      },
      {
        id: "chestT3",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/43109186.webp",
          "chestT3"
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
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/3438342714.webp",
          "boss"
        ),
        size: 2,
      },
      {
        id: "unique",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/83908665.webp",
          "unique"
        ),
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
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "bandit",
          uniqolor("bandit").color
        ),
        size: 1,
      },
      {
        id: "cannibal",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "cannibal",
          uniqolor("cannibal").color
        ),
        size: 1,
      },
      {
        id: "cultist",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "cultist",
          uniqolor("cultist").color
        ),
        size: 1,
      },
      {
        id: "demon",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "demon",
          uniqolor("demon").color
        ),
        size: 1,
      },
      {
        id: "drown",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "drown",
          uniqolor("drown").color
        ),
        size: 1,
      },
      {
        id: "fallen",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "fallen",
          uniqolor("fallen").color
        ),
        size: 1,
      },
      {
        id: "ghost",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "ghost",
          uniqolor("ghost").color
        ),
        size: 1,
      },
      {
        id: "goatman",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "goatman",
          uniqolor("goatman").color
        ),
        size: 1,
      },
      {
        id: "knight",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "knight",
          uniqolor("knight").color
        ),
        size: 1,
      },
      {
        id: "skeleton",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "skeleton",
          uniqolor("skeleton").color
        ),
        size: 1,
      },
      {
        id: "snake",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "snake",
          uniqolor("snake").color
        ),
        size: 1,
      },
      {
        id: "spider",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "spider",
          uniqolor("spider").color
        ),
        size: 1,
      },
      {
        id: "vampire",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "vampire",
          uniqolor("vampire").color
        ),
        size: 1,
      },
      {
        id: "werewolf",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "werewolf",
          uniqolor("werewolf").color
        ),
        size: 1,
      },
      {
        id: "wildlife",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "wildlife",
          uniqolor("wildlife").color
        ),
        size: 1,
      },
      {
        id: "zombie",
        icon: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/1393108954.webp",
          "zombie",
          uniqolor("zombie").color
        ),
        size: 1,
      },
    ],
  },
];

const enDict: Record<string, string> = {
  frac: "Fractured Peaks",
  hawe: "Hawezar",
  scos: "Scosglen",
  step: "Dry Steppes",
  kehj: "Kehjistan",
  altarsOfLilith: "Altars of Lilith",
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
};

const regions: {
  id: string;
  center: [number, number];
  border: [number, number][];
  mapName: string;
}[] = [];

const continent = readJSON<Sanctuary_Eastern_Continent>(
  CONTENT_DIR + "/json/base/meta/World/Sanctuary_Eastern_Continent.wrl.json"
);
const globalMarkers = readJSON<GlobalMarkers>(
  CONTENT_DIR + "/json/base/meta/Global/global_markers.glo.json"
);
const hiddenCaches = readJSON<HiddenCaches>(
  CONTENT_DIR + "/json/base/meta/GameBalance/HiddenCaches.gam.json"
);
const bounties = readJSON<Bounties>(
  CONTENT_DIR + "/json/base/meta/Global/bounties.glo.json"
);

// const SCALE = continent.unk_d9c79d2.unk_ae5bfbd;
const SCALE = 0.083492;
const DEG_45 = Math.PI / 4; // 45 degrees in radians
const OFFSET = {
  x: 113.2,
  y: -227.4,
};

const toCamelCase = (str) => {
  return (
    str[0].toLowerCase() +
    str.slice(1).replace(/_\w/g, (m) => m[1].toUpperCase())
  );
};

const normalizePoint = ({ x, y }) => {
  const scaledX = x * SCALE;
  const scaledY = y * SCALE;
  const rotatedX = scaledX * Math.cos(DEG_45) - scaledY * Math.sin(DEG_45);
  const rotatedY = scaledX * Math.sin(DEG_45) + scaledY * Math.cos(DEG_45);
  return [
    +((-rotatedY + OFFSET.y) / 1.65).toFixed(5),
    +((-rotatedX + OFFSET.x) / 1.65).toFixed(5),
  ] as [number, number];
};

function normalizeTerm(str: string) {
  return str.replace(/.*]/, "").replace(/.*}/, "").replace(".", "").trim();
}

function readTerms(name: string) {
  return readJSON<StringList>(
    CONTENT_DIR + `/json/enUS_Text/meta/StringList/${name}.stl.json`
  ).arStrings;
}

for (const regionBoundary of continent.arRegionBoundaries) {
  const stringId = regionBoundary.snoTerritory.name;
  const id = `territories:${stringId}`;
  enDict[id] = readTerms(`Territory_${stringId}`)[0].szText;
  const border = regionBoundary.arPoints.map((vector) =>
    normalizePoint(vector)
  );
  const center = border.reduce(
    (acc, [x, y]) => [acc[0] + x, acc[1] + y],
    [0, 0]
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
    CONTENT_DIR + `/json/base/meta/Subzone/${parts.join("_")}.sbz.json`;
  try {
    const subzone = readJSON<Subzone>(filename);
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
  point: readonly [number, number],
  polygon: readonly (readonly [number, number])[]
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

export const getRegionByPoint = (point: [number, number]) => {
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
    mapName: "Sanctuary",
  };
  let type;
  if (actor.snoActor.name === "Waypoint_Temp") {
    const stringId = `${actor.snoLevelArea!.groupName}_${actor.snoLevelArea!.name}`;
    spawn.id = stringId;
    const term = readTerms(stringId)[0];
    enDict[spawn.id] = term.szText;
    type = "waypoints";
  } else if (
    DUNGEON_TYPES.includes(actor.snoActor.name) ||
    CELLAR_TYPES.includes(actor.snoActor.name)
  ) {
    const stringId = actor.ptData[0].snoSpecifiedWorld!.name!;

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

    const worldTerms = readTerms(`World_${stringId}`);
    const name = worldTerms
      .find((term) => term.szLabel === "Name")!
      .szText.trim();
    const description = worldTerms.find(
      (term) => term.szLabel === "Desc"
    )?.szText;

    enDict[spawn.id] = name;
    if (description) {
      enDict[`${spawn.id}_desc`] = description + "<br>";
    } else {
      enDict[`${spawn.id}_desc`] = "";
    }
    const rewardName =
      actor.ptData[0].snoPortalDestObjectiveTrackedReward?.name;
    if (rewardName) {
      const trackedReward = readJSON<TrackedReward>(
        CONTENT_DIR + `/json/base/meta/TrackedReward/${rewardName}.trd.json`
      );
      const aspect = trackedReward.snoAspect!;
      const aspectId = aspect.name.replace("Asp_", "");
      const aspectTerms = readTerms(`Affix_${aspectId.toLowerCase()}`);
      const aspectName = aspectTerms.find(
        (term) => term.szLabel === "Name"
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
            TEXTURE_DIR + "/slices/2DUIMinimapIcons/1741287201.webp",
            iconName,
            color,
            true
          ),
        };
      }
    }
  } else if (actor.snoActor.name.includes("LilithShrine")) {
    const stringId = actor.snoLevelArea!.name!;
    spawn.id = stringId;
    const worldTerms = readTerms(`LevelArea_${stringId}`);
    enDict[spawn.id] = worldTerms[0].szText;
    type = "altarsOfLilith";
    const pData = actor.ptData.find((data) => data.gbidHiddenCache)!;
    const hiddenCache = hiddenCaches.ptData[0].tEntries.find(
      (entry) => entry.tHeader?.szName === pData.gbidHiddenCache!.name
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
      const attributeDescriptions = readTerms(`Map`);
      const term = attributeDescriptions.find(
        (term) => term.szLabel === "RegionProgress_Reward_GamblingCurrency"
      )!;
      enDict[`${spawn.id}_desc`] += normalizeTerm(term.szText);
      enDict[`${spawn.id}_tags`] = normalizeTerm(term.szText);
    } else if (attribute === "Cache_Paragon") {
      const attributeDescriptions = readTerms(`SkillsUI`);
      const term = attributeDescriptions.find(
        (term) => term.szLabel === "ParagonPointsAvailable"
      )!;
      enDict[`${spawn.id}_desc`] += normalizeTerm(term.szText);
      enDict[`${spawn.id}_tags`] = normalizeTerm(term.szText);
    } else {
      const attributeDescriptions = readTerms(`AttributeDescriptions`);
      const term = attributeDescriptions.find(
        (term) => term.szLabel === attribute
      )!;
      enDict[`${spawn.id}_desc`] += normalizeTerm(term.szText);
      enDict[`${spawn.id}_tags`] = normalizeTerm(term.szText);
    }

    const trackedReward = readJSON<TrackedReward>(
      CONTENT_DIR +
        `/json/base/meta/TrackedReward/${hiddenCache.snoTrackedReward.name}.trd.json`
    );
    enDict[`${spawn.id}_desc`] += ` +${trackedReward.flAmount}</p>`;

    if (color) {
      const iconName = `altarsOfLilith_${attribute}`;
      spawn.icon = {
        name: iconName,
        url: await saveIcon(
          TEXTURE_DIR + "/slices/2DUIMinimapIcons/4194820567.webp",
          iconName,
          color,
          true
        ),
      };
    }
  } else {
    continue;
  }

  if (!nodes.some((n) => n.type === type)) {
    nodes.push({
      type: type,
      spawns: [],
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

for (const fileName of readDirSync(CONTENT_DIR + "/json/base/meta/MarkerSet")) {
  if (!fileName.endsWith(".mrk.json")) {
    continue;
  }
  if (fileName.includes("Private")) {
    continue;
  }
  const markerSet = readJSON<MarkerSet>(
    CONTENT_DIR + "/json/base/meta/MarkerSet/" + fileName
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
        /TWN_(?<name>.*)_(?<type>.*)_(?<role>.*)/
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
      enDict[id] = readTerms(stringId)[0].szText;
    } else if (
      snoName &&
      families.some((family) => `${snoName.name}_`.startsWith(family))
    ) {
      if (skippable.some((skip) => snoName.name.includes(skip))) {
        continue;
      }
      const family = families.find((family) =>
        `${snoName.name}_`.startsWith(family)
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
        enDict[id] = readTerms(stringId)[0].szText;
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
      enDict[id] = readTerms("Actor_Gizmo_World_Tier_Select")[0].szText;
    } else if (snoName?.name === "Stash") {
      type = "stash";
      id = snoName.name;
      enDict[id] = readTerms("Stash")[0].szText;
    } else if (snoName?.name === "Gizmo_Wardrobe") {
      type = "wardrobes";
      id = snoName.name;
      enDict[id] = readTerms("Actor_Gizmo_Wardrobe")[0].szText;
    } else {
      continue;
    }
    if (!nodes.some((n) => n.type === type)) {
      nodes.push({
        type: type,
        spawns: [],
      });
    }
    const category = nodes.find((n) => n.type === type)!;
    const spawn = id
      ? { id, p: point, mapName: "Sanctuary" }
      : { p: point, mapName: "Sanctuary" };
    category.spawns.push(spawn);
  }
}

for (const fileName of readDirSync(CONTENT_DIR + "/json/base/meta/Quest")) {
  if (!fileName.endsWith(".qst.json")) {
    continue;
  }
  const quest = readJSON<Quest>(
    CONTENT_DIR + "/json/base/meta/Quest/" + fileName
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
      (questPhase) => questPhase.snoReward?.groupName === "TreasureClass"
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
    const terms = readTerms(`Quest_${stringId}`);
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

  if (!nodes.some((n) => n.type === type)) {
    nodes.push({
      type: type,
      spawns: [],
    });
  }
  const category = nodes.find((n) => n.type === type)!;
  const spawn = id
    ? { id, p: point, mapName: "Sanctuary" }
    : { p: point, mapName: "Sanctuary" };
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
    const quest = readJSON<Quest>(
      CONTENT_DIR + "/json/base/meta/Quest/" + stringId + ".qst.json"
    );
    const point = normalizePoint(quest.vecStartLocation);
    const id = bounty.snoQuest.name;
    const terms = readTerms(`Quest_${stringId}`);

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
    if (!nodes.some((n) => n.type === type)) {
      nodes.push({
        type: type,
        spawns: [],
      });
    }
    const category = nodes.find((n) => n.type === type)!;
    const spawn = id
      ? { id, p: point, mapName: "Sanctuary" }
      : { p: point, mapName: "Sanctuary" };
    category.spawns.push(spawn);
  }
}

const flatFilters = Object.values(filters).flatMap((f) => f.values);
nodes.sort((a, b) => {
  const aSize = flatFilters.find((f) => f.id === a.type)?.size || 0;
  const bSize = flatFilters.find((f) => f.id === b.type)?.size || 0;
  return aSize - bSize;
});

writeJSON(OUT_DIR + "/coordinates/nodes.json", nodes);
writeJSON(OUT_DIR + "/coordinates/filters.json", filters);
writeJSON(OUT_DIR + "/dicts/en.json", enDict);
writeJSON(OUT_DIR + "/coordinates/regions.json", regions);

console.log("Done");
async function saveIcon(
  assetPath: string,
  name: string,
  color?: string,
  circle?: boolean,
  threshold?: number
) {
  if (savedIcons.includes(name)) {
    return `${name}.webp`;
  }
  if (circle && color) {
    const canvas = await addCircleToImage(assetPath, color);
    saveImage(TEMP_DIR + `/${name}.png`, canvas.toBuffer("image/png"));
    await $`cwebp ${TEMP_DIR}/${name}.png -o ${OUT_DIR}/icons/${name}.webp -quiet`;
  } else if (color) {
    const canvas = await colorizeImage(assetPath, color, threshold);
    saveImage(TEMP_DIR + `/${name}.png`, canvas.toBuffer("image/png"));
    await $`cwebp ${TEMP_DIR + `/${name}.png`} -o ${OUT_DIR}/icons/${name}.webp -quiet`;
  } else {
    await $`cwebp ${assetPath} -o ${OUT_DIR}/icons/${name}.webp -quiet`;
  }
  savedIcons.push(name);
  return `${name}.webp`;
}
