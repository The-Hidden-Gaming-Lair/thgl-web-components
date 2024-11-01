import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  initDiscordRPC,
  logVersion,
  listenToGameEvents,
  brotliDecompress,
} from "@repo/lib/overwolf";
import { decodeFromBuffer } from "@repo/lib";
import { type NodesCoordinates } from "@repo/ui/providers";
import App from "./app";
import _enDict from "./dicts/en.json" assert { type: "json" };
import World from "./coordinates/cbor/World.cbor?url";

logVersion();

const maps = [World];
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

listenToGameEvents();

await initDiscordRPC("1181323945866178560", (updatePresence) => {
  updatePresence([
    "",
    "Playing Satisfaction",
    "satisfactory",
    "Satisfactory",
    "thgl",
    "Satisfactory Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Satisfactory?ref=discordrpc",
    "",
    "",
  ]);
});
