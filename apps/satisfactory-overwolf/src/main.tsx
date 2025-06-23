import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  initDiscordRPC,
  listenToGameEvents,
  logVersion,
} from "@repo/lib/overwolf";
import { fetchVersion } from "@repo/lib";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import { APP_CONFIG } from "./config";
import { Dict } from "@repo/ui/providers";
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
        filters={version.data.filters}
        regions={version.data.regions}
        tiles={version.data.tiles}
        typesIdMap={version.data.typesIdMap}
        version={version}
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
