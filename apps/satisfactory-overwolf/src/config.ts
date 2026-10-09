import { resolveOverwolfConfig } from "@repo/lib";

// title, domain and markerOptions are derived from the canonical games
// registry; only overwolf platform/store identifiers live here.
export const APP_CONFIG = resolveOverwolfConfig({
  name: "satisfactory",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Satisfactory_Map",
  gameClassId: 21646,
  appId: "mgpcocpamehmkagnkjcbabcnnhbebclkiekekhmg",
  discordApplicationId: "1302555829634863165",
  // Same list as the web config (apps\games-web\src\configs\satisfactory.ts).
  supportedLocales: [
    "en",
    "cs",
    "de",
    "es",
    "es-MX",
    "fr",
    "hu",
    "id",
    "it",
    "ja",
    "ko",
    "pl",
    "pt",
    "ru",
    "th",
    "tr",
    "uk",
    "vi",
    "zh-CN",
    "zh-TW",
  ],
});
