import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  listenToPlugin,
  initDiscordRPC,
  type Actor,
  brotliDecompress,
  logVersion,
} from "@repo/lib/overwolf";
import { decodeFromBuffer, useGameState } from "@repo/lib";
import { type NodesCoordinates } from "@repo/ui/providers";
import App from "./app";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };
import defaultMap from "./coordinates/cbor/default.cbor?url";

logVersion();

const maps = [defaultMap];
const allNodes = await Promise.all(
  maps.map(async (map) => {
    const response = await fetch(map);
    const arrayBuffer = await response.arrayBuffer();
    const decrompressed = brotliDecompress(arrayBuffer);
    return decodeFromBuffer<NodesCoordinates>(decrompressed);
  }),
);
const nodes = allNodes.flat();

const el = document.getElementById("root");
if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App nodes={nodes} />
    </React.StrictMode>,
  );
} else {
  throw new Error("Could not find root element!!");
}

let lastMapName = "default";
// eslint-disable-next-line @typescript-eslint/no-misused-promises
setTimeout(async () => {
  await listenToPlugin(
    Object.keys(typesIdMap),
    (actor, playerActor) => {
      let mapName = lastMapName;
      if (actor.path) {
        // OpenWorld, Charactor (misspelled, inventory menus), LevelScene_Raid (monolith)
        if (actor.path === "Charactor") {
          // return lastMapName;
        } else if (actor.path === "OpenWorld") {
          lastMapName = "default";
        } else if (actor.path === "LevelScene_Raid") {
          lastMapName = "monolith";
        } else {
          lastMapName = actor.path;
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

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!id?.startsWith("deviations_")) {
        return true;
      }
      const balls = actors.filter((a) => a.type === "ball.gim");
      return balls.some((ball) => {
        const distance = Math.sqrt(
          (actor.x - ball.x) ** 2 +
            (actor.y - ball.y) ** 2 +
            (actor.z - ball.z) ** 2,
        );
        return distance < 1;
      });
    },
  );
}, 1000);

useGameState.subscribe(
  (state) => state.actors,
  (actors) => {
    sendActorsToAPI(actors);
  },
);

let lastSend = 0;
let lastActorAddresses: number[] = [];
async function sendActorsToAPI(actors: Actor[]) {
  if (Date.now() - lastSend < 10000) {
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
        path: actor.type,
      }),
    );

    await fetch("https://actors-api.th.gl/nodes/once-human-8", {
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

await initDiscordRPC("1271431538675814461", (updatePresence) => {
  updatePresence([
    "",
    "Playing",
    "once-human",
    "Once Human",
    "thgl",
    "Once Human Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Once%20Human?ref=discordrpc",
    "",
    "",
  ]);
});
