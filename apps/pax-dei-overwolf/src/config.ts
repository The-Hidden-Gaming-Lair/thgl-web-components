import { resolveOverwolfConfig } from "@repo/lib";

// DISCONTINUED (2026-09-08): do NOT release this app anymore. Its memory
// reading relied on KsDumper, which is no longer supported; Pax Dei live
// tracking now runs in the THGLApp companion (invite-only). The release
// workflow (.github/workflows/pax-dei-preview.yml) is manual-only.

// title, domain and markerOptions are derived from the canonical games
// registry; only overwolf platform/store identifiers live here.
export const APP_CONFIG = resolveOverwolfConfig({
  name: "pax-dei",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Pax_Dei_Map",
  gameClassId: 23626,
  appId: "kgfnjdoonhclpamjbhiohlkbolgdmepfaimbdfjo",
  discordApplicationId: "1308777591305539675",
});
