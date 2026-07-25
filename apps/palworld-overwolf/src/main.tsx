import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  initDiscordRPC,
  logVersion,
  listenToGameEvents,
} from "@repo/lib/overwolf";
import { App } from "@repo/ui/overwolf";
import { Dict, fetchDict, fetchVersion } from "@repo/lib";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import { APP_CONFIG } from "./config";

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
        additionalTooltip={["InGameCoordinates"]}
      />
    </React.StrictMode>,
  );
} else {
  throw new Error("Could not find root element!!!!!");
}

listenToGameEvents();

await initDiscordRPC(APP_CONFIG.discordApplicationId, (updatePresence) => {
  updatePresence([
    "",
    "Palpagos Islands",
    "palworld",
    "Palworld",
    "thgl",
    "Palworld Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Palworld?ref=discordrpc",
    "",
    "",
  ]);
});
