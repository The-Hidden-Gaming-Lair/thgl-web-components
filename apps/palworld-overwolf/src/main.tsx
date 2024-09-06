import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { listenToPlugin, initDiscordRPC, logVersion } from "@repo/lib/overwolf";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };
import App from "./app";

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
  throw new Error("Could not find root element!!!!!");
}

await listenToPlugin(Object.keys(typesIdMap));

await initDiscordRPC("1199636411821854730", (updatePresence) => {
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
