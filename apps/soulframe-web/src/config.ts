import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "soulframe",
  title: "Soulframe",
  domain: "soulframe",
  supportedLocales: ["en"],
  appUrl: null,
  internalLinks: [
    {
      title: "Midrath Map",
      description: "Navigate Soulframe's Midrath with our interactive maps.",
      href: "/maps/Midrath",
      iconName: "Map",
      bgImage: "https://data.th.gl/soulframe/map-tiles/Midrath/preview.webp",
      linkText: "Explore the Midrath Map",
    },
    {
      href: "/guides",
      title: "config.internalLinks.guides.title",
      linkText: "config.internalLinks.guides.linkText",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Shrine",
      title: "Shrine",
      linkText: "Discover all Shrines",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Dungeon",
      title: "Dungeon",
      linkText: "Discover all Dungeons",
      iconName: "BookOpen",
    },
    {
      href: "/guides/World%20Tree",
      title: "World Tree",
      linkText: "Discover all World Trees",
      iconName: "BookOpen",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["World Trees", "Shrines", "Dungeons", "Items"],
};
