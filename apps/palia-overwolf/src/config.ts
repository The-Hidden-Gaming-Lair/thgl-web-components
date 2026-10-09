import { resolveOverwolfConfig } from "@repo/lib";

// title, domain and markerOptions are derived from the canonical games
// registry; only overwolf platform/store identifiers live here.
export const APP_CONFIG = resolveOverwolfConfig({
  name: "palia",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Palia_Map",
  gameClassId: 23186,
  appId: "fgbodfoepckgplklpccjedophlahnjemfdknhfce",
  discordApplicationId: "1181323945866178560",
  // Same list as the web config (apps\games-web\src\configs\palia.ts).
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pt-BR",
    "zh-CN",
    "zh-TW",
  ],
});
