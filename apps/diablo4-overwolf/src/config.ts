import { resolveOverwolfConfig } from "@repo/lib";

// title, domain and markerOptions are derived from the canonical games
// registry; only overwolf platform/store identifiers live here.
export const APP_CONFIG = resolveOverwolfConfig({
  name: "diablo4",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map",
  gameClassId: 22700,
  appId: "olbbpfjombddiijdbjeeegeclifleaifdeonllfd",
  discordApplicationId: "1182968067802812456",
  // Same list as the web config (apps\games-web\src\configs\diablo4.ts).
  supportedLocales: [
    "en",
    "de",
    "es",
    "es-MX",
    "fr",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-BR",
    "ru",
    "tr",
    "zh-CN",
    "zh-TW",
  ],
});
