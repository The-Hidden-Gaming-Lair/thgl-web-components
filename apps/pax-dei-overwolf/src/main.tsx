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

await listenToPlugin(
  Object.keys(typesIdMap),
  (path) => {
    return path.split("/")[4];
  },
  undefined,
  normalizeLocation,
);

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

const SMALL = {
  ORTHOGRAPHIC_WIDTH: 409600,
  OFFSET_X: 409600 / 2,
  OFFSET_Y: -409600 / 2,
  CAMERA_ANGLE: 0,
};
const LARGE = {
  ORTHOGRAPHIC_WIDTH: 1024000 * 1.6,
  OFFSET_X: (1024000 * 1.6) / 2,
  OFFSET_Y: -(1024000 * 0.4) / 2,
  CAMERA_ANGLE: 0,
};

function normalizeLocation(actor: { x: number; y: number; mapName?: string }) {
  const offset = actor.mapName === "gallia_pve_01" ? SMALL : LARGE;

  const x = actor.x - offset.OFFSET_X;
  const y = actor.y - offset.OFFSET_Y;
  const angle = toRadians(-offset.CAMERA_ANGLE);
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  const newX = x * cosAngle - y * sinAngle;
  const newY = x * sinAngle + y * cosAngle;

  actor.x = newY;
  actor.y = newX;
}

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
    await fetch("https://pax-dei-api.th.gl/nodes", {
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
    "pax-dei",
    "Pax Dei",
    "thgl",
    "Pax Dei Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Pax Dei?ref=discordrpc",
    "",
    "",
  ]);
});
