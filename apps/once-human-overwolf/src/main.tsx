import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { listenToPlugin, initDiscordRPC } from "@repo/lib/overwolf";
import { useGameState } from "@repo/lib";
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

await listenToPlugin([]);

useGameState.subscribe((state) => state.actors);

await initDiscordRPC("1271431538675814461", (updatePresence) => {
  updatePresence([
    "",
    "Playing",
    "once-human",
    "Once Human",
    "thgl",
    "Once Human Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Once%20Human?ref=discordrpc",
    "",
    "",
  ]);
});
