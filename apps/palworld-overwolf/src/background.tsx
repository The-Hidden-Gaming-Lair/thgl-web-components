import { initBackground, initTHGLPlugin } from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";

// Live reading, map ids (overworld tree/default + pre-rendered dungeon maps), the dungeon
// floor plan, and the actors-api reporting of map objects + wild-pal sightings (dwell-gated)
// all run inside the unified THGL plugin (THGLOverwolfPlugin.dll,
// THGL.Overwolf.PalworldPlugin), like THGLApp's PalworldDetector.
await initTHGLPlugin(APP_CONFIG.name);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
