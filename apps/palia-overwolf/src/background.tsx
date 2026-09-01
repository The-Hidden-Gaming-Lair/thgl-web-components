import {
  type Actor,
  createDwellTracker,
  type GameEventsPlugin,
  initBackground,
  initGameEventsPlugin,
  MESSAGES,
  promisifyOverwolf,
} from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";
import { fetchVersion } from "@repo/lib";

const version = await fetchVersion(APP_CONFIG.name);
const typesIdMap = version.data.typesIdMap;

type PaliaEventsPlugin = {
  GetValeriaCharacter: (
    callback: (valeriaCharacter: ValeriaCharacter | null) => void,
    onError: (err: string) => void,
  ) => void;
  GetCurrentGiftPreferences: (
    callback: (currentGiftPreferences: CurrentGiftPreferences) => void,
    onError: (err: string) => void,
  ) => void;
  IsModuleLoaded: (
    moduleName: string,
    callback: (isLoaded: boolean) => void,
  ) => void;
  GetCurrentWorldInfo?: (
    callback: (worldInfo: WorldInfo | null) => void,
    onError: (err: string) => void,
  ) => void;
} & GameEventsPlugin;

export interface WorldInfo {
  serverId: string;
  joinCode: string | null;
  region: string | null;
  startedAt: number; // epoch ms, 0 = unknown
}

export interface ValeriaCharacter {
  name: string;
  guid: string;
  giftHistory: VillagerGiftHistory[];
  skillLevels: SkillLevels[];
  lastKnownPrimaryHousingPlotValue: number;
}

export interface VillagerGiftHistory {
  villagerCoreId: number;
  itemPersistId: number;
  lastGiftedMs: number;
  associatedPreferenceVersion: number;
}

export interface SkillLevels {
  type: string;
  level: number;
  xpGainedThisLevel: number;
}

export interface CurrentGiftPreferences {
  preferenceResetTime: {
    dayOfWeek: number;
    hour: number;
    minute: number;
  };
  preferenceDataVersionNumber: number;
  currentPreferenceData: {
    villagerCoreId: number;
    currentGiftPreferences: number[];
  }[];
}

const manifest = await promisifyOverwolf(
  overwolf.extensions.current.getManifest,
)();
const appVersion = manifest.meta.version;

let lastSend = 0;
let lastActorAddresses: number[] = [];
// Anonymous per-app-run id (never persisted) so the backend can count distinct
// reporters per world. Current world ServerId tags actor reports + heartbeats.
const worldClientId =
  globalThis.crypto?.randomUUID?.() ?? `ow-${Date.now()}-${Math.random()}`;
let currentServerId: string | null = null;
// Only report actors that have stayed visible for >= 5s, to drop transient
// memory-read / loading-state blinks that would otherwise become false spawns.
const dwellTracker = createDwellTracker();

// Honey Lures (base Honey Lure, Honeybee Lure, Jack O' Lantern Lure) spawn bugs
// where they never naturally occur — bees anywhere, and the zone's default bug
// table in unnatural spots. Those lured bugs are real right now, so we keep
// showing them on the LIVE map, but they must NOT be saved to the actors-api or
// they become permanent false spawn locations. We read the lure actors (they
// stay invisible on the map — they aren't in typesIdMap) and drop any bug
// sighting near an active/recent lure before reporting.
// Crab Wars event lures are intentionally NOT included: their crabs spawn on the
// beach where crabs legitimately live.
const LURE_CLASSES = [
  "BP_HoneyLure_C",
  "BP_HoneyLure_Bee_C",
  "BP_HoneyLure_JackOLantern_C",
];
// The base lure's MaxSpawnRadius is 1500 units; use ~2x so lured bugs that
// wander before we sample them are still covered.
const LURE_EXCLUSION_RADIUS = 3000;
// Keep a lure "active" a while after it was last seen, since lured bugs linger
// after the lure ends.
const LURE_TTL_MS = 3 * 60 * 1000;
const recentLures: { x: number; y: number; mapName?: string; t: number }[] = [];

// Record lure positions every frame (before the report throttle) so a lure seen
// only briefly still shields nearby bugs for LURE_TTL_MS. Same-spot re-sightings
// refresh an existing entry instead of piling up.
function trackLures(actors: Actor[]): void {
  const now = Date.now();
  for (const actor of actors) {
    if (!LURE_CLASSES.includes(actor.type)) {
      continue;
    }
    const existing = recentLures.find(
      (l) =>
        l.mapName === actor.mapName &&
        Math.hypot(l.x - actor.x, l.y - actor.y) < LURE_EXCLUSION_RADIUS,
    );
    if (existing) {
      existing.x = actor.x;
      existing.y = actor.y;
      existing.t = now;
    } else {
      recentLures.push({
        x: actor.x,
        y: actor.y,
        mapName: actor.mapName,
        t: now,
      });
    }
  }
  for (let i = recentLures.length - 1; i >= 0; i--) {
    if (now - recentLures[i].t > LURE_TTL_MS) {
      recentLures.splice(i, 1);
    }
  }
}

function isNearActiveLure(
  mapName: string | undefined,
  x: number,
  y: number,
): boolean {
  return recentLures.some(
    (l) =>
      l.mapName === mapName &&
      Math.hypot(l.x - x, l.y - y) <= LURE_EXCLUSION_RADIUS,
  );
}

