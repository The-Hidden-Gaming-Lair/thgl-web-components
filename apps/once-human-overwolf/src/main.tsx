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
import { decodeFromBuffer, useGameState } from "@repo/lib";
import { type NodesCoordinates } from "@repo/ui/providers";
import App from "./app";
import defaultMap from "./coordinates/cbor/default.cbor?url";
import eastBlackfellPVP from "./coordinates/cbor/east_blackfell_pvp.cbor?url";
import northSnowPVE from "./coordinates/cbor/north_snow_pve.cbor?url";
import raid from "./coordinates/cbor/raid.cbor?url";
import regions from "./coordinates/regions.json" assert { type: "json" };

logVersion();

const maps = [defaultMap, eastBlackfellPVP, northSnowPVE, raid];
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

const checkPointInsidePolygon = (
  point: [number, number],
  polygon: [number, number][],
) => {
  const x = point[0];
  const y = point[1];

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

await initDiscordRPC("1271431538675814461", (updatePresence) => {
  const { player, character } = useGameState.getState();

  if (!player) {
    return;
  }
  const region = regions.find(
    (region) =>
      region.mapName === player.mapName &&
      checkPointInsidePolygon(
        [player.x, player.y],
        region.border as [number, number][],
      ),
  );

  updatePresence([
    region?.id ?? "",
    character?.serverName ?? "Playing",
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
