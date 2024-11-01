import { initBackground, initGameEventsPlugin } from "@repo/lib/overwolf";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };

initBackground(
  21646,
  "fgbodfoepckgplklpccjedophlahnjemfdknhfce",
  "1181323945866178560",
);

await initGameEventsPlugin("", Object.keys(typesIdMap));
