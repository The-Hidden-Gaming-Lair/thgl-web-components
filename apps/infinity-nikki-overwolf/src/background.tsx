import { initBackground, initGameEventsPlugin } from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";
import { fetchVersion } from "@repo/lib";

const version = await fetchVersion(APP_CONFIG.name);
const typesIdMap = version.data.typesIdMap;

await initGameEventsPlugin(
  {
    processName: "X6Game-Win64-Shipping",
    invertR: true,
    withoutLiveMode: APP_CONFIG.withoutLiveMode,
  },
  Object.keys(typesIdMap),
);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