const gameEventsPlugin = await initGameEventsPlugin<PaliaEventsPlugin>(
  {
    onActors: sendActorsToAPI,
  },
  // Read the lure classes too so trackLures can see them (they never render —
  // they aren't in typesIdMap, so the map skips them).
  [...Object.keys(typesIdMap), ...LURE_CLASSES],
  (actor) => {
    if (!actor.path) {
      return;
    }
    if (actor.path.includes("Maps/Village")) {
      return "VillageWorld";
    } else if (actor.path.includes("Maps/AZ1")) {
      return "AdventureZoneWorld";
    } else if (actor.path.includes("Maps/AZ2")) {
      return "AZ2_Root";
    } else if (actor.path.includes("Maps/AZ3")) {
      return "AZ3_Root";
    } else if (
      actor.path.includes("Maps/MajiMarket") ||
      actor.path.includes("Maps/Events/Village_Fairgrounds")
    ) {
      return "MajiMarket";
    } else if (actor.path.includes("Maps/HousingMaps")) {
      return "HousingPlot";
    }
  },
  undefined,
  (location) => {
    if (location.mapName === "HousingPlot") {
      const x = (location.x % 65000) + 35000;
      let y = (location.y % 65000) - 55000;
      if (y < -40000) {
        y += 65000;
      }
      location.x = x;
      location.y = y;
    }
  },
  (actor) => {
    return !actor.hidden;
  },
);

function sendActorsToAPI(actors: Actor[]): void {
  // Observe every frame, before the send throttle, so dwell accrues continuously.
  dwellTracker.observe(actors);
  trackLures(actors);
  if (Date.now() - lastSend < 10000) {
    return;
  }

  lastSend = Date.now();

  const newActors = actors.filter((actor) => {
    const id = typesIdMap[actor.type as keyof typeof typesIdMap];
    if (!id) {
      return false;
    }
    if (lastActorAddresses.includes(actor.address)) {
      return false;
    }
    if (!dwellTracker.isStable(actor.address)) {
      return false;
    }
    // Drop bugs spawned by a Honey Lure: they appear where the bug never
    // naturally spawns and would pollute the historical spawn data. Check the
    // reported (first-seen) position — where the bug was lured — against nearby
    // active/recent lures.
    if (actor.type.startsWith("BP_Bug_")) {
      const firstPos = dwellTracker.getFirstPosition(actor.address);
      const px = firstPos ? firstPos.x : actor.x;
      const py = firstPos ? firstPos.y : actor.y;
      if (isNearActiveLure(actor.mapName, px, py)) {
        return false;
      }
    }
    return true;
  });
  lastActorAddresses = actors.map((actor) => actor.address);
  if (newActors.length === 0) {
    return;
  }

  // Report the FIRST position we saw this actor at (anchored when dwell
  // tracking began), not its drifted live position — so a moving bug's
  // sightings concentrate near its spawn for server-side consensus.
  const staticActors = newActors.map(({ address, path, ...actor }) => {
    const firstPos = dwellTracker.getFirstPosition(address);
    return firstPos ? { ...actor, ...firstPos } : actor;
  });

  fetch("https://palia-api.th.gl/nodes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "App-Version": appVersion,
      // Tag actor reports with the current world so the backend can stamp
      // resource activity (Flow Trees / Palium / Rummage Piles) per world.
      ...(currentServerId ? { "Server-Id": currentServerId } : {}),
    },
    body: JSON.stringify(staticActors),
  }).catch(() => null);
}

// Active-worlds heartbeat: report the current world (ServerId + age + region,
// always available from the PlayerController) every 60s, plus the friendly join
// code opportunistically when the in-game menu has surfaced it.
setInterval(() => {
  gameEventsPlugin.GetCurrentWorldInfo?.(
    (worldInfo) => {
      currentServerId = worldInfo?.serverId ?? null;
      if (!currentServerId) {
        return;
      }
      fetch("https://palia-api.th.gl/worlds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "App-Version": appVersion,
        },
        body: JSON.stringify({
          serverId: currentServerId,
          clientId: worldClientId,
          ...(worldInfo?.joinCode ? { joinCode: worldInfo.joinCode } : {}),
          ...(worldInfo?.region ? { region: worldInfo.region } : {}),
          ...(worldInfo?.startedAt ? { startedAt: worldInfo.startedAt } : {}),
        }),
      }).catch(() => null);
    },
    () => {
      //
    },
  );
}, 60000);

setInterval(() => {
  gameEventsPlugin.GetCurrentGiftPreferences(
    (currentGiftPreferences) => {
      fetch("https://palia-api.th.gl/weekly-wants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "App-Version": appVersion,
        },
        body: JSON.stringify(currentGiftPreferences),
      }).catch(() => null);
    },
    () => {
      //
    },
  );
}, 30000);

let prevValeriaCharacterJson = "";
setInterval(() => {
  gameEventsPlugin.IsModuleLoaded("OriginPalia", (isOriginLoaded) => {
    gameEventsPlugin.GetValeriaCharacter(
      (valeriaCharacter) => {
        if (valeriaCharacter) {
          const actor = {
            type: "BP_ValeriaCharacter_C",
            mapName: "",
            x: 0,
            y: 0,
            z: 0,
            r: 0,
            props: {
              ...valeriaCharacter,
              suspicious: isOriginLoaded,
            },
          };
          fetch("https://palia-api.th.gl/nodes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "App-Version": appVersion,
            },
            body: JSON.stringify([actor]),
          }).catch(() => null);

          const valeriaCharacterJson = JSON.stringify(valeriaCharacter);
          if (valeriaCharacterJson === prevValeriaCharacterJson) {
            return;
          }
          prevValeriaCharacterJson = valeriaCharacterJson;
          window.gameEventBus.trigger(MESSAGES.CHARACTER, valeriaCharacter);
        }
      },
      () => {},
    );
  });
}, 20000);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
