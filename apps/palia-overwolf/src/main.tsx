import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  initDiscordRPC,
  logVersion,
  listenToGameEvents,
} from "@repo/lib/overwolf";
import { useGameState, fetchDict, fetchVersion, Dict } from "@repo/lib";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import { APP_CONFIG } from "./config";
import { App } from "@repo/ui/overwolf";
import {
  PaliaActiveWorlds,
  PaliaGrid,
  PaliaGridToggle,
  PaliaTime,
  PaliaWeeklyWants,
  PaliaWorldCodeRequest,
} from "@repo/ui/data";

logVersion();

const [version, enDict] = await Promise.all([
  fetchVersion(APP_CONFIG.name),
  fetchDict(APP_CONFIG.name),
]);
const enDictMerged = { ...enDictGlobal, ...enDict } as Dict;

const el = document.getElementById("root");
if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App
        appConfig={APP_CONFIG}
        dict={enDictMerged}
        filters={version.data.filters}
        regions={version.data.regions}
        tiles={version.data.tiles}
        typesIdMap={version.data.typesIdMap}
        version={version}
        additionalFilters={
          <>
            <PaliaWeeklyWants />
            <PaliaActiveWorlds />
            <PaliaGridToggle />
          </>
        }
        lockedWindowComponents={<PaliaTime />}
        additionalComponents={
          <>
            <PaliaGrid />
            <PaliaWorldCodeRequest />
          </>
        }
      />
    </React.StrictMode>,
  );
} else {
  throw new Error("Could not find root element!!");
}

listenToGameEvents();

await initDiscordRPC(APP_CONFIG.discordApplicationId, (updatePresence) => {
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
