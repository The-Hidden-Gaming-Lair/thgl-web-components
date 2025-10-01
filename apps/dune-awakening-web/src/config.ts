import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "dune-awakening",
  title: "Dune: Awakening",
  domain: "duneawakening",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-BR",
    "ru",
    "tr",
    "uk",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      href: "/maps/Hagga%20Basin",
      title: "config.internalLinks.hagga.title",
      description: "config.internalLinks.hagga.description",
      linkText: "config.internalLinks.hagga.linkText",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/dune-awakening/map-tiles/survival_1/preview.webp?v=3",
    },
    {
      href: "/maps/Arrakeen",
      title: "config.internalLinks.arrakeen.title",
      description: "config.internalLinks.arrakeen.description",
      linkText: "config.internalLinks.arrakeen.linkText",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/dune-awakening/map-tiles/sh_arrakeen/preview.webp?v=3",
    },
    {
      href: "/maps/Harko%20Village",
      title: "config.internalLinks.harko.title",
      description: "config.internalLinks.harko.description",
      linkText: "config.internalLinks.harko.linkText",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/dune-awakening/map-tiles/sh_harkovillage/preview.webp?v=3",
    },
    {
      href: "/maps/The%20Deep%20Desert",
      title: "config.internalLinks.deep.title",
      description: "config.internalLinks.deep.description",
      linkText: "config.internalLinks.deep.linkText",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/dune-awakening/map-tiles/deepdesert_1/preview.webp?v=3",
    },
    {
      href: "/private-servers",
      title: "config.internalLinks.private.title",
      description: "config.internalLinks.private.description",
      linkText: "config.internalLinks.private.linkText",
      iconName: "Server",
      bgImage: "/private-servers-tile.webp",
    },
    {
      href: "/guides",
      title: "config.internalLinks.guides.title",
      linkText: "config.internalLinks.guides.linkText",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Landsraad%20House%20Representatives",
      title: "config.internalLinks.landsraad.title",
      linkText: "config.internalLinks.landsraad.linkText",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Deserters",
      title: "config.internalLinks.deserters.title",
      linkText: "config.internalLinks.deserters.linkText",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Scavengers",
      title: "config.internalLinks.scavengers.title",
      linkText: "config.internalLinks.scavengers.linkText",
      iconName: "BookOpen",
    },
  ],
  // promoLinks: [
  //   {
  //     href: "/private-servers",
  //     title: "config.promo.save10.title",
  //   },
  // ],
  externalLinks: [
    {
      href: "https://dune.gaming.tools/",
      title: "config.external.database.title",
    },
  ],
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 10000,
      zDistance: 400,
    },
  },
  keywords: [
    "config.keywords.trials",
    "config.keywords.resources",
    "config.keywords.trainers",
  ],
  withoutLiveMode: true,
};
