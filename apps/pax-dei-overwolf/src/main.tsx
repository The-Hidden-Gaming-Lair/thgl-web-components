import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  initDiscordRPC,
  logVersion,
  listenToGameEvents,
} from "@repo/lib/overwolf";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import { fetchVersion } from "@repo/lib";
import { Dict } from "@repo/ui/providers";
import { APP_CONFIG } from "./config";
import { App } from "@repo/ui/overwolf";

logVersion();

const version = await fetchVersion(APP_CONFIG.name);
const enDictMerged = { ...enDictGlobal, ...version.data.enDict } as Dict;

const el = document.getElementById("root");
if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App
        appConfig={APP_CONFIG}
        dict={enDictMerged}
        drawings={version.data.drawings}
        filters={version.data.filters}
        regions={version.data.regions}
        tiles={version.data.tiles}
        typesIdMap={version.data.typesIdMap}
        version={version}
        hideAds
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
