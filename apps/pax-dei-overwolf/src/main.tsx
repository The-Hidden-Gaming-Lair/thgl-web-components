import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  initDiscordRPC,
  logVersion,
  listenToGameEvents,
} from "@repo/lib/overwolf";
import App from "./app";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import {
  fetchDict,
  fetchDrawings,
  fetchFilters,
  fetchRegions,
  fetchTiles,
  fetchTypesIdMap,
} from "@repo/lib";
import { Dict } from "@repo/ui/providers";
import { APP_CONFIG } from "./config";

logVersion();

const [enDict, drawings, filters, regions, tiles, typesIdMap] =
  await Promise.all([
    fetchDict(APP_CONFIG.name),
    fetchDrawings(APP_CONFIG.name),
    fetchFilters(APP_CONFIG.name),
    fetchRegions(APP_CONFIG.name),
    fetchTiles(APP_CONFIG.name),
    fetchTypesIdMap(APP_CONFIG.name),
  ]);
const enDictMerged = { ...enDictGlobal, ...enDict } as Dict;

const el = document.getElementById("root");
if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App
        dict={enDictMerged}
        drawings={drawings}
        filters={filters}
        regions={regions}
        tiles={tiles}
        typesIdMap={typesIdMap}
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
    "pax-dei",
    "Pax Dei",
    "thgl",
    "Pax Dei Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Pax%20Dei?ref=discordrpc",
    "",
    "",
  ]);
});
