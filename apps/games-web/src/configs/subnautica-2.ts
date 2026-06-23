import { resolveAppConfig } from "@repo/lib";

export const subnautica2 = resolveAppConfig({
  name: "subnautica-2",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pt",
    "ru",
    "uk",
    "zh-CN",
  ],
  appUrl: null,
  internalLinks: [
    {
      title: "The Crater Map",
      description:
        "Find resource deposits, wrecks, and points of interest across Subnautica 2's Crater with our interactive map.",
      href: "/maps/The%20Crater",
      iconName: "Map",
      linkText: "Explore the Crater Map",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["Resource Deposits", "Titanium", "Quartz", "Points of Interest"],
  topFilters: ["resource_titanium", "resource_quartz", "poi"],
});
