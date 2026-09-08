import "./styles/globals.css";
import "@repo/ui/styles/globals.css";
import "@repo/ui/fonts/inter.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  initDiscordRPC,
  logVersion,
  listenToGameEvents,
} from "@repo/lib/overwolf";
import { Dict, fetchDict, fetchVersion, useGameState } from "@repo/lib";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import { APP_CONFIG } from "./config";
import { App } from "@repo/ui/overwolf";
import { AdditionalContent } from "@repo/ui/content";

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
        drawings={version.data.drawings}
        typesIdMap={version.data.typesIdMap}
        version={version}
        additionalFilters={<AdditionalContent items={["PlayerDetails"]} />}
      />
    </React.StrictMode>,
  );
} else {
  throw new Error("Could not find root element!!");
}

listenToGameEvents();

const checkPointInsidePolygon = (
  point: [number, number],
  polygon: [number, number][],
) => {
  const x = point[0];
  const y = point[1];

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

await initDiscordRPC(APP_CONFIG.discordApplicationId, (updatePresence) => {
  const { player, character } = useGameState.getState();

  if (!player) {
    return;
  }
  const region = version.data.regions.find(
    (region) =>
      region.mapName === player.mapName &&
      checkPointInsidePolygon(
        [player.x, player.y],
        region.border as [number, number][],
      ),
  );

  updatePresence([
    region?.id ?? "",
    character?.serverName ?? "Playing",
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
