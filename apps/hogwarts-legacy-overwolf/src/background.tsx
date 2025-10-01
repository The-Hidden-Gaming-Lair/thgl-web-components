import { initBackground, initGameEventsPlugin } from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";
import { fetchVersion } from "@repo/lib";

const version = await fetchVersion(APP_CONFIG.name);
const typesIdMap = version.data.typesIdMap;

const bottomZValues: Record<string, number> = {
  "1": -91350.66,
  "2": -90550,
  "3": -89749,
  "4": -88975,
  "5": -88547,
  "6": -88047,
  "7": -87654,
  "8": -87398,
  "9": -86895,
  "10": -86420,
  "11": -85995,
  "12": -85450,
  "13": -84970.15,
  "14": -84600.2,
  "15": -84006.945,
  "16": -83810,
  "17": -83400,
  "18": -82889,
  "19": -82600,
  "20": -82200,
  "21": -81850,
  "22": -81500,
  "23": -81170,
  "24": -80860,
  "25": -80600,
  "26": -80350,
  "27": -80000,
  "28": -79051,
  "29": -78615,
  "30": -78350,
  "31": -78050,
  "32": -77440,
  "33": -76967,
  "34": -75885,
  "35": -75485,
  "36": -75390,
  "37": -74923,
  "38": -74500,
  "39": -74055,
  "40": -73690,
  "41": -73310,
  "42": -72885,
  "43": -71850,
  "44": -71000,
};

const getLevelByZ = (z: number) => {
  const entry = Object.entries(bottomZValues).find(([level, bottomZ]) => {
    if (bottomZ > z) {
      return false;
    }
    const nextLevel = bottomZValues[(Number(level) + 1).toString()];
    if (nextLevel && nextLevel <= z) {
      return false;
    }
    return true;
  });
  if (entry) {
    return Number(entry[0]);
  }
  return 1;
};

const isInHogwarts = ([x, y]: [number, number]) => {
  const bounds = version.data.tiles["hogwarts-01"].options!.bounds!;
  return (
    x >= bounds[0][1] &&
    x < bounds[1][1] &&
    y >= bounds[0][0] &&
    y < bounds[1][0]
  );
};
const pad = (value: number) => `0${Math.floor(value)}`.slice(-2);
const getHogwartsLevel = (z: number) => {
  const level = getLevelByZ(z);
  const padLevel = pad(level);
  return `hogwarts-${padLevel}`;
};

initGameEventsPlugin(
  {
    processName: "HogwartsLegacy",
  },
  Object.keys(typesIdMap),
  (actor) => {
    const inHogwarts = isInHogwarts([actor.y, actor.x]);
    if (inHogwarts) {
      return getHogwartsLevel(actor.z);
    }
    return "overland";
  },
);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
