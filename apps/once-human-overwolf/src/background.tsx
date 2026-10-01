import { initBackground, initTHGLPlugin } from "@repo/lib/overwolf";
import { APP_CONFIG } from "./config";

// Live reading, the map id from the server name + scene, rotation from movement, the
// display rules (deviations next to their containment ball, no fish/plants in a player's
// fish tank / plant box) and the actors-api reporting (dwell-gated gatherables + moving bus
// monsters) all run inside the unified THGL plugin (THGLOverwolfPlugin.dll,
// THGL.Overwolf.OnceHumanPlugin).
await initTHGLPlugin(APP_CONFIG.name);

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
