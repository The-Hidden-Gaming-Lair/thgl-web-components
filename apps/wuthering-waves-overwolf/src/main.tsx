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
  throw new Error("Could not find root element!!");
}

listenToGameEvents();

await initDiscordRPC("1249803392822546512", (updatePresence) => {
  updatePresence([
    "",
    "Playing",
    "wuthering",
    "Wuthering Waves",
    "thgl",
    "Wuthering Waves Map – The Hidden Gaming Lair",
    true,
    0,
    "Get The App",
    "https://www.th.gl/apps/Wuthering%20Waves?ref=discordrpc",
    "",
    "",
  ]);
});
