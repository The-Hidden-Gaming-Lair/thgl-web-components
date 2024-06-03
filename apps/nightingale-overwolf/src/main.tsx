import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import type { Actor } from "@repo/lib/overwolf";
import {
  listenToPlugin,
  initDiscordRPC,
  promisifyOverwolf,
} from "@repo/lib/overwolf";
import { useGameState } from "@repo/lib";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };
import App from "./app";

const el = document.getElementById("root");
if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  throw new Error("Could not find root element!!");
}

await listenToPlugin(
  Object.keys(typesIdMap),
  (path) => {
    return path.split("/")[6];
  },
  "NWXClient-Win64-Shipping"
);

useGameState.subscribe(
  (state) => state.actors,
  (actors) => {
    sendActorsToAPI(actors);
  }
);

let lastSend = 0;
let lastActorAddresses: number[] = [];
async function sendActorsToAPI(actors: Actor[]) {
  if (Date.now() - lastSend < 10000) {
    return;
  }
  lastSend = Date.now();
  const newActors = actors.filter(
    (actor) => !lastActorAddresses.includes(actor.address)
  );
  lastActorAddresses = actors.map((actor) => actor.address);
  if (newActors.length === 0) {
    return;
  }
  try {
    const manifest = await promisifyOverwolf(
      overwolf.extensions.current.getManifest
    )();
    const version = manifest.meta.version;

    await fetch("https://nightingale-api.th.gl/nodes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "App-Version": version,
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      body: JSON.stringify(newActors.map(({ address, ...actor }) => actor)),
    });
  } catch (e) {
    //
  }
}

await initDiscordRPC("1209779455803924510", (updatePresence) => {
  updatePresence([
    "",
    "Exploring the Realm",
    "nightingale",
    "Nightingale",
    "thgl",
    "Nightingale Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Nightingale?ref=discordrpc",
    "",
    "",
  ]);
});
