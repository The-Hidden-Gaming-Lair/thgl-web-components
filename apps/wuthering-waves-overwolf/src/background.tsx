import { initBackground, initGameEventsPlugin } from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";
import { fetchVersion } from "@repo/lib";

const version = await fetchVersion(APP_CONFIG.name);
const typesIdMap = version.data.typesIdMap;
initGameEventsPlugin(
  { processName: "Client-Win64-Shipping" },
  Object.keys(typesIdMap),
  (actor) => {
    const parts = actor.path?.split("/");
    if (!parts) {
      return undefined;
    }
    let mapName = parts[4]?.split(".")[0];
    if (mapName === "Level") {
      mapName = parts[7]?.split(".")[0];
    }
    return mapName;
  },
);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
