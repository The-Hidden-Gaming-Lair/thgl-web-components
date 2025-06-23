import { initBackground, initGameEventsPlugin } from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";
import { fetchVersion } from "@repo/lib";

const version = await fetchVersion(APP_CONFIG.name);
const typesIdMap = version.data.typesIdMap;

await initGameEventsPlugin(
  {
    processName: "FactoryGameSteam-Win64-Shipping",
    moduleNames: [
      "FactoryGameSteam-Core-Win64-Shipping.dll",
      "FactoryGameSteam-Engine-Win64-Shipping.dll",
    ],
  },
  Object.keys(typesIdMap),
  undefined,
  undefined,
  (actor) => {
    const x = actor.x;
    const y = actor.y;
    actor.x = y;
    actor.y = x;
  },
);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
