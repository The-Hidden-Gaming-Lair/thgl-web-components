import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { listenToPlugin, initDiscordRPC } from "@repo/lib/overwolf";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };
import App from "./app";
import tiles from "./coordinates/tiles.json" assert { type: "json" };

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

const bottomZValues: Record<string, number> = {
  "1": -91350.66,
  "2": -90550,
  "3": -89749,
  "4": -88975,
  "5": -88547,
  "6": -88047,
  "7": -87654,
  "8": -87398,
  "9": -86895,
  "10": -86420,
  "11": -85995,
  "12": -85450,
  "13": -84970.15,
  "14": -84600.2,
  "15": -84006.945,
  "16": -83810,
  "17": -83400,
  "18": -82889,
  "19": -82600,
  "20": -82200,
  "21": -81850,
  "22": -81500,
  "23": -81170,
  "24": -80860,
  "25": -80600,
  "26": -80350,
  "27": -80000,
  "28": -79051,
  "29": -78615,
  "30": -78350,
  "31": -78050,
  "32": -77440,
  "33": -76967,
  "34": -75885,
  "35": -75485,
  "36": -75390,
  "37": -74923,
  "38": -74500,
  "39": -74055,
  "40": -73690,
  "41": -73310,
  "42": -72885,
  "43": -71850,
  "44": -71000,
};

const getLevelByZ = (z: number) => {
  const entry = Object.entries(bottomZValues).find(([level, bottomZ]) => {
    if (bottomZ > z) {
      return false;
    }
    const nextLevel = bottomZValues[(Number(level) + 1).toString()];
    if (nextLevel && nextLevel <= z) {
      return false;
    }
    return true;
  });
  if (entry) {
    return Number(entry[0]);
  }
  return 1;
};

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
