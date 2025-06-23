import { initBackground, initGameEventsPlugin } from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";
import { fetchTypesIdMap } from "@repo/lib";

const typesIdMap = await fetchTypesIdMap(APP_CONFIG.name);
initGameEventsPlugin(
  { processName: "DuneSandbox-Win64-Shipping", moduleNames: [] },
  Object.keys(typesIdMap),
  (actor) => {
    const parts = actor.path?.split("/");
    if (!parts) {
      return undefined;
    }
    const mapName = parts[5] ?? "default";
    return mapName;
  },
);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
