import { initBackground, initTHGLPlugin } from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";

// Live reading, map names, housing-plot coordinates, world id, and the palia-api reports
// (spawn nodes with honey-lure exclusion, world heartbeat, weekly wants, leaderboard) all
// run inside the unified THGL plugin (THGLOverwolfPlugin.dll, THGL.Overwolf.PaliaPlugin),
// like THGLApp's PaliaDetector. The app only forwards its messages and settings.
await initTHGLPlugin(APP_CONFIG.name);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
