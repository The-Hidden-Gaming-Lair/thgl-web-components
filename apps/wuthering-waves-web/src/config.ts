import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "wuthering-waves",
  title: "Wuthering Waves",
  domain: "wuthering",
  supportedLocales: ["en"],
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Wuthering_Waves_Map",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 400,
    },
  },
  internalLinks: [
    {
      title: "Overworld Map",
      description:
        "Navigate Wuthering Waves expansive world with our interactive maps.",
      href: "/maps/Overworld",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/wuthering-waves/map-tiles/AkiWorld_WP/preview.webp",
      linkText: "Explore the Overworld Map",
    },
    {
      title: "Fabricatorium of the Deep Map",
      description:
        "Explore the Fabricatorium of the Deep with our interactive maps.",
      href: "/maps/Fabricatorium%20of%20the%20Deep",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/wuthering-waves/map-tiles/WP_HDSYC/preview.webp",
      linkText: "View the Fabricatorium of the Deep Map",
    },
    {
      title: "Avinoleum Map",
      description: "Explore the Avinoleum with our interactive maps.",
      href: "/maps/Avinoleum",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/wuthering-waves/map-tiles/WP_DianDaoTa2/preview.webp",
      linkText: "View the Avinoleum Map",
    },
    {
      title: "Tethys' Deep Map",
      description: "Navigate the Tethys' Deep with our interactive maps.",
      href: "/maps/Tethys'%20Deep",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/wuthering-waves/map-tiles/WP_HHA_Underground/preview.webp",
      linkText: "View the Tethys' Deep Map",
    },
    {
      title: "Vault Underground Map",
      description: "Navigate the Vault Underground with our interactive maps.",
      href: "/maps/Vault%20Underground",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/wuthering-waves/map-tiles/WP_JK_Underground/preview.webp",
      linkText: "Open the Vault Underground Map",
    },
    {
      href: "/guides",
      title: "config.internalLinks.guides.title",
      linkText: "config.internalLinks.guides.linkText",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Blue%20Tidal%20Heritage",
      title: "Blue Tidal Heritage",
      linkText: "Discover all Blue Tidal Heritage",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Premium%20Supply%20Chest",
      title: "Premium Supply Chest",
      linkText: "Discover all Premium Supply Chest",
      iconName: "BookOpen",
    },
  ],
  externalLinks: [],
  keywords: [
    "Echoes",
    "Waveplate Activities",
    "Tidal Heritage",
    "Collectibles",
  ],
};
