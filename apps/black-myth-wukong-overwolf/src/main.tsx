import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { listenToPlugin, initDiscordRPC } from "@repo/lib/overwolf";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };
import App from "./app";

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

await listenToPlugin(Object.keys(typesIdMap));

await initDiscordRPC("1276593343354114058", (updatePresence) => {
  updatePresence([
    "",
    "Playing",
    "black-myth-wukong",
    "Black Myth: Wukong",
    "thgl",
    "Black Myth: Wukong Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Black%20Myth:%20Wukong%20Map?ref=discordrpc",
    "",
    "",
  ]);
});
