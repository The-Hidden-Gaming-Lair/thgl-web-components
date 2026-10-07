import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

export const soulmask = resolveAppConfig({
  name: "soulmask",
  supportedLocales: [
    "de",
    "en",
    "es",
    "fr",
    "ja",
    "ko",
    "pt-BR",
    "ru",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Cloud Mist Forest Map",
      description:
        "config.internalLinks.maps-Cloud%20Mist%20Forest.description",
      href: "/maps/Cloud%20Mist%20Forest",
      iconName: "Map",
      // Inlined getPreviewImageUrl("soulmask", "Level01")
      bgImage: `${DATA_FORGE_CDN_URL}/soulmask/map-tiles/Level01/preview.webp`,
      linkText: "config.internalLinks.maps-Cloud%20Mist%20Forest.linkText",
    },
    {
      title: "Shifting Sands Map",
      description: "config.internalLinks.maps-Shifting%20Sands.description",
      href: "/maps/Shifting%20Sands",
      iconName: "Map",
      // Inlined getPreviewImageUrl("soulmask", "DLC_Level01")
      bgImage: `${DATA_FORGE_CDN_URL}/soulmask/map-tiles/DLC_Level01/preview.webp`,
      linkText: "config.internalLinks.maps-Shifting%20Sands.linkText",
    },
  ],
  promoLinks: [],
  externalLinks: [
    {
      href: "https://soulmask.gaming.tools/",
      title: "database",
    },
  ],
  keywords: [
    "Chests",
    "Dungeons",
    "Teleporters",
    "Resources",
    "Animals",
    "NPCs",
  ],
  topFilters: ["teleporter", "dungeon", "chest_mysterious", "boss_altar"],
});
