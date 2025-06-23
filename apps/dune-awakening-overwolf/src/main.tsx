import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  initDiscordRPC,
  logVersion,
  listenToGameEvents,
} from "@repo/lib/overwolf";
import {
  fetchDict,
  fetchFilters,
  fetchGlobalFilters,
  fetchRegions,
  fetchTiles,
  fetchTypesIdMap,
} from "@repo/lib";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import { APP_CONFIG } from "./config";
import { Dict } from "@repo/ui/providers";
import { App } from "@repo/ui/overwolf";

logVersion();

const [enDict, filters, regions, tiles, typesIdMap, globalFilters] =
  await Promise.all([
    fetchDict(APP_CONFIG.name),
    fetchFilters(APP_CONFIG.name),
    fetchRegions(APP_CONFIG.name),
    fetchTiles(APP_CONFIG.name),
    fetchTypesIdMap(APP_CONFIG.name),
    fetchGlobalFilters(APP_CONFIG.name),
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
        filters={filters}
        regions={regions}
        tiles={tiles}
        typesIdMap={typesIdMap}
        globalFilters={globalFilters}
      />
    </React.StrictMode>,
  );
} else {
  throw new Error("Could not find root element!!");
}

listenToGameEvents();

await initDiscordRPC(APP_CONFIG.discordApplicationId, (updatePresence) => {
  updatePresence([
    "",
    "Playing",
    "dune-awakening",
    "Dune Awakening",
    "thgl",
    "Dune Awakening Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Dune%20Awakening?ref=discordrpc",
    "",
    "",
  ]);
});
