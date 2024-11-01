import {
  type Actor,
  type GameEventsPlugin,
  initBackground,
  initGameEventsPlugin,
  MESSAGES,
} from "@repo/lib/overwolf";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };

await initBackground(
  23930,
  "hjolmidofgehhbnofcpdbcednenibgnblipabcko",
  "1271431538675814461",
);

type OnceHumanPlugin = {
  GetServerName: (
    callback: (serverName: string | null) => void,
    onError: (err: string) => void,
  ) => void;
} & GameEventsPlugin;

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
const gameEventsPlugin = await initGameEventsPlugin<OnceHumanPlugin>(
  { processName: "ONCE_HUMAN" },
  Object.keys(typesIdMap),
  (actor, playerActor) => {
    let mapName = lastMapName;
    if (actor.path) {
      // OpenWorld, Charactor (misspelled, inventory menus), LevelScene_Raid (monolith, raid)
      if (actor.path === "Charactor") {
        // return lastMapName;
      } else if (actor.path === "OpenWorld") {
        if (prevServerName?.includes("Clash")) {
          mapName = "east_blackfell_pvp";
        } else if (prevServerName?.includes("Winter")) {
          mapName = "north_snow_pve";
        } else if (prevServerName === "null") {
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
  },
  undefined,
  undefined,
  (actor, index, actors) => {
    if (index === 0) {
      lastFishTankUnits = actors.filter((a) =>
        a.type.startsWith("fish_tank_group_"),
      );
      lastBallUnits = actors.filter((a) => a.type === "ball.gim");
      plantBoxUnits = actors.filter((a) => a.type === "plantbox.gim");
    }
    const id = typesIdMap[actor.type as keyof typeof typesIdMap];
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
  },
  sendActorsToAPI,
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
      if (distance > 10) {
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

let lastSend = 0;
let lastActorAddresses: number[] = [];
async function sendActorsToAPI(actors: Actor[]): Promise<void> {
  if (!prevServerName || Date.now() - lastSend < 10000) {
    return;
  }

  lastSend = Date.now();

  const busMonsterLocations = actors.filter((actor) => {
    return (
      actor.type === "bus_monster.gim" || actor.type === "bus_monster_arm.gim"
    );
  });

  const newActors = actors.filter((actor) => {
    const id = typesIdMap[actor.type as keyof typeof typesIdMap];
    if (!id) {
      return false;
    }
    let mapName;
    if (prevServerName?.includes("Clash")) {
      mapName = "east_blackfell_pvp";
    } else if (prevServerName?.includes("Winter")) {
      mapName = "north_snow_pve";
    } else {
      mapName = "default";
    }

    if (actor.mapName !== mapName) {
      return;
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
    const staticActors = newActors.map(
      ({ address, r, mapName, hidden, ...actor }) => ({
        ...actor,
        timestamp: lastSend,
        path: mapName,
      }),
    );

    await fetch("https://actors-api.th.gl/nodes/once-human-15", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(staticActors),
    });
  } catch (e) {
    //
  }
}
