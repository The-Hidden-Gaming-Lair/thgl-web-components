import {
  type GameEventsPlugin,
  initBackground,
  initGameEventsPlugin,
  MESSAGES,
} from "@repo/lib/overwolf";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };

initBackground(
  23186,
  "gjohaodckfkkodlmmmmeifkdkifddegkleppngad",
  "1181323945866178560",
);

type PaliaEventsPlugin = {
  GetValeriaCharacter: (
    callback: (valeriaCharacter: ValeriaCharacter) => void,
    onError: (err: string) => void,
  ) => void;
} & GameEventsPlugin;

export interface ValeriaCharacter {
  name: string;
  guid: string;
  giftHistory: VillagerGiftHistory[];
  skillLevels: SkillLevels[];
  lastKnownPrimaryHousingPlotValue: number;
}

export interface VillagerGiftHistory {
  villagerCoreId: number;
  itemPersistId: number;
  lastGiftedMs: number;
  associatedPreferenceVersion: number;
}

export interface SkillLevels {
  type: string;
  level: number;
  xpGainedThisLevel: number;
}

const gameEventsPlugin = await initGameEventsPlugin<PaliaEventsPlugin>(
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
      let y = (location.y % 65000) - 55000;
      if (y < -40000) {
        y += 65000;
      }
      location.x = x;
      location.y = y;
    }
  },
  (actor) => {
    return !actor.hidden;
  },
);

setInterval(() => {
  gameEventsPlugin.GetValeriaCharacter(
    (valeriaCharacter) => {
      if (valeriaCharacter) {
        window.gameEventBus.trigger(MESSAGES.CHARACTER, valeriaCharacter);
      }
    },
    () => {
      //
    },
  );
}, 10000);
