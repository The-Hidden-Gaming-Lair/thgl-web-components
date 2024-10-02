import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  initDiscordRPC,
  logVersion,
  listenToGameEvents,
} from "@repo/lib/overwolf";
import { useGameState } from "@repo/lib";
import { type Dict } from "@repo/ui/providers";
import App from "./app";
import _enDict from "./dicts/en.json" assert { type: "json" };

const enDict = _enDict as Dict;

logVersion();

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

listenToGameEvents();

await initDiscordRPC("1181323945866178560", (updatePresence) => {
  const { player, character } = useGameState.getState();
  if (!player?.mapName || !character) {
    return;
  }
  const level = character?.skillLevels.reduce(
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
