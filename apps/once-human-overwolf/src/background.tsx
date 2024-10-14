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
let lastMapName: string | undefined;
const gameEventsPlugin = await initGameEventsPlugin<OnceHumanPlugin>(
  "ONCE_HUMAN",
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
        } else {
          mapName = "default";
        }
      } else if (actor.path === "LevelScene_Raid") {
        mapName = "raid";
      } else {
        mapName = actor.path;
      }
      if (lastMapName !== mapName) {
        console.log(`Map changed to ${mapName}`);
      }
      lastMapName = mapName;
    } else if (playerActor.mapName) {
      mapName = playerActor.mapName;
    }
    return mapName;
  },
  undefined,
  undefined,
  (actor, _index, actors) => {
    const id = typesIdMap[actor.type as keyof typeof typesIdMap];
    if (!id) {
      return false;
    }
    if (id.startsWith("deviations_")) {
      const balls = actors.filter((a) => a.type === "ball.gim");
      return balls.some((ball) => {
        const distance = Math.sqrt(
          (actor.x - ball.x) ** 2 +
            (actor.y - ball.y) ** 2 +
            (actor.z - ball.z) ** 2,
        );
        return distance < 1;
      });
    }
    if (actor.type.startsWith("fish_")) {
      const fishTanks = actors.filter(
        (a) => a.type === "fish_tank_group_2.gim",
      );
      return !fishTanks.some((fishTank) => {
        const distance = Math.sqrt(
          (actor.x - fishTank.x) ** 2 + (actor.y - fishTank.y) ** 2,
        );
        return distance < 1;
      });
    }
    return true;
  },
  sendActorsToAPI,
);

function refreshServerName(): void {
  gameEventsPlugin.GetServerName(
    (serverName) => {
      if (prevServerName !== serverName) {
        console.log(`Server Name found: ${serverName}`);
        if (serverName === "servernotfound") {
          setTimeout(refreshServerName, 15000);
          return;
        }
        prevServerName = serverName;
      }
      window.gameEventBus.trigger(MESSAGES.CHARACTER, { serverName });
      setTimeout(refreshServerName, 5000);
    },
    () => {
      setTimeout(refreshServerName, 5000);
    },
  );
}
// refreshServerName();

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

    await fetch("https://actors-api.th.gl/nodes/once-human-10", {
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
