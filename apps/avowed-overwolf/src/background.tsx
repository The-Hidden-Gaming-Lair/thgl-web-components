import { initBackground, initGameEventsPlugin } from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";
import { fetchVersion } from "@repo/lib";

const version = await fetchVersion(APP_CONFIG.name);
const typesIdMap = version.data.typesIdMap;

await initGameEventsPlugin(
  {
    processName: "Avowed-Win64-Shipping",
  },
  Object.keys(typesIdMap),
  (actor) => {
    try {
      const mapName = actor.path?.split("/").at(-1)?.split(".")[0];
      if (mapName) {
        const tile = version.data.tiles[mapName];
        if (!tile) {
          console.warn("Map not found", actor.path);
          return undefined;
        }
      }
      return mapName;
    } catch (e) {
      return undefined;
    }
  },
  undefined,
  (location) => {
    if (location.mapName) {
      const tile = version.data.tiles[location.mapName];
      if (tile?.rotation) {
        const rotationAngle = tile.rotation.angle;
        const cx = tile.rotation.center[0];
        const cy = tile.rotation.center[1];
        const radians = (rotationAngle * Math.PI) / 180;

        // Get cosine and sine values
        const cosA = Math.cos(radians);
        const sinA = Math.sin(radians);

        // Extract original X and Y
        const oldX = location.x;
        const oldY = location.y;

        // Step 1: Translate point so that (cx, cy) becomes (0,0)
        const translatedX = oldX - cx;
        const translatedY = oldY - cy;

        // Step 2: Rotate around (0,0)
        const rotatedX = translatedX * cosA - translatedY * sinA;
        const rotatedY = translatedX * sinA + translatedY * cosA;

        // Step 3: Translate back to (cx, cy)
        location.x = rotatedX + cx; // New X'
        location.y = rotatedY + cy; // New Y'
      }
    }
  },
);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
