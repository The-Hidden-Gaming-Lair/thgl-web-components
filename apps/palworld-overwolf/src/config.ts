import { resolveOverwolfConfig } from "@repo/lib";

// title, domain and markerOptions are derived from the canonical games
// registry; only overwolf platform/store identifiers live here.
export const APP_CONFIG = resolveOverwolfConfig({
  name: "palworld",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Palworld-Interactive-map",
  gameClassId: 23944,
  appId: "ebafpjfhleenmkcmdhlbdchpdalblhiellgfmmbb",
  discordApplicationId: "1199636411821854730",
  // Same list as the web config (apps\games-web\src\configs\palworld.ts).
  supportedLocales: [
    "en",
    "de",
    "es",
    "es-MX",
    "fr",
    "id",
    "it",
    "ko",
    "pl",
    "pt",
    "ru",
    "th",
    "tr",
    "vi",
    "zh-CN",
    "zh-TW",
  ],
});
