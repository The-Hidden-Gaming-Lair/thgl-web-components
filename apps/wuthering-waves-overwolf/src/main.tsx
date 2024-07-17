import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { listenToPlugin, initDiscordRPC, type Actor } from "@repo/lib/overwolf";
import { useGameState } from "@repo/lib";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };
import App from "./app";

const el = document.getElementById("root");
if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  throw new Error("Could not find root element!!");
}

await listenToPlugin(Object.keys(typesIdMap), (actor) => {
  return actor.path?.split("/")[4]?.split(".")[0];
});

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
  const newActors = actors.filter(
    (actor) => !lastActorAddresses.includes(actor.address),
  );
  lastActorAddresses = actors.map((actor) => actor.address);
  if (newActors.length === 0) {
    return;
  }
  try {
    await fetch("https://actors-api.th.gl/nodes/wuthering-waves", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      body: JSON.stringify(newActors.map(({ address, ...actor }) => actor)),
    });
  } catch (e) {
    //
  }
}

await initDiscordRPC("1249803392822546512", (updatePresence) => {
  updatePresence([
    "",
    "Playing",
    "wuthering-waves",
    "Wuthering Waves",
    "thgl",
    "Wuthering Waves Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Wuthering%20Waves?ref=discordrpc",
    "",
    "",
  ]);
});
