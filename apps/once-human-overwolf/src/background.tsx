import {
  type Actor,
  ActorPlayer,
  type GameEventsPlugin,
  initBackground,
  initGameEventsPlugin,
  MESSAGES,
} from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";
import { fetchVersion } from "@repo/lib";

const version = await fetchVersion(APP_CONFIG.name);
const typesIdMap = version.data.typesIdMap;

type OnceHumanPlugin = {
  GetServerName: (
    callback: (serverName: string | null) => void,
    onError: (err: string) => void,
  ) => void;
} & GameEventsPlugin;

const gatherableIdMap = {
  "ag_l_01.gim": "tin_ore",
  "al_l_01.gim": "aluminum_ore",
  "au_l_01.gim": "gold_ore",
  "conch_l_01.gim": "shell_rock",
  "cu_l_01.gim": "copper_ore",
  "fe_l_01.gim": "iron_ore",
  "fe_m_01.gim": "iron_ore",
  "fe_s_01.gim": "iron_ore",
  "hot_ore_1.gim": "hot_ore",
  "ice_ore_1.gim": "ice_ore",
  "mine_gold_01.gim": "gold_ore",
  "mossy_l_01.gim": "seaweed_rock",
  "s_l_01.gim": "sulfur",
  "s_m_01.gim": "sulfur",
  "s_s_01.gim": "sulfur",
  "sd_l_01.gim": "stardust_ore",
  "sn_l_01.gim": "silver_ore",
  "w_l_01.gim": "tungsten_ore",
};

let prevServerName: string | null = null;
let refreshServerNamePromise: Promise<void> | null = null;
let lastMapName: string | undefined;
let lastPlayerPosition: { x: number; y: number; z: number } = {
  x: 0,
  y: 0,
  z: 0,
};
let lastBallUnits: Actor[] = [];
let lastFishTankUnits: Actor[] = [];
let plantBoxUnits: Actor[] = [];
const isNearBy = (actor: Actor, unit: Actor) => {
  const distance = Math.sqrt((actor.x - unit.x) ** 2 + (actor.y - unit.y) ** 2);
  return distance < 1;
};

let lastSend = 0;
let lastActorAddresses: number[] = [];
const gameEventsPlugin = await initGameEventsPlugin<OnceHumanPlugin>(
  { processName: "ONCE_HUMAN", onActors: sendActorsToAPI },
  Object.keys(typesIdMap),
  actorToMapName,
  undefined,
  undefined,
  filterActor,
  (player) => {
    if (player !== null && !refreshServerNamePromise) {
      const distance = lastPlayerPosition
        ? Math.sqrt(
            (player.x - lastPlayerPosition.x) ** 2 +
              (player.y - lastPlayerPosition.y) ** 2 +
              (player.z - lastPlayerPosition.z) ** 2,
          )
        : 0;
      lastPlayerPosition = { x: player.x, y: player.y, z: player.z };
      if (distance > 50) {
        console.log(`Player moved ${distance} units -> refreshing server name`);
        refreshServerNamePromise = refreshServerName()
          .then(() => {
            refreshServerNamePromise = null;
          })
          .catch(() => {
            refreshServerNamePromise = null;
          });
      }
    }
  },
);

function refreshServerName(): Promise<void> {
  return new Promise((resolve) => {
    gameEventsPlugin.GetServerName(
      (serverName) => {
        if (serverName === null) {
          return;
        }
        if (prevServerName !== serverName) {
          prevServerName = serverName;
          console.log(`Server name changed to ${serverName}`);
        }
        window.gameEventBus.trigger(MESSAGES.CHARACTER, { serverName });
        resolve();
      },
      () => {
        resolve();
      },
    );
  });
}

let isSending = false;
async function sendActorsToAPI(actors: Actor[]): Promise<void> {
  if (isSending || !prevServerName || Date.now() - lastSend < 12000) {
    return;
  }

  isSending = true;
  lastSend = Date.now();

  const busMonsterLocations = actors.filter((actor) => {
    return (
      actor.type === "bus_monster.gim" || actor.type === "bus_monster_arm.gim"
    );
  });

  const newActors = actors.filter((actor) => {
    const id =
      typesIdMap[actor.type as keyof typeof typesIdMap] ||
      gatherableIdMap[actor.type as keyof typeof gatherableIdMap];
    if (!id) {
      return false;
    }

    if (lastActorAddresses.includes(actor.address)) {
      return false;
    }
    if (id === "gear_crate") {
      const isNearBusMonster = !busMonsterLocations.every((busMonster) => {
        const distance = Math.sqrt(
          (actor.x - busMonster.x) ** 2 +
            (actor.y - busMonster.y) ** 2 +
            (actor.z - busMonster.z) ** 2,
        );
        return distance > 20;
      });
      if (isNearBusMonster) {
        return false;
      }
    }
    return true;
  });
  lastActorAddresses = actors.map((actor) => actor.address);
  if (newActors.length === 0) {
    return;
  }
  try {
    await fetch("https://actors-api.th.gl/actors/once-human", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newActors),
    });
  } catch (e) {
    //
  } finally {
    isSending = false;
  }
}

function actorToMapName(actor: Actor, playerActor: ActorPlayer) {
  let mapName = lastMapName;
  if (actor.path) {
    // OpenWorld, Charactor (misspelled, inventory menus), LevelScene_Raid (monolith, raid)
    if (actor.path === "Charactor") {
      // return lastMapName;
    } else if (actor.path === "OpenWorld" || actor.path === "null") {
      if (prevServerName?.includes("Clash")) {
        mapName = "east_blackfell_pvp";
      } else if (prevServerName?.includes("Winter")) {
        mapName = "north_snow_pve";
      } else if (prevServerName?.includes("E_Dream")) {
        mapName = "endless_dream";
      } else if (prevServerName?.includes("RaidZone")) {
        mapName = "once_human_raid_zone";
      } else if (
        prevServerName === "unknown" ||
        prevServerName === "Eternaland"
      ) {
        mapName = "eternaland";
      } else {
        mapName = "default";
      }
    } else if (actor.path === "LevelScene_Raid") {
      mapName = "raid";
    } else {
      mapName = actor.path;
    }
    if (lastMapName !== mapName) {
      console.log(
        `Map changed to ${mapName} with path ${actor.path} and server ${prevServerName}`,
      );
    }
    lastMapName = mapName;
  } else if (playerActor.mapName) {
    mapName = playerActor.mapName;
  }
  return mapName;
}

function filterActor(actor: Actor, index: number, actors: Actor[]) {
  if (index === 0) {
    lastFishTankUnits = actors.filter((a) =>
      a.type.startsWith("fish_tank_group_"),
    );
    lastBallUnits = actors.filter((a) => a.type === "ball.gim");
    plantBoxUnits = actors.filter((a) => a.type === "plantbox.gim");
  }
  const id =
    typesIdMap[actor.type as keyof typeof typesIdMap] ||
    gatherableIdMap[actor.type as keyof typeof gatherableIdMap];
  if (!id) {
    return false;
  }

  if (id.startsWith("deviations_")) {
    return lastBallUnits.some((unit) => isNearBy(actor, unit));
  }
  if (id.startsWith("fish_")) {
    return !lastFishTankUnits.some((unit) => isNearBy(actor, unit));
  }
  if (id.startsWith("plants_")) {
    return !plantBoxUnits.some((unit) => isNearBy(actor, unit));
  }
  return true;
}

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
