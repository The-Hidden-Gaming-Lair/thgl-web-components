import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  initDiscordRPC,
  brotliDecompress,
  logVersion,
  listenToGameEvents,
} from "@repo/lib/overwolf";
import { decodeFromBuffer } from "@repo/lib";
import { type NodesCoordinates } from "@repo/ui/providers";
import App from "./app";
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

listenToGameEvents();

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
