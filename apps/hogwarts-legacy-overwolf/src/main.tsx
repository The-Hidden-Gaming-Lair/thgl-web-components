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

await listenToPlugin(Object.keys(typesIdMap), (path) => {
  return path.split("/")[4]?.split(".")[0];
});

await initDiscordRPC("1262830990053605457", (updatePresence) => {
  updatePresence([
    "",
    "Playing",
    "hogwarts-legacy",
    "Hogwarts Legacy",
    "thgl",
    "Hogwarts Legacy Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Hogwarts%20Legacy%20Map?ref=discordrpc",
    "",
    "",
  ]);
});
