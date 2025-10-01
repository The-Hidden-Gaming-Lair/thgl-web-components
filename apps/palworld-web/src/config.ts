import { games, type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  game: games.find((g) => g.id === "palworld")!,
  name: "palworld",
  title: "Palworld",
  domain: "palworld",
  supportedLocales: ["en"],
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Palworld-Interactive-map",
  markerOptions: {
    radius: 6,
    // playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 400,
    },
  },
  internalLinks: [
    {
      href: "/maps/Palpagos%20Island",
      title: "Palpagos Island Map",
      description: "Navigate Palpagos Island with our interactive maps.",
      iconName: "Map",
      bgImage: "https://data.th.gl/palworld/map-tiles/default/preview.webp",
      linkText: "Explore the Palpagos Island Map",
    },
    {
      href: "/guides",
      title: "All Guides",
      iconName: "BookOpen",
      linkText: "Discover all Locations",
    },
    {
      href: "/guides/Alpha%20Pals",
      title: "Alpha Pals Guide",
      iconName: "BookOpen",
      linkText: "Discover all Alpha Pals",
    },
    {
      href: "/guides/Bounties",
      title: "Bounties Guide",
      iconName: "BookOpen",
      linkText: "Discover all Bounties",
    },
    {
      href: "/guides/Lifmunk%20Effigy",
      title: "Lifmunk Effigy Guide",
      iconName: "BookOpen",
      linkText: "Discover all Lifmunk Effigy",
    },
  ],
  externalLinks: [],
  keywords: ["Tides of Terraria", "Feybreak", "Predator & Alpha Pals"],
};
