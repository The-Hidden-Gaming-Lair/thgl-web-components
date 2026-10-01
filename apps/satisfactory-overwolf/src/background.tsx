import { initBackground, initTHGLPlugin } from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";

// Live reading and the map's (UE.Y, UE.X) coordinate swap for player + actors run inside
// the unified THGL plugin (THGLOverwolfPlugin.dll, THGL.Overwolf.SatisfactoryPlugin).
await initTHGLPlugin(APP_CONFIG.name);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
