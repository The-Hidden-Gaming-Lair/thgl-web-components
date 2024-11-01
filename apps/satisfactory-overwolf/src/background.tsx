import { initBackground, initGameEventsPlugin } from "@repo/lib/overwolf";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };

initBackground(
  21646,
  "fgbodfoepckgplklpccjedophlahnjemfdknhfce",
  "1181323945866178560",
);

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
