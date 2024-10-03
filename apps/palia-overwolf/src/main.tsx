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
import { decodeFromBuffer, useGameState } from "@repo/lib";
import { type NodesCoordinates, type Dict } from "@repo/ui/providers";
import App from "./app";
import _enDict from "./dicts/en.json" assert { type: "json" };
import AdventureZoneWorld from "./coordinates/cbor/AdventureZoneWorld.cbor?url";
import VillageWorld from "./coordinates/cbor/VillageWorld.cbor?url";
import HousingPlot from "./coordinates/cbor/HousingPlot.cbor?url";
import MajiMarket from "./coordinates/cbor/MajiMarket.cbor?url";

logVersion();

const enDict = _enDict as Dict;
const maps = [AdventureZoneWorld, VillageWorld, HousingPlot, MajiMarket];
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
  const { player, character } = useGameState.getState();
  if (!player?.mapName || !character) {
    return;
  }
  const level = character.skillLevels.reduce(
    (acc: number, cur: { level: number }) => acc + (cur.level - 1),
    1,
  );

  const mapTitle = enDict[player.mapName];
  updatePresence([
    `${character.name} | Level ${level}`,
    mapTitle,
    "palia",
    "Palia",
    "thgl",
    "Palia Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Palia?ref=discordrpc",
    "",
    "",
  ]);
});
