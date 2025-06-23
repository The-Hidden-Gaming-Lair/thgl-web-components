import {
  type Actor,
  type GameEventsPlugin,
  initBackground,
  initGameEventsPlugin,
  MESSAGES,
  promisifyOverwolf,
} from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";
import { fetchVersion } from "@repo/lib";

const version = await fetchVersion(APP_CONFIG.name);
const typesIdMap = version.data.typesIdMap;

type PaliaEventsPlugin = {
  GetValeriaCharacter: (
    callback: (valeriaCharacter: ValeriaCharacter | null) => void,
    onError: (err: string) => void,
  ) => void;
  GetCurrentGiftPreferences: (
    callback: (currentGiftPreferences: CurrentGiftPreferences) => void,
    onError: (err: string) => void,
  ) => void;
  IsModuleLoaded: (
    moduleName: string,
    callback: (isLoaded: boolean) => void,
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

export interface CurrentGiftPreferences {
  preferenceResetTime: {
    dayOfWeek: number;
    hour: number;
    minute: number;
  };
  preferenceDataVersionNumber: number;
  currentPreferenceData: {
    villagerCoreId: number;
    currentGiftPreferences: number[];
  }[];
}

const manifest = await promisifyOverwolf(
  overwolf.extensions.current.getManifest,
)();
const appVersion = manifest.meta.version;

let lastSend = 0;
let lastActorAddresses: number[] = [];

const gameEventsPlugin = await initGameEventsPlugin<PaliaEventsPlugin>(
  {
    onActors: sendActorsToAPI,
  },
  Object.keys(typesIdMap),
  (actor) => {
    if (!actor.path) {
      return;
    }
    if (actor.path.includes("Maps/Village")) {
      return "VillageWorld";
    } else if (actor.path.includes("Maps/AZ1")) {
      return "AdventureZoneWorld";
    } else if (actor.path.includes("Maps/AZ2")) {
      return "AZ2_Root";
    } else if (
      actor.path.includes("Maps/MajiMarket") ||
      actor.path.includes("Maps/Events/Village_Fairgrounds")
    ) {
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

function sendActorsToAPI(actors: Actor[]): void {
  if (Date.now() - lastSend < 10000) {
    return;
  }

  lastSend = Date.now();

  const newActors = actors.filter((actor) => {
    const id = typesIdMap[actor.type as keyof typeof typesIdMap];
    if (!id) {
      return false;
    }
    if (lastActorAddresses.includes(actor.address)) {
      return false;
    }
    return true;
  });
  lastActorAddresses = actors.map((actor) => actor.address);
  if (newActors.length === 0) {
    return;
  }

  const staticActors = newActors.map(({ address, path, ...actor }) => actor);

  fetch("https://palia-api.th.gl/nodes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "App-Version": appVersion,
    },
    body: JSON.stringify(staticActors),
  }).catch(() => null);
}

setInterval(() => {
  gameEventsPlugin.GetCurrentGiftPreferences(
    (currentGiftPreferences) => {
      fetch("https://palia-api.th.gl/weekly-wants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "App-Version": appVersion,
        },
        body: JSON.stringify(currentGiftPreferences),
      }).catch(() => null);
    },
    () => {
      //
    },
  );
}, 30000);

let prevValeriaCharacterJson = "";
setInterval(() => {
  gameEventsPlugin.IsModuleLoaded("OriginPalia", (isOriginLoaded) => {
    gameEventsPlugin.GetValeriaCharacter(
      (valeriaCharacter) => {
        if (valeriaCharacter) {
          const actor = {
            type: "BP_ValeriaCharacter_C",
            mapName: "",
            x: 0,
            y: 0,
            z: 0,
            r: 0,
            props: {
              ...valeriaCharacter,
              suspicious: isOriginLoaded,
            },
          };
          fetch("https://palia-api.th.gl/nodes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "App-Version": appVersion,
            },
            body: JSON.stringify([actor]),
          }).catch(() => null);

          const valeriaCharacterJson = JSON.stringify(valeriaCharacter);
          if (valeriaCharacterJson === prevValeriaCharacterJson) {
            return;
          }
          prevValeriaCharacterJson = valeriaCharacterJson;
          window.gameEventBus.trigger(MESSAGES.CHARACTER, valeriaCharacter);
        }
      },
      () => {},
    );
  });
}, 20000);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
