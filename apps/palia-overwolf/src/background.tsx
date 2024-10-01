import { initBackground, initGameEventsPlugin } from "@repo/lib/overwolf";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };

initBackground(
  23186,
  "gjohaodckfkkodlmmmmeifkdkifddegkleppngad",
  "1181323945866178560",
);

initGameEventsPlugin(
  "",
  Object.keys(typesIdMap),
  (actor) => {
    if (!actor.path) {
      return;
    }
    if (actor.path.includes("Maps/Village")) {
      return "VillageWorld";
    } else if (actor.path.includes("Maps/AZ1")) {
      return "AdventureZoneWorld";
    } else if (actor.path.includes("Maps/MajiMarket")) {
      return "MajiMarket";
    } else if (actor.path.includes("Maps/HousingMaps")) {
      return "HousingPlot";
    }
  },
  undefined,
  (location) => {
    if (location.mapName === "HousingPlot") {
      const x = (location.x % 65000) + 35000;
      const y = (location.y % 65000) - 55000;
      location.x = x;
      location.y = y;
    }
  },
);
