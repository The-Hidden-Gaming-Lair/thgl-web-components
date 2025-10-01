import {
  type ActorPlayer,
  initBackground,
  listenToGEP,
} from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";

const SCALE = 0.083492;
const DEG_45 = Math.PI / 4; // 45 degrees in radians
const OFFSET = {
  x: 113.2,
  y: -227.4,
};
const normalizePoint = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const scaledX = x * SCALE;
  const scaledY = y * SCALE;
  const rotatedX = scaledX * Math.cos(DEG_45) - scaledY * Math.sin(DEG_45);
  const rotatedY = scaledX * Math.sin(DEG_45) + scaledY * Math.cos(DEG_45);
  return {
    x: (-rotatedX + OFFSET.x) / 1.65,
    y: (-rotatedY + OFFSET.y) / 1.65,
    z,
  };
};

const prevPlayer: ActorPlayer = {
  address: 0,
  type: "",
  path: "",
  x: 0,
  y: 0,
  z: 0,
  r: 0,
};
let lastTerritory = 0;

listenToGEP(
  APP_CONFIG.gameClassId,
  ["match_info", "location", "me"],
  (gameInfo) => {
    if (!gameInfo?.match_info) {
      return null;
    }
    const player: ActorPlayer = {
      address: 0,
      type: "",
      path: "",
      x: 0,
      y: 0,
      z: 0,
      r: 0,
      mapName: "Sanctuary",
    };

    const position = normalizePoint(
      JSON.parse(gameInfo.match_info.location) as {
        y: number;
        x: number;
        z: number;
      },
    );
    player.x = position.y;
    player.y = position.x;
    player.z = position.z;

    let map = {
      area: 0,
      territory: 0,
    };
    try {
      map = JSON.parse(gameInfo.match_info.map) as {
        area: number;
        territory: number;
      };
    } catch (err) {
      //
    }
    if (
      prevPlayer.x !== player.x ||
      prevPlayer.y !== player.y ||
      lastTerritory !== map.territory
    ) {
      const rotation =
        (Math.atan2(
          player.y - (prevPlayer.y || player.y),
          player.x - (prevPlayer.x || player.x),
        ) *
          180) /
        Math.PI;
      player.r = rotation;
      prevPlayer.x = player.x;
      prevPlayer.y = player.y;
      const isWorldTerritory = map.territory !== -1;
      prevPlayer.mapName = isWorldTerritory ? "Sanctuary" : map.area.toString();
      lastTerritory = map.territory;
      return player;
    }
    return null;
  },
);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
