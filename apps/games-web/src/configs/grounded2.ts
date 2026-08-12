import { resolveAppConfig } from "@repo/lib";

export const grounded2 = resolveAppConfig({
  name: "grounded2",
  supportedLocales: [
    "en",
    "de",
    "es",
    "es-MX",
    "fr",
    "it",
    "ja",
    "ko",
    "pt-BR",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: null,
  // Map cards (Brookhollow Park + The Abyss) are auto-generated from the map
  // list — no manual internalLinks map entries (they'd shadow the richer cards).
  internalLinks: [],
  promoLinks: [],
  externalLinks: [],
  keywords: ["Wonders", "Ominent Facilities", "Resources"],
});
