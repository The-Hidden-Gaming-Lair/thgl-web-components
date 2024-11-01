import { initBackground, initGameEventsPlugin } from "@repo/lib/overwolf";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };

initBackground(
  24300,
  "gjohaodckfkkodlmmmmeifkdkifddegkleppngad",
  "1249803392822546512",
);

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
