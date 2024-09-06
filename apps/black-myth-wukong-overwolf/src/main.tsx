import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  listenToPlugin,
  initDiscordRPC,
  brotliDecompress,
  logVersion,
} from "@repo/lib/overwolf";
import { decodeFromBuffer } from "@repo/lib";
import { type NodesCoordinates } from "@repo/ui/providers";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };
import App from "./app";
import HFS01 from "./coordinates/cbor/HFS01.cbor?url";
import HFM02 from "./coordinates/cbor/HFM02.cbor?url";

logVersion();

const maps = [HFS01, HFM02];
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

await listenToPlugin(Object.keys(typesIdMap));

await initDiscordRPC("1276593343354114058", (updatePresence) => {
  updatePresence([
    "",
    "Playing",
    "black-myth-wukong",
    "Black Myth: Wukong",
    "thgl",
    "Black Myth: Wukong Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Black%20Myth:%20Wukong%20Map?ref=discordrpc",
    "",
    "",
  ]);
});
